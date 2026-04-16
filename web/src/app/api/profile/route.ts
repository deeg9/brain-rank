import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/database.types'

type ProfileUpdate = Partial<Pick<Profile, 'username' | 'bio' | 'avatar_url' | 'updated_at'>>

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      username?: string | null
      bio?: string | null
      avatar_url?: string | null
    }

    // At least one field must be present
    if (body.username === undefined && body.bio === undefined && body.avatar_url === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Validate bio length if provided
    if (body.bio !== undefined && body.bio !== null && body.bio.length > 160) {
      return NextResponse.json({ error: 'Bio must be 160 characters or fewer' }, { status: 400 })
    }

    // Build update object with only provided fields
    const updateObj: ProfileUpdate = {
      updated_at: new Date().toISOString(),
    }

    // Handle bio and avatar_url (simple fields)
    if (body.bio !== undefined) {
      updateObj.bio = body.bio
    }
    if (body.avatar_url !== undefined) {
      updateObj.avatar_url = body.avatar_url
    }

    // Handle username with existing validation logic
    if (body.username !== undefined) {
      if (body.username === null) {
        updateObj.username = null
      } else {
        const normalized = body.username.toLowerCase()
        if (normalized.length < 3 || normalized.length > 20) {
          return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
        }
        if (!/^[a-z0-9_]+$/.test(normalized)) {
          return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
        }
        updateObj.username = normalized
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateObj as ProfileUpdate)
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
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
