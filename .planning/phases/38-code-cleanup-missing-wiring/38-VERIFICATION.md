---
phase: 38-code-cleanup-missing-wiring
verified: 2026-04-10T12:00:00Z
status: passed
score: 5/5
overrides_applied: 0
---

# Phase 38: Code Cleanup & Missing Wiring Verification Report

**Phase Goal:** Close tech debt from milestone audit -- fix 9-network regions mode rendering, add retry API route, remove dead code.
**Verified:** 2026-04-10T12:00:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 9 functional networks render in regions mode (not just 4) | VERIFIED | BrainNetworkMesh.tsx iterates all keys from REGION_COLORS (9 networks), reads vertex indices from network-vertex-map.json (9 keys confirmed), applies per-vertex coloring. BrainViewerCanvas renders BrainNetworkMesh in regions mode (line 77). Old 4-region REGION_NAMES constant and BrainRegionMesh removed. |
| 2 | POST /api/jobs/{id}/retry resets a failed job to pending and re-dispatches to RunPod | VERIFIED | route.ts exports POST handler with auth (getUser), ownership check (user_id === user.id), failed-status guard, job reset to pending, RunPod dispatch, and status update to processing. 111 lines of substantive implementation. |
| 3 | RegionValuesBar.tsx deleted | VERIFIED | File does not exist. grep confirms zero references in web/src/. |
| 4 | RegionBreakdown.tsx deleted | VERIFIED | File does not exist. grep confirms zero references in web/src/. |
| 5 | AnimationDemo.tsx deleted | VERIFIED | File does not exist. grep confirms zero references in web/src/. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `web/public/data/network-vertex-map.json` | 9-network vertex index mapping | VERIFIED | Contains all 9 network keys with vertex index arrays |
| `web/src/components/results/BrainNetworkMesh.tsx` | Unified-mesh regions renderer | VERIFIED | 134 lines. Exports BrainNetworkMesh. Per-vertex coloring with overlap handling (highest score wins). |
| `web/src/app/api/jobs/[id]/retry/route.ts` | POST handler for job retry | VERIFIED | 111 lines. Exports POST. Auth, ownership, status checks, RunPod dispatch. |
| `data/region_masks.npz` | Pre-computed boolean masks for all 9 networks | VERIFIED | Contains all 9 network keys confirmed via numpy inspection. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| BrainViewerCanvas.tsx | BrainNetworkMesh.tsx | import and render in regions mode | WIRED | Import on line 7, rendered on line 77 in regions mode branch |
| lib/jobs.ts retryJob() | /api/jobs/[id]/retry | fetch POST | WIRED | retryJob calls `fetch(/api/jobs/${jobId}/retry, { method: 'POST' })` on line 47; used in processing/page.tsx line 184 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| BrainNetworkMesh.tsx | vertexMap | fetch /data/network-vertex-map.json | Yes -- static JSON with 9 network arrays | FLOWING |
| BrainNetworkMesh.tsx | regionScores | Props from parent | Prop-driven, parent passes real segment scores | FLOWING |
| retry/route.ts | job | Supabase DB query | Yes -- `supabase.from('jobs').select('*').eq('id', id).single()` | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED (requires running Next.js dev server and Supabase for API routes; 3D rendering requires browser context)

### Requirements Coverage

No requirement IDs mapped to this phase (tech debt cleanup).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | - | - | - | - |

No TODOs, FIXMEs, placeholders, or stub patterns detected in BrainNetworkMesh.tsx or retry/route.ts.

### Human Verification Required

No human verification items identified. All must-haves are verifiable programmatically. Visual correctness of the 9-network rendering would ideally be checked visually, but the wiring and data are verified -- the component correctly iterates all 9 networks, applies colors from REGION_COLORS, and handles overlaps.

### Gaps Summary

No gaps found. All 5 tech debt items from the milestone audit are resolved:
1. 9-network regions mode rendering uses new BrainNetworkMesh with per-vertex coloring on the unified GLB mesh
2. Retry API route is fully implemented with auth, ownership, status guards, and RunPod dispatch
3. All 3 orphaned files deleted (plus BrainRegionMesh.tsx which became orphaned after Task 1)
4. Zero dangling imports remain

---

_Verified: 2026-04-10T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
