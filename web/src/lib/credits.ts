import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { getUserSubscription, hasActiveAccess } from '@/lib/subscription'

const FREE_WEEKLY_LIMIT = 5

/**
 * Get the number of credits used this week (Monday-Sunday reset).
 */
export async function getWeeklyUsage(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  // Get start of current week (Monday 00:00 UTC)
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? 6 : day - 1 // Monday = 0
  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() - diff)
  weekStart.setUTCHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('credit_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', weekStart.toISOString())

  if (error) {
    console.error('Failed to count weekly usage:', error)
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
 * Creator tier = unlimited. Free tier = 5/week.
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

  const used = await getWeeklyUsage(supabase, userId)
  const remaining = Math.max(0, FREE_WEEKLY_LIMIT - used)

  return {
    canAnalyze: remaining > 0,
    isCreator: false,
    used,
    limit: FREE_WEEKLY_LIMIT,
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
