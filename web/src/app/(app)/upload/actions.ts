'use server'

import { createClient } from '@/lib/supabase/server'
import { checkJobCreateLimits } from '@/lib/ratelimit'
import { getCreditStatus, recordCreditUsage } from '@/lib/credits'
import { type InputType } from '@/lib/database.types'

// Hold time for image-as-video. Locked at 6s — TRIBE v2 needs ≥6s to align
// to its 2-second windows; longer than this risks viewer-boredom artifacts.
const IMAGE_DURATION_SECONDS = 6

export async function createJob(
  videoUrl: string,
  inputType: InputType = 'video',
  textContent?: string | null,
  textStyle?: string | null,
  category?: string | null
): Promise<string> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const limitError = await checkJobCreateLimits(supabase, user.id)
  if (limitError) throw new Error(limitError.message)

  const credits = await getCreditStatus(supabase, user.id)
  if (!credits.canAnalyze) {
    throw new Error(
      `Daily credit limit reached (${credits.used}/${credits.limit}). Resets at 00:00 UTC, or upgrade for unlimited analyses.`
    )
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      user_id: user.id,
      video_url: videoUrl,
      status: 'pending' as const,
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

  // Dispatch to RunPod
  const apiKey = process.env.RUNPOD_API_KEY
  const endpointId = process.env.RUNPOD_ENDPOINT_ID
  if (apiKey && apiKey !== 'placeholder' && endpointId && endpointId !== 'placeholder') {
    const webhookSecret = process.env.RUNPOD_WEBHOOK_SECRET
    const webhookUrl = webhookSecret
      ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://trybrainrank.com'}/api/runpod/webhook?secret=${encodeURIComponent(webhookSecret)}`
      : undefined

    try {
      const runpodRes = await fetch(
        `https://api.runpod.ai/v2/${endpointId}/run`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: {
              video_url: videoUrl,
              input_type: inputType,
              job_id: data.id,
              ...(textContent ? { text_content: textContent } : {}),
              ...(textStyle ? { text_style: textStyle } : {}),
              ...(inputType === 'image' ? { image_duration: IMAGE_DURATION_SECONDS } : {}),
            },
            ...(webhookUrl ? { webhook: webhookUrl } : {}),
          }),
        }
      )

      if (runpodRes.ok) {
        const runpodData = await runpodRes.json()
        await supabase
          .from('jobs')
          .update({ runpod_id: runpodData.id, status: 'processing' as const })
          .eq('id', data.id)
      }
    } catch {
      // RunPod dispatch failed — job stays pending, can be retried
    }
  }

  return data.id
}
