import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/database.types'
import { CONSENT_VERSION } from '@/lib/consent'

// Extra consent columns added in 20260421_add_consent_to_profiles.sql.
type ProfileUpdate = Partial<Pick<Profile, 'username' | 'bio' | 'avatar_url' | 'updated_at'>> & {
  consent_version_accepted?: string
  consent_accepted_at?: string
}

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
      consent_version_accepted?: string | null
      consent_accepted_at?: string | null
    }

    // At least one field must be present
    if (
      body.username === undefined &&
      body.bio === undefined &&
      body.avatar_url === undefined &&
      body.consent_version_accepted === undefined &&
      body.consent_accepted_at === undefined
    ) {
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

    // Consent fields: only the current Contribution Agreement version is
    // accepted. The timestamp is server-stamped for integrity, ignoring any
    // client-supplied value.
    if (body.consent_version_accepted !== undefined) {
      if (body.consent_version_accepted !== CONSENT_VERSION) {
        return NextResponse.json(
          { error: 'Contribution Agreement version mismatch — please reload.' },
          { status: 400 }
        )
      }
      updateObj.consent_version_accepted = CONSENT_VERSION
      updateObj.consent_accepted_at = new Date().toISOString()
    }

    // Handle username with existing validation logic
    if (body.username !== undefined) {
      if (body.username === null) {
        updateObj.username = null
      } else {
        const normalized = body.username.toLowerCase()
        if (normalized.length < 3 || normalized.length > 15) {
          return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
        }
        if (!/^[a-z0-9_]+$/.test(normalized)) {
          return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
        }
        updateObj.username = normalized
      }
    }

    // Cast through `unknown` because database.types.ts hasn't been regenerated
    // since the consent_version_accepted / consent_accepted_at columns were added.
    const { data, error } = await supabase
      .from('profiles')
      .update(updateObj as never)
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
