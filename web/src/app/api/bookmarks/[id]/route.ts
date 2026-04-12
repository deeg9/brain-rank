import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // T-51-03: Return false for unauthenticated users without leaking job existence
      return NextResponse.json({ bookmarked: false })
    }

    const { data } = await supabase
      .from('bookmarks')
      .select('job_id')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .maybeSingle()

    return NextResponse.json({ bookmarked: !!data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    // T-51-04: Require auth for bookmark mutations
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Upsert bookmark (idempotent -- inserting duplicate is a no-op due to PK)
    const { error } = await supabase
      .from('bookmarks')
      .upsert(
        { user_id: user.id, job_id: jobId },
        { onConflict: 'user_id,job_id' }
      )

    if (error) {
      console.error('Failed to create bookmark:', error)
      return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 })
    }

    return NextResponse.json({ bookmarked: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    // T-51-04: Require auth for bookmark mutations
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', jobId)

    if (error) {
      console.error('Failed to delete bookmark:', error)
      return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 })
    }

    return NextResponse.json({ bookmarked: false })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
