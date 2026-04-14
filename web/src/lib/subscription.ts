import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Subscription, SubscriptionStatus } from '@/lib/database.types'

/**
 * Fetch the user's current subscription. Works with any Supabase client
 * (anon for client-side reads via RLS, or admin for server-side).
 * Returns null if the user has no subscription (free tier).
 */
export async function getUserSubscription(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'] satisfies SubscriptionStatus[])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch subscription:', error)
    return null
  }

  return data
}

/**
 * Check if a subscription grants Creator tier access.
 * past_due = grace period (Stripe is retrying payment, don't punish user).
 * Returns true for: active, trialing, past_due.
 * Returns false for: canceled, incomplete, unpaid, paused, null.
 */
export function hasActiveAccess(subscription: Subscription | null): boolean {
  if (!subscription) return false
  const accessStatuses: SubscriptionStatus[] = ['active', 'trialing', 'past_due']
  return accessStatuses.includes(subscription.status)
}

export interface AccessLevel {
  hasAccess: boolean
  tier: 'free' | 'creator'
  showWarning: boolean
  warningMessage?: string
}

export function getAccessLevel(subscription: Subscription | null): AccessLevel {
  if (!subscription) {
    return { hasAccess: false, tier: 'free', showWarning: false }
  }

  switch (subscription.status) {
    case 'active':
    case 'trialing':
      return { hasAccess: true, tier: 'creator', showWarning: false }
    case 'past_due':
      return {
        hasAccess: true,
        tier: 'creator',
        showWarning: true,
        warningMessage:
          'Your payment failed. Please update your payment method to avoid losing access.',
      }
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
    case 'unpaid':
    case 'paused':
    default:
      return { hasAccess: false, tier: 'free', showWarning: false }
  }
}
