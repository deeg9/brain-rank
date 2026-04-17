import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, InputType } from '@/lib/database.types'
import { refundCreditUsage } from '@/lib/credits'

// Hold time for image-as-video. Locked at 6s — TRIBE v2 needs ≥6s to align
// to its 2-second windows; longer than this risks viewer-boredom artifacts.
const IMAGE_DURATION_SECONDS = 6

export type DispatchOutcome =
  | { ok: true; runpodId: string }
  | { ok: false; reason: 'no_capacity' | 'config_error' | 'network_error' | 'not_found'; message: string }

/**
 * Dispatch a job to RunPod's /run endpoint and transition its status to 'processing'.
 *
 * On success the job row ends with status='processing' and a runpod_id.
 * On failure the job row ends with status='failed' and error_message set;
 * for free-tier users the credit consumed at job creation is refunded.
 *
 * Reused by:
 *   - createJob (immediate dispatch when under the per-user concurrency cap)
 *   - queue promoter (promotion of a queued job when a slot frees up)
 */
export async function dispatchJob(
  supabase: SupabaseClient<Database>,
  jobId: string
): Promise<DispatchOutcome> {
  const apiKey = process.env.RUNPOD_API_KEY
  const endpointId = process.env.RUNPOD_ENDPOINT_ID
  if (!apiKey || !endpointId || apiKey === 'placeholder' || endpointId === 'placeholder') {
    return { ok: false, reason: 'config_error', message: 'RunPod not configured' }
  }

  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('id, user_id, video_url, input_type, text_content, text_style')
    .eq('id', jobId)
    .single()

  if (fetchError || !job) {
    return { ok: false, reason: 'not_found', message: 'Job not found' }
  }

  const inputType = (job.input_type ?? 'video') as InputType
  const webhookSecret = process.env.RUNPOD_WEBHOOK_SECRET
  const webhookUrl = webhookSecret
    ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://trybrainrank.com'}/api/runpod/webhook?secret=${encodeURIComponent(webhookSecret)}`
    : undefined

  const body = {
    input: {
      video_url: job.video_url,
      input_type: inputType,
      job_id: job.id,
      ...(job.text_content ? { text_content: job.text_content } : {}),
      ...(job.text_style ? { text_style: job.text_style } : {}),
      ...(inputType === 'image' ? { image_duration: IMAGE_DURATION_SECONDS } : {}),
    },
    ...(webhookUrl ? { webhook: webhookUrl } : {}),
  }

  let runpodResponse: { id: string; status: string }
  try {
    const res = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      const isNoCapacity =
        res.status === 503 ||
        res.status === 429 ||
        /capacity|no workers|no gpu|unavailable/i.test(errorText)
      await markJobFailed(
        supabase,
        job.id,
        job.user_id,
        isNoCapacity ? 'GPU briefly unavailable' : 'Failed to start inference'
      )
      return {
        ok: false,
        reason: isNoCapacity ? 'no_capacity' : 'network_error',
        message: isNoCapacity ? 'GPU briefly unavailable' : 'Failed to start inference',
      }
    }

    runpodResponse = (await res.json()) as { id: string; status: string }
  } catch {
    await markJobFailed(supabase, job.id, job.user_id, 'Failed to start inference')
    return { ok: false, reason: 'network_error', message: 'Failed to start inference' }
  }

  const { error: updateError } = await supabase
    .from('jobs')
    .update({ runpod_id: runpodResponse.id, status: 'processing' })
    .eq('id', job.id)

  if (updateError) {
    return { ok: false, reason: 'network_error', message: 'Job dispatched but status update failed' }
  }

  return { ok: true, runpodId: runpodResponse.id }
}

async function markJobFailed(
  supabase: SupabaseClient<Database>,
  jobId: string,
  userId: string,
  errorMessage: string
): Promise<void> {
  await supabase
    .from('jobs')
    .update({ status: 'failed', error_message: errorMessage })
    .eq('id', jobId)
  await refundCreditUsage(supabase, userId, jobId)
}
