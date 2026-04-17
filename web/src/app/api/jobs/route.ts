import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCreditStatus, recordCreditUsage } from '@/lib/credits'
import { checkJobCreateLimits } from '@/lib/ratelimit'
import { dispatchJob } from '@/lib/runpod'
import type { Job } from '@/lib/database.types'

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

    // Rate limit (abuse prevention) → reject. Concurrent cap → queue.
    const limitError = await checkJobCreateLimits(supabase, user.id)
    if (limitError && limitError.kind === 'rate_limit') {
      return NextResponse.json(limitError, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limitError.limit),
          'X-RateLimit-Remaining': String(limitError.remaining),
          'X-RateLimit-Reset': String(limitError.reset),
        },
      })
    }
    const shouldQueue = !!limitError && limitError.kind === 'concurrent_cap'

    // Credit gating — check before allowing job creation
    const credits = await getCreditStatus(supabase, user.id)
    if (!credits.canAnalyze) {
      return NextResponse.json(
        {
          error: 'Daily credit limit reached',
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

    // Insert job (pending → dispatchJob will flip to processing; queued stays queued).
    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        video_url,
        status: shouldQueue ? 'queued' : 'pending',
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

    if (shouldQueue) {
      return NextResponse.json({ ...job, status: 'queued' }, { status: 201 })
    }

    const outcome = await dispatchJob(supabase, job.id)
    if (!outcome.ok) {
      const status = outcome.reason === 'no_capacity' ? 503 : 502
      return NextResponse.json(
        {
          error:
            outcome.reason === 'no_capacity'
              ? 'GPU briefly unavailable. Your credit was refunded — please retry.'
              : 'Failed to trigger inference',
        },
        { status }
      )
    }

    return NextResponse.json(
      { ...job, runpod_id: outcome.runpodId, status: 'processing' },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
