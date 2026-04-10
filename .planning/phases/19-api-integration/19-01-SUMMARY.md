---
phase: 19-api-integration
plan: 01
subsystem: web-api
tags: [api-routes, runpod, supabase, auth]
dependency_graph:
  requires: [16-01]
  provides: [POST /api/jobs, GET /api/jobs/[id]]
  affects: [web/src/lib/database.types.ts]
tech_stack:
  added: []
  patterns: [Next.js API routes, RunPod proxy pattern, Supabase server client auth]
key_files:
  created:
    - web/src/app/api/jobs/route.ts
    - web/src/app/api/jobs/[id]/route.ts
    - web/supabase/migrations/00002_add_runpod_id_to_jobs.sql
  modified:
    - web/src/lib/database.types.ts
    - web/.env.local.example
decisions:
  - Return 404 (not 403) when job belongs to different user to prevent enumeration
  - Graceful RunPod polling errors return _polling_error field instead of marking job failed
  - RunPod API key read from server-side process.env only
metrics:
  duration: 115s
  completed: 2026-04-10T01:33:51Z
  tasks_completed: 2
  tasks_total: 2
---

# Phase 19 Plan 01: API Routes for Job Creation and Status Polling Summary

Next.js API routes proxying RunPod inference -- POST creates Supabase job and triggers RunPod /run, GET polls /status and syncs results back to Supabase, both requiring auth with RUNPOD_API_KEY server-side only.

## Task Outcomes

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | POST /api/jobs route + runpod_id schema update | 72a75eb | Done |
| 2 | GET /api/jobs/[id] route for status polling | b2b3745 | Done |

## What Was Built

### POST /api/jobs (web/src/app/api/jobs/route.ts)
- Authenticates via `supabase.auth.getUser()`, returns 401 if no session
- Validates `video_url` is present and starts with http(s)://
- Checks `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID` server-side env vars
- Inserts pending job into Supabase jobs table
- Calls RunPod `/run` endpoint with video_url
- On RunPod success: updates job with `runpod_id` and status `processing`
- On RunPod failure: marks job `failed` with error message, returns 502

### GET /api/jobs/[id] (web/src/app/api/jobs/[id]/route.ts)
- Authenticates and verifies job ownership (404 on mismatch)
- Returns terminal jobs (completed/failed) without polling RunPod
- Returns jobs without runpod_id as-is
- Polls RunPod `/status/{runpod_id}` for active jobs
- Maps RunPod statuses: IN_QUEUE/IN_PROGRESS -> processing, COMPLETED -> completed, FAILED/CANCELLED/TIMED_OUT -> failed
- On RunPod network error: returns current job with `_polling_error` field (no false failure)
- Updates Supabase with synced status and results

### Schema Changes
- Migration `00002_add_runpod_id_to_jobs.sql`: adds nullable `runpod_id text` column with index
- `database.types.ts`: `runpod_id: string | null` added to Job interface

### Environment
- `.env.local.example` updated with `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID`

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all data sources are wired (Supabase for persistence, RunPod API for inference).

## Verification Results

1. TypeScript compilation: no errors in new files (pre-existing @supabase/ssr missing in worktree)
2. RUNPOD_API_KEY only appears in API route files, never in client code
3. Both routes contain auth.getUser() calls
4. database.types.ts contains runpod_id: string | null
5. Migration file exists with ALTER TABLE

## Self-Check: PASSED
