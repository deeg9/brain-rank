import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCreditStatus, recordCreditUsage } from '@/lib/credits'
import { jobCreateLimiter } from '@/lib/ratelimit'
import type { Job } from '@/lib/database.types'

const MAX_CONCURRENT_JOBS = 3

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = request.nextUrl.searchParams.get('status')

    let query = supabase
      .from('jobs')
      .select('id, title, video_url, input_type, text_content, text_style, status, results, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status as Job['status'])
    }

    const { data: jobs, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    return NextResponse.json({ jobs: jobs || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Burst rate limit — 10 req / 60s per user
    const rl = await jobCreateLimiter.limit(user.id)
    if (!rl.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Try again shortly.',
          reset_at: rl.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rl.limit),
            'X-RateLimit-Remaining': String(rl.remaining),
            'X-RateLimit-Reset': String(rl.reset),
          },
        }
      )
    }

    // Concurrent-job cap — protect RunPod spend from a runaway user
    const { count: inFlightCount } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])

    if ((inFlightCount ?? 0) >= MAX_CONCURRENT_JOBS) {
      return NextResponse.json(
        {
          error: 'Too many analyses in progress',
          message: `You have ${inFlightCount} running. Wait for one to finish (max ${MAX_CONCURRENT_JOBS} concurrent).`,
          limit: MAX_CONCURRENT_JOBS,
          in_flight: inFlightCount,
        },
        { status: 429 }
      )
    }

    // Credit gating — check before allowing job creation
    const credits = await getCreditStatus(supabase, user.id)
    if (!credits.canAnalyze) {
      return NextResponse.json(
        {
          error: 'Weekly credit limit reached',
          credits: { used: credits.used, limit: credits.limit, remaining: 0 },
          upgrade_url: '/pricing',
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { video_url } = body as { video_url?: string }

    if (!video_url) {
      return NextResponse.json({ error: 'video_url is required' }, { status: 400 })
    }

    if (!video_url.startsWith('http://') && !video_url.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid video URL' }, { status: 400 })
    }

    // Check server configuration
    const apiKey = process.env.RUNPOD_API_KEY
    const endpointId = process.env.RUNPOD_ENDPOINT_ID
    if (!apiKey || !endpointId) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Insert job into Supabase
    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        video_url,
        status: 'pending' as const,
        runpod_id: null,
        results: null,
        error_message: null,
      })
      .select()
      .single()

    if (insertError || !job) {
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }

    // Record credit usage for free tier tracking
    if (!credits.isCreator) {
      await recordCreditUsage(supabase, user.id, (job as { id: string }).id)
    }

    // Call RunPod /run endpoint
    const webhookSecret = process.env.RUNPOD_WEBHOOK_SECRET
    const webhookUrl = webhookSecret
      ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://trybrainrank.com'}/api/runpod/webhook?secret=${encodeURIComponent(webhookSecret)}`
      : undefined

    let runpodResponse: { id: string; status: string }
    try {
      const res = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { video_url },
          ...(webhookUrl ? { webhook: webhookUrl } : {}),
        }),
      })

      if (!res.ok) {
        // RunPod call failed -- mark job as failed
        await supabase
          .from('jobs')
          .update({ status: 'failed', error_message: 'Failed to start inference' })
          .eq('id', job.id)

        return NextResponse.json({ error: 'Failed to trigger inference' }, { status: 502 })
      }

      runpodResponse = await res.json()
    } catch {
      // Network error calling RunPod
      await supabase
        .from('jobs')
        .update({ status: 'failed', error_message: 'Failed to start inference' })
        .eq('id', job.id)

      return NextResponse.json({ error: 'Failed to trigger inference' }, { status: 502 })
    }

    // Update job with RunPod ID and processing status
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({ runpod_id: runpodResponse.id, status: 'processing' as const })
      .eq('id', job.id)
      .select()
      .single()

    if (updateError || !updatedJob) {
      // Job was created and RunPod was triggered, but update failed
      // Return the job with what we know
      return NextResponse.json(
        { ...job, runpod_id: runpodResponse.id, status: 'processing' },
        { status: 201 }
      )
    }

    return NextResponse.json(updatedJob, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
