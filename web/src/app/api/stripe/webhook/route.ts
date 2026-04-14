import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { SubscriptionStatus } from '@/lib/database.types'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency check — skip if already processed
  const { data: existing } = await supabaseAdmin
    .from('stripe_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const stripeCustomerId = session.customer as string

        if (!userId) {
          console.error('checkout.session.completed missing user_id in metadata')
          break
        }

        // Upsert customer mapping
        await supabaseAdmin.from('customers').upsert(
          { id: userId, stripe_customer_id: stripeCustomerId } as never,
          { onConflict: 'id' }
        )

        // Retrieve full subscription and upsert
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          await upsertSubscription(subscription, userId)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        let userId = subscription.metadata?.user_id as string | undefined

        // Fallback: look up user from customers table
        if (!userId) {
          const { data: customer } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('stripe_customer_id', subscription.customer as string)
            .maybeSingle()

          userId = (customer as { id: string } | null)?.id
        }

        if (!userId) {
          console.error(`${event.type} could not resolve user_id for customer ${subscription.customer}`)
          break
        }

        await upsertSubscription(subscription, userId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // In Stripe v22, subscription is accessed via parent.subscription_details
        const subDetails = (invoice as unknown as Record<string, unknown>).parent as
          | { subscription_details?: { subscription?: string } }
          | undefined
        const subscriptionId = subDetails?.subscription_details?.subscription ?? null

        if (subscriptionId) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'past_due' as SubscriptionStatus,
              updated_at: new Date().toISOString(),
            } as never)
            .eq('id', subscriptionId)
        }
        break
      }
    }

    // Record processed event for idempotency
    await supabaseAdmin.from('stripe_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
    } as never)
  } catch (err) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function upsertSubscription(
  subscription: Stripe.Subscription,
  userId: string
) {
  // In Stripe v22, current_period_start/end are on items, not the subscription
  const item = subscription.items.data[0]
  const currentPeriodStart = item?.current_period_start
  const currentPeriodEnd = item?.current_period_end

  const { error } = await supabaseAdmin.from('subscriptions').upsert(
    {
      id: subscription.id,
      user_id: userId,
      status: subscription.status as SubscriptionStatus,
      price_id: item?.price.id ?? null,
      quantity: item?.quantity ?? 1,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      current_period_start: currentPeriodStart
        ? new Date(currentPeriodStart * 1000).toISOString()
        : null,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      trial_start: subscription.trial_end
        ? new Date(subscription.created * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      metadata: (subscription.metadata as Record<string, unknown>) ?? null,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: 'id' }
  )

  if (error) throw error
}
