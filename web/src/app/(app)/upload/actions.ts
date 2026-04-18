'use server'

import { createClient } from '@/lib/supabase/server'
import { checkJobCreateLimits } from '@/lib/ratelimit'
import { getCreditStatus, recordCreditUsage } from '@/lib/credits'
import { dispatchJob } from '@/lib/runpod'
import { trackServer } from '@/lib/analytics.server'
import { BATCH_LIMITS } from '@/lib/upload-validation'
import { type InputType } from '@/lib/database.types'
import type { BatchItem, CreateJobResult } from './types'

export async function createJob(
  videoUrl: string,
  inputType: InputType = 'video',
  textContent?: string | null,
  textStyle?: string | null,
  category?: string | null
): Promise<CreateJobResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const limitError = await checkJobCreateLimits(supabase, user.id)
  // Rate-limit abuse → still reject (429-equivalent). Concurrent-cap → queue instead.
  if (limitError && limitError.kind === 'rate_limit') {
    throw new Error(limitError.message)
  }
  const shouldQueue = !!limitError && limitError.kind === 'concurrent_cap'

  const credits = await getCreditStatus(supabase, user.id)
  if (!credits.canAnalyze) {
    await trackServer('credit_limit_hit', user.id, {
      credits_used: credits.used,
      credits_limit: credits.limit === Infinity ? -1 : credits.limit,
    })
    throw new Error(
      `Daily credit limit reached (${credits.used}/${credits.limit}). Resets at 00:00 UTC, or upgrade for unlimited analyses.`
    )
  }

  const initialStatus = shouldQueue ? 'queued' : 'pending'

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      user_id: user.id,
      video_url: videoUrl,
      status: initialStatus,
      input_type: inputType,
      text_content: textContent ?? null,
      text_style: textStyle ?? null,
      category: category ?? null,
      is_public: true,
      results: null,
      error_message: null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create job: ${error.message}`)

  if (!credits.isCreator) {
    await recordCreditUsage(supabase, user.id, data.id)
  }

  if (shouldQueue) {
    return { jobId: data.id, status: 'queued' }
  }

  const outcome = await dispatchJob(supabase, data.id)
  if (!outcome.ok) {
    return {
      jobId: data.id,
      status: 'failed',
      message:
        outcome.reason === 'no_capacity'
          ? 'GPU briefly unavailable. Your credit was refunded — please retry.'
          : outcome.message,
    }
  }

  await trackServer('analysis_started', user.id, {
    job_id: data.id,
    input_type: inputType,
    category: category ?? null,
    has_text: !!textContent,
    is_creator: credits.isCreator,
    credits_remaining: credits.remaining === Infinity ? -1 : credits.remaining,
  })

  return { jobId: data.id, status: 'processing' }
}

export async function createBatchJobs(
  items: BatchItem[]
): Promise<{ jobs: CreateJobResult[]; error?: string }> {
  if (items.length === 0) {
    return { jobs: [], error: 'No items to analyze' }
  }
  if (items.length > BATCH_LIMITS.PAID_MAX_FILES) {
    return { jobs: [], error: `Batch size capped at ${BATCH_LIMITS.PAID_MAX_FILES}` }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { jobs: [], error: 'Not authenticated' }
  }

  const credits = await getCreditStatus(supabase, user.id)
  if (!credits.isCreator) {
    return { jobs: [], error: 'Batch upload is available on the Creator plan.' }
  }

  const results: CreateJobResult[] = []
  for (const item of items) {
    try {
      const result = await createJob(
        item.videoUrl,
        item.inputType ?? 'video',
        item.textContent,
        item.textStyle,
        item.category
      )
      results.push(result)
    } catch (err) {
      results.push({
        jobId: '',
        status: 'failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return { jobs: results }
}
