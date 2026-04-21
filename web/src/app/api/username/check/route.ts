import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'settings',
  'help',
  'support',
  'discover',
  'profile',
  'login',
  'signup',
  'dashboard',
  'upload',
  'results',
  'about',
  'terms',
  'privacy',
  'billing',
  'account',
  'user',
  'users',
  'public',
])

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate - prevents bot enumeration
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawUsername = request.nextUrl.searchParams.get('username')
    const username = rawUsername?.toLowerCase()

    if (!username) {
      return NextResponse.json({ available: false, reason: 'Username required' })
    }

    if (username.length < 3 || username.length > 15) {
      return NextResponse.json({ available: false, reason: 'Must be 3-15 characters' })
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json({ available: false, reason: 'Only lowercase letters, numbers, and underscores' })
    }

    if (RESERVED_USERNAMES.has(username)) {
      return NextResponse.json({ available: false, reason: 'This username is reserved' })
    }

    // Check database uniqueness, excluding the current user's own profile
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle()

    return NextResponse.json({
      available: !data,
      reason: data ? 'Username is already taken' : null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
