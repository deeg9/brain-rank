---
id: 260416-nsw
slug: rate-limits-on-post-jobs
status: complete
completed: 2026-04-17
---

# Summary — Rate limits on POST /api/jobs

## What shipped

Four atomic commits on `main`:

1. `80d0084` — chore(ratelimit): add @upstash/ratelimit + @upstash/redis deps
2. `2372f1c` — feat(ratelimit): add jobCreateLimiter with graceful no-op fallback
3. `862b79b` — feat(jobs): enforce concurrent-job cap + burst rate limit on POST /api/jobs
4. `4080b38` — docs(env): document UPSTASH_REDIS_REST_URL/TOKEN

## Behavior now

`POST /api/jobs` check order:
1. Auth → 401 on fail
2. Burst rate limit (10 req / 60s / user) → 429 + `X-RateLimit-*` headers on fail
3. Concurrent-job cap (3 in-flight per user) → 429 with `in_flight`/`limit` on fail
4. Weekly credit gate → 403 on fail (unchanged)
5. Input validation + insert + RunPod trigger (unchanged)

## Files touched

- `web/src/app/api/jobs/route.ts` — +42 lines (imports + two checks)
- `web/src/lib/ratelimit.ts` — new, 32 lines
- `web/package.json` + `package-lock.json` — @upstash/ratelimit ^2.0.8, @upstash/redis ^1.37.0
- `web/.env.local.example` — documented UPSTASH_REDIS_REST_URL/TOKEN

## Verification

- `npx tsc --noEmit` — clean
- `npx next build` — passes, all routes compile
- Rate limiter short-circuits to allow-all when Upstash env vars are unset (local dev confirmed via fallback path in `web/src/lib/ratelimit.ts`)

## Before launch (ops, not in this commit)

1. Provision Upstash Redis at https://console.upstash.com/
2. Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel env vars
3. Raise RunPod endpoint max workers 3 → 10–15
4. Enable FlashBoot on the RunPod endpoint
5. Confirm Network Volume is mounted for model weights

## Out of scope (tracked separately)

- Security audit findings (RunPod webhook secret in query string, SSRF redirect bypass, SECURITY DEFINER search_path, storage bucket listing policies) — see `/Users/deeg/.claude/plans/can-we-run-a-eager-conway.md`.
- Secret rotation (HF_TOKEN, RUNPOD_API_KEY, RESEND_API_KEY, Stripe live-mode keys) — manual, before launch.
