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

    const body = await request.json() as { username?: string | null }

    // Require explicit username field — absence is a client bug, not intent to clear
    if (body.username === undefined) {
      return NextResponse.json({ error: 'username field is required' }, { status: 400 })
    }

    // null means "clear username"
    if (body.username === null) {
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
    }

    // string means "set username"
    const normalized = body.username.toLowerCase()

    if (normalized.length < 3 || normalized.length > 20) {
      return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
    }

    if (!/^[a-z0-9_]+$/.test(normalized)) {
      return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: normalized, updated_at: new Date().toISOString() })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
