import { NextResponse } from 'next/server'

// Paid checkout is disabled during the non-commercial research beta.
// The Stripe integration remains in the codebase for future reactivation
// once a commercial license for TRIBE v2 is in place.
export async function POST() {
  return NextResponse.json(
    { error: 'Checkout is paused during the research beta.' },
    { status: 404 }
  )
}
