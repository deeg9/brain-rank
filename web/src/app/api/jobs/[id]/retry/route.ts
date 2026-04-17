import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkJobCreateLimits } from '@/lib/ratelimit'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch job
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify ownership -- return 404 to avoid leaking job existence
    if ((job).user_id !== user.id) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Handle cancel action
    let body: Record<string, unknown> = {}
    try {
      body = await _request.json()
    } catch {
      // No body or invalid JSON — treat as retry
    }

    if (body.action === 'cancel') {
      // Cancel the RunPod job if possible
      const apiKey = process.env.RUNPOD_API_KEY
      const endpointId = process.env.RUNPOD_ENDPOINT_ID
      if (apiKey && endpointId && (job).runpod_id) {
        try {
          await fetch(
            `https://api.runpod.ai/v2/${endpointId}/cancel/${(job).runpod_id}`,
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${apiKey}` },
            }
          )
        } catch {
          // Best effort — continue with local cancel even if RunPod cancel fails
        }
      }

      await supabase
        .from('jobs')
        .update({ status: 'failed', error_message: 'Cancelled by user' })
        .eq('id', id)

      return NextResponse.json({ cancelled: true }, { status: 200 })
    }

    // Only allow retry on failed jobs
    if ((job).status !== 'failed') {
      return NextResponse.json({ error: 'Job is not in failed state' }, { status: 400 })
    }

    // Rate limit + concurrent cap — retries count like fresh submissions
    const limitError = await checkJobCreateLimits(supabase, user.id)
    if (limitError) {
      const headers: Record<string, string> =
        limitError.kind === 'rate_limit'
          ? {
              'X-RateLimit-Limit': String(limitError.limit),
              'X-RateLimit-Remaining': String(limitError.remaining),
              'X-RateLimit-Reset': String(limitError.reset),
            }
          : {}
      return NextResponse.json(limitError, { status: 429, headers })
    }

    // Reset job to pending
    await supabase
      .from('jobs')
      .update({
        status: 'pending',
        error_message: null,
        runpod_id: null,
        results: null,
      })
      .eq('id', id)

    // Check server configuration
    const apiKey = process.env.RUNPOD_API_KEY
    const endpointId = process.env.RUNPOD_ENDPOINT_ID
    if (!apiKey || !endpointId) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Re-dispatch to RunPod
    const videoUrl = (job).video_url as string
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
          input: { video_url: videoUrl },
          ...(webhookUrl ? { webhook: webhookUrl } : {}),
        }),
      })

      if (!res.ok) {
        // RunPod call failed -- mark job as failed
        await supabase
          .from('jobs')
          .update({ status: 'failed', error_message: 'Failed to start inference' })
          .eq('id', id)

        return NextResponse.json({ error: 'Failed to trigger inference' }, { status: 502 })
      }

      runpodResponse = await res.json()
    } catch {
      // Network error calling RunPod
      await supabase
        .from('jobs')
        .update({ status: 'failed', error_message: 'Failed to start inference' })
        .eq('id', id)

      return NextResponse.json({ error: 'Failed to trigger inference' }, { status: 502 })
    }

    // Update job with RunPod ID and processing status
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({ runpod_id: runpodResponse.id, status: 'processing' })
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updatedJob) {
      // Update failed -- return what we know
      return NextResponse.json(
        { ...(job), runpod_id: runpodResponse.id, status: 'processing' },
        { status: 200 }
      )
    }

    return NextResponse.json(updatedJob, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
