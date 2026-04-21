'use server'

import { createClient } from '@/lib/supabase/server'
import { checkJobCreateLimits } from '@/lib/ratelimit'
import { getCreditStatus, recordCreditUsage } from '@/lib/credits'
import { dispatchJob } from '@/lib/runpod'
import { trackServer } from '@/lib/analytics.server'
import { BATCH_LIMITS } from '@/lib/upload-validation'
import { type InputType } from '@/lib/database.types'
import { CONSENT_VERSION } from '@/lib/consent'
import {
  validatePostEngagement,
  type PostEngagementInput,
} from '@/lib/post-engagement'
import type { BatchItem, CreateJobResult } from './types'

export async function createJob(
  videoUrl: string,
  inputType: InputType = 'video',
  textContent?: string | null,
  textStyle?: string | null,
  category?: string | null,
  engagement?: PostEngagementInput | null
): Promise<CreateJobResult> {
  // Optional real-world engagement metadata. Null URL = user skipped the section.
  const engagementResult = validatePostEngagement(engagement ?? {})
  if (!engagementResult.ok) {
    throw new Error(engagementResult.reason)
  }
  const engagementData = engagementResult.value

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Research-beta: consent is recorded on the user's profile at onboarding.
  // Block uploads for anyone whose profile hasn't accepted the current
  // Contribution Agreement version (legacy users are backfilled by the
  // 20260421_add_consent_to_profiles.sql migration).
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('consent_version_accepted')
    .eq('id', user.id)
    .maybeSingle()
  const acceptedConsent = (profileRow as { consent_version_accepted: string | null } | null)
    ?.consent_version_accepted ?? null
  if (!acceptedConsent || acceptedConsent !== CONSENT_VERSION) {
    throw new Error('CONSENT_REQUIRED')
  }

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
      `Daily credit limit reached (${credits.used}/${credits.limit}). Resets at 00:00 UTC.`
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
      // Research-beta consent provenance — nullable columns added in
      // 20260420_add_consent_to_jobs.sql. Cast keeps TS happy until
      // database.types.ts is regenerated.
      consent_version: acceptedConsent,
      consented_at: new Date().toISOString(),
      // Research-beta engagement snapshot — all nullable, columns added in
      // 20260421_add_engagement_to_jobs.sql.
      posted_url: engagementData.postedUrl,
      posted_platform: engagementData.postedPlatform,
      posted_at: engagementData.postedAt,
      views_count: engagementData.viewsCount,
      likes_count: engagementData.likesCount,
      comments_count: engagementData.commentsCount,
      shares_count: engagementData.sharesCount,
      bookmarks_count: engagementData.bookmarksCount,
      engagement_captured_at: engagementData.engagementCapturedAt,
    } as never)
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
    return { jobs: [], error: 'Batch upload is limited during the research beta.' }
  }

  const results: CreateJobResult[] = []
  for (const item of items) {
    try {
      const result = await createJob(
        item.videoUrl,
        item.inputType ?? 'video',
        item.textContent,
        item.textStyle,
        item.category,
        null
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

// Update self-reported engagement for an existing job. Owner-scoped.
// Pass an empty/cleared input to clear all engagement fields (user unchecks the
// "posted publicly" toggle post-hoc). Returns the refreshed timestamp so the UI
// can update the "as of" chip without a full refetch.
export async function updateJobEngagement(
  jobId: string,
  input: PostEngagementInput
): Promise<{ ok: true; capturedAt: string | null } | { ok: false; error: string }> {
  if (!jobId) return { ok: false, error: 'Missing job id.' }

  const result = validatePostEngagement(input)
  if (!result.ok) {
    return { ok: false, error: result.reason }
  }
  const data = result.value

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('jobs')
    .update({
      posted_url: data.postedUrl,
      posted_platform: data.postedPlatform,
      posted_at: data.postedAt,
      views_count: data.viewsCount,
      likes_count: data.likesCount,
      comments_count: data.commentsCount,
      shares_count: data.sharesCount,
      bookmarks_count: data.bookmarksCount,
      engagement_captured_at: data.engagementCapturedAt,
    } as never)
    .eq('id', jobId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  return { ok: true, capturedAt: data.engagementCapturedAt }
}
