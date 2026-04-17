---
id: 260416-nsw
slug: rate-limits-on-post-jobs
description: Add per-user concurrent-job cap + sliding-window burst rate limit to POST /api/jobs
status: in-progress
created: 2026-04-17
---

# Rate limits on POST /api/jobs

## Goal

Protect RunPod spend and prevent abuse on `POST /api/jobs` by adding two server-side guards:
1. **Concurrent-job cap** — max 3 in-flight jobs per user (`status IN ('pending','processing')`)
2. **Burst rate limit** — 10 req / 60s per user, via Upstash Redis sliding window

Full context, rationale, and verification steps: `/Users/deeg/.claude/plans/can-we-run-a-eager-conway.md` (approved).

## Tasks

### T1 — Add Upstash dependencies
- Add `@upstash/ratelimit` and `@upstash/redis` to `web/package.json` via `npm install` in the `web/` directory.

### T2 — Create ratelimit helper
- New file: `web/src/lib/ratelimit.ts`
- Exports `jobCreateLimiter`
- Sliding window: 10 requests / 60 seconds, keyed by user_id
- Graceful degrade: if `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` missing, export a no-op stub that allows all (so `npm run dev` works without Upstash setup)

### T3 — Wire checks into POST /api/jobs
File: `web/src/app/api/jobs/route.ts`
- Add `MAX_CONCURRENT_JOBS = 3` constant
- Import `jobCreateLimiter`
- Insert checks in this order inside `POST`:
  1. (existing) Auth via `supabase.auth.getUser()`
  2. **NEW** Burst rate limit — 429 with `X-RateLimit-*` headers on fail
  3. **NEW** Concurrent-job count via `.select('id', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['pending','processing'])` — 429 on cap hit
  4. (existing) Credit gate
  5. (existing) Input validation
  6. (existing) Insert + RunPod trigger

### T4 — Document env vars
- Update `web/.env.local.example` with:
  - `UPSTASH_REDIS_REST_URL=`
  - `UPSTASH_REDIS_REST_TOKEN=`

### T5 — Type-check and verify
- `cd web && npx tsc --noEmit` — must pass
- Grep to confirm: no duplicate `MAX_CONCURRENT_JOBS`, ratelimit import resolves, no stray TODOs

## Non-goals

- No migrations, no RLS changes, no UI client copy updates (the existing upload page already reads `error` from 429/403).
- No IP-based rate limits, no public-endpoint rate limits.
- Not tied into credit gate or SECURITY DEFINER hardening — those are separate.

## Commit plan

Atomic commits per task:
- `chore(ratelimit): add @upstash/ratelimit + @upstash/redis deps`
- `feat(ratelimit): add jobCreateLimiter helper with graceful no-op fallback`
- `feat(jobs): enforce concurrent-job cap + burst rate limit on POST /api/jobs`
- `docs(env): document UPSTASH_REDIS_REST_URL/TOKEN in .env.local.example`
