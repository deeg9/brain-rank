import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = await request.json() as { username?: string }

    if (username !== undefined && username !== null) {
      const normalized = username.toLowerCase()

      if (normalized.length < 3 || normalized.length > 20) {
        return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
      }

      if (!/^[a-z0-9_]+$/.test(normalized)) {
        return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ username: normalized })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // If username is undefined/null, clear it
    const { data, error } = await supabase
      .from('profiles')
      .update({ username: null })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
