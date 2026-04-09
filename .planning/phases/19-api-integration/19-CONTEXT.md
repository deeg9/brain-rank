# Phase 19: API Integration - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Create Next.js API routes that proxy inference requests to RunPod and manage job status. The API key stays server-side only. Routes: POST /api/jobs (create job + trigger RunPod), GET /api/jobs/[id] (poll status + update Supabase).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure backend API phase.

Key technical decisions:
- POST /api/jobs: accepts video_url, creates job in Supabase, calls RunPod /run endpoint, stores runpod_id
- GET /api/jobs/[id]: polls RunPod /status/{runpod_id}, updates job record, returns current status + results
- RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID stored as server-side env vars (not NEXT_PUBLIC_)
- Auth required on both routes (verify Supabase session)

RunPod API pattern (from v1.0):
- POST https://api.runpod.ai/v2/{endpoint_id}/run — body: { input: { video_url } }
- GET https://api.runpod.ai/v2/{endpoint_id}/status/{job_id} — returns { status, output }

</decisions>

<code_context>
## Existing Code Insights

- web/src/lib/supabase/server.ts — server-side Supabase client
- web/src/lib/database.types.ts — Job type with status, results fields
- No API routes exist yet in web/src/app/api/
- RunPod endpoint is live and returning JSON scores

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

- Webhook callbacks from RunPod
- Rate limiting
- Job queuing

</deferred>
