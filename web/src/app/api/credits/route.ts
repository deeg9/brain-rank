import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCreditStatus } from '@/lib/credits'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const credits = await getCreditStatus(supabase, user.id)

    return NextResponse.json({
      canAnalyze: credits.canAnalyze,
      isCreator: credits.isCreator,
      used: credits.used,
      limit: credits.limit === Infinity ? null : credits.limit,
      remaining: credits.remaining === Infinity ? null : credits.remaining,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
