'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { trackServer, identifyServer } from '@/lib/analytics.server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    await identifyServer(data.user.id, { email: data.user.email })
    await trackServer('user_logged_in', data.user.id, { method: 'email' })
  }

  redirect('/dashboard')
}
