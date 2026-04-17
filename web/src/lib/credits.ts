import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { getUserSubscription, hasActiveAccess } from '@/lib/subscription'

const FREE_DAILY_LIMIT = 3

/**
 * Get the number of credits used today (00:00 UTC reset).
 */
export async function getDailyUsage(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const dayStart = new Date()
  dayStart.setUTCHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('credit_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', dayStart.toISOString())

  if (error) {
    console.error('Failed to count daily usage:', error)
    return 0
  }

  return count ?? 0
}

export interface CreditStatus {
  canAnalyze: boolean
  isCreator: boolean
  used: number
  limit: number
  remaining: number
}

/**
 * Check if a user can start a new analysis.
 * Creator tier = unlimited. Free tier = 3/day.
 */
export async function getCreditStatus(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CreditStatus> {
  const subscription = await getUserSubscription(supabase, userId)
  const isCreator = hasActiveAccess(subscription)

  if (isCreator) {
    return {
      canAnalyze: true,
      isCreator: true,
      used: 0,
      limit: Infinity,
      remaining: Infinity,
    }
  }

  const used = await getDailyUsage(supabase, userId)
  const remaining = Math.max(0, FREE_DAILY_LIMIT - used)

  return {
    canAnalyze: remaining > 0,
    isCreator: false,
    used,
    limit: FREE_DAILY_LIMIT,
    remaining,
  }
}

/**
 * Record a credit usage after job creation (call AFTER successful job insert).
 */
export async function recordCreditUsage(
  supabase: SupabaseClient<Database>,
  userId: string,
  jobId: string
): Promise<void> {
  const { error } = await supabase
    .from('credit_usage')
    .insert({ user_id: userId, job_id: jobId } as never)

  if (error) {
    console.error('Failed to record credit usage:', error)
  }
}
