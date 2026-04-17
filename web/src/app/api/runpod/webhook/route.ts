import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { extractFilename } from '@/lib/jobs'
import { AnalysisCompleteEmail } from '@/lib/emails/analysis-complete'
import { AnalysisFailedEmail } from '@/lib/emails/analysis-failed'
import { trackServer } from '@/lib/analytics.server'
import { dispatchJob } from '@/lib/runpod'
import type { InputType } from '@/lib/analytics'

interface RunPodWebhookPayload {
  id: string
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT'
  output?: Record<string, unknown>
  error?: string
}

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.RUNPOD_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: RunPodWebhookPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.id || !payload.status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  // Look up job by RunPod ID
  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('runpod_id', payload.id)
    .single()

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Idempotency: skip if already terminal
  if (job.status === 'completed' || job.status === 'failed') {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Update job status
  const isCompleted = payload.status === 'COMPLETED'
  const isFailed = payload.status === 'FAILED' || payload.status === 'CANCELLED' || payload.status === 'TIMED_OUT'

  const createdAt = job.created_at ? new Date(job.created_at).getTime() : Date.now()
  const durationMs = Date.now() - createdAt
  const inputType = (job.input_type ?? 'video') as InputType

  if (isCompleted && payload.output) {
    await supabaseAdmin
      .from('jobs')
      .update({ status: 'completed', results: payload.output })
      .eq('id', job.id)
    await trackServer('analysis_completed', job.user_id, {
      job_id: job.id,
      input_type: inputType,
      duration_ms: durationMs,
    })
  } else if (isFailed) {
    const errorMsg = payload.error || `Inference ${payload.status.toLowerCase()}`
    await supabaseAdmin
      .from('jobs')
      .update({ status: 'failed', error_message: errorMsg })
      .eq('id', job.id)
    await trackServer('analysis_failed', job.user_id, {
      job_id: job.id,
      error_message: errorMsg,
    })
  } else {
    // Unrecognized status — acknowledge but don't update
    return NextResponse.json({ received: true, status: payload.status })
  }

  // Send email (atomic guard against duplicates)
  const { data: claimed } = await supabaseAdmin
    .from('jobs')
    .update({ email_sent: true })
    .eq('id', job.id)
    .eq('email_sent', false)
    .select('id')
    .single()

  if (claimed) {
    try {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(job.user_id)
      if (user?.email) {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trybrainrank.com'
        const filename = extractFilename(job.video_url)

        if (isCompleted) {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Your BrainRank analysis is ready',
            react: AnalysisCompleteEmail({
              videoFilename: filename,
              resultsUrl: `${baseUrl}/results/${job.id}`,
            }),
          })
        } else {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: "Your BrainRank analysis couldn't be completed",
            react: AnalysisFailedEmail({
              videoFilename: filename,
              uploadUrl: `${baseUrl}/upload`,
              errorMessage: payload.error ?? undefined,
            }),
          })
        }
      }
    } catch (e) {
      console.error('Webhook: failed to send email:', e)
    }
  }

  // Queue promoter: a slot just freed up for this user — dispatch their oldest queued job.
  try {
    const { data: nextQueued } = await supabaseAdmin
      .from('jobs')
      .select('id')
      .eq('user_id', job.user_id)
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextQueued) {
      const outcome = await dispatchJob(supabaseAdmin, nextQueued.id)
      if (outcome.ok) {
        await trackServer('analysis_started', job.user_id, {
          job_id: nextQueued.id,
          input_type: inputType,
          category: null,
          has_text: false,
          is_creator: true,
          credits_remaining: -1,
        })
      }
    }
  } catch (e) {
    console.error('Queue promoter failed:', e)
  }

  return NextResponse.json({ received: true })
}
