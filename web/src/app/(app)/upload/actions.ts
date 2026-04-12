'use server'

import { createClient } from '@/lib/supabase/server'
import { type InputType } from '@/lib/database.types'

export async function createJob(
  videoUrl: string,
  inputType: InputType = 'video',
  textContent?: string | null,
  textStyle?: string | null
): Promise<string> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      user_id: user.id,
      video_url: videoUrl,
      status: 'pending' as const,
      input_type: inputType,
      text_content: textContent ?? null,
      text_style: textStyle ?? null,
      results: null,
      error_message: null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create job: ${error.message}`)

  // Dispatch to RunPod
  const apiKey = process.env.RUNPOD_API_KEY
  const endpointId = process.env.RUNPOD_ENDPOINT_ID
  if (apiKey && apiKey !== 'placeholder' && endpointId && endpointId !== 'placeholder') {
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
            },
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
