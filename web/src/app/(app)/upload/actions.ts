'use server'

import { createClient } from '@/lib/supabase/server'

export async function createJob(videoUrl: string): Promise<string> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      user_id: user.id,
      video_url: videoUrl,
      status: 'pending' as const,
      results: null,
      error_message: null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create job: ${error.message}`)

  return data.id
}
