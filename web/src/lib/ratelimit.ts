import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

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
