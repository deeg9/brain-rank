import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Call RPC to atomically increment view_count (no auth required)
    // The RPC function only increments public jobs (security definer)
    const { error } = await supabase.rpc('increment_view_count', {
      p_job_id: id,
    })

    if (error) {
      console.error('Failed to increment view count:', error)
      return NextResponse.json({ error: 'Failed to increment view count' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
