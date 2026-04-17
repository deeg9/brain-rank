'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { trackServer, identifyServer } from '@/lib/analytics.server'

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin')

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    await identifyServer(data.user.id, { email })
    await trackServer('user_signed_up', data.user.id, { method: 'email' })
  }

  redirect(`/signup/check-email?email=${encodeURIComponent(email)}`)
}
