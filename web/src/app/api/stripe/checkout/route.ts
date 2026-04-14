import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId } = await request.json()
    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })
    }

    // Look up or create Stripe customer
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    let stripeCustomerId = (existingCustomer as { stripe_customer_id: string } | null)?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      })
      stripeCustomerId = customer.id

      await supabaseAdmin.from('customers').upsert(
        { id: user.id, stripe_customer_id: stripeCustomerId } as never,
        { onConflict: 'id' }
      )
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing`,
      metadata: { user_id: user.id },
      subscription_data: {
        metadata: { user_id: user.id },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout session error:', err)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
