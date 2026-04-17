import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { SupabaseClient } from '@supabase/supabase-js'

export const MAX_CONCURRENT_JOBS = 3

type LimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

type Limiter = { limit: (key: string) => Promise<LimitResult> }

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

export const jobCreateLimiter: Limiter = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
      prefix: 'brainrank:jobs:create',
    })
  : {
      async limit() {
        return {
          success: true,
          limit: 10,
          remaining: 10,
          reset: Date.now() + 60_000,
        }
      },
    }

export type JobLimitViolation =
  | { kind: 'rate_limit'; message: string; reset: number; limit: number; remaining: number }
  | { kind: 'concurrent_cap'; message: string; inFlight: number; limit: number }

export async function checkJobCreateLimits(
  supabase: SupabaseClient,
  userId: string
): Promise<JobLimitViolation | null> {
  const rl = await jobCreateLimiter.limit(userId)
  if (!rl.success) {
    return {
      kind: 'rate_limit',
      message: 'Too many requests. Try again shortly.',
      reset: rl.reset,
      limit: rl.limit,
      remaining: rl.remaining,
    }
  }

  const { count } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])

  const inFlight = count ?? 0
  if (inFlight >= MAX_CONCURRENT_JOBS) {
    return {
      kind: 'concurrent_cap',
      message: `You have ${inFlight} analyses running. Wait for one to finish (max ${MAX_CONCURRENT_JOBS} concurrent).`,
      inFlight,
      limit: MAX_CONCURRENT_JOBS,
    }
  }

  return null
}
