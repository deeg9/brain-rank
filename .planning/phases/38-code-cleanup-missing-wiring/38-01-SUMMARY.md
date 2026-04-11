---
phase: 38-code-cleanup-missing-wiring
plan: 01
subsystem: brain-viewer, api, cleanup
tags: [tech-debt, regions-mode, retry-endpoint, dead-code]
dependency_graph:
  requires: []
  provides:
    - 9-network regions mode rendering via BrainNetworkMesh
    - /api/jobs/[id]/retry POST endpoint
  affects:
    - web/src/components/results/BrainViewerCanvas.tsx
    - web/src/lib/jobs.ts (retryJob now has a backend route)
tech_stack:
  added: []
  patterns:
    - per-vertex coloring on unified GLB mesh for regions mode
    - network-vertex-map.json as static data file in public/
key_files:
  created:
    - web/src/components/results/BrainNetworkMesh.tsx
    - web/public/data/network-vertex-map.json
    - web/src/app/api/jobs/[id]/retry/route.ts
  modified:
    - web/src/components/results/BrainViewerCanvas.tsx
    - web/src/components/results/brain-utils.ts
    - data/region_masks.npz
  deleted:
    - web/src/components/results/RegionValuesBar.tsx
    - web/src/components/results/RegionBreakdown.tsx
    - web/src/components/results/BrainRegionMesh.tsx
    - web/src/components/ui/AnimationDemo.tsx
decisions:
  - Used per-vertex coloring on unified GLB mesh (same pattern as BrainHeatmapMesh) instead of per-region separate meshes
  - For overlapping vertices (in multiple networks), highest-scoring network wins
  - Deleted BrainRegionMesh.tsx as it was only used by the old 4-region rendering path
  - Used Record<string, unknown> casts in retry route to work around missing Supabase schema types (matches existing route patterns)
metrics:
  completed: "2026-04-10"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 38 Plan 01: Code Cleanup & Missing Wiring Summary

9-network regions mode rendering via per-vertex coloring on unified GLB mesh, retry API endpoint for failed jobs, and removal of 4 orphaned component files.

## What Was Done

### Task 1: Fix 9-network regions mode rendering
- Regenerated `data/region_masks.npz` with all 9 brain networks from Destrieux atlas (12,920 unique vertices, 63.1% cortical coverage)
- Exported `web/public/data/network-vertex-map.json` with per-network vertex index arrays for frontend consumption
- Created `BrainNetworkMesh.tsx` following the BrainHeatmapMesh pattern: clones unified GLB geometry, applies per-vertex colors based on network membership and scores
- Updated `BrainViewerCanvas.tsx` to render `<BrainNetworkMesh>` in regions mode instead of iterating 4 `<BrainRegionMesh>` components over named GLB nodes
- Overlapping vertices (6,164 vertices in 2+ networks) resolve to the highest-scoring network
- Removed old `brain-fsaverage5.glb` preload (unified GLB handles everything)
- **Commit:** 5379df5

### Task 2: Add /api/jobs/[id]/retry POST route
- Created `web/src/app/api/jobs/[id]/retry/route.ts` with full auth, ownership verification, and status checking
- Authenticates via `supabase.auth.getUser()`, returns 401 if unauthenticated
- Verifies `job.user_id === user.id`, returns 404 on mismatch (avoids leaking job existence)
- Only allows retry on `failed` jobs (returns 400 otherwise)
- Resets job to pending state, then re-dispatches to RunPod with the same `video_url`
- Handles RunPod failures by marking job as failed with error message
- Follows exact error handling patterns from existing `/api/jobs/route.ts`
- **Commit:** 6565e30

### Task 3: Remove orphaned dead code files
- Deleted `RegionValuesBar.tsx` (superseded by BrainViewer legend)
- Deleted `RegionBreakdown.tsx` (superseded by BrainViewer legend)
- Deleted `AnimationDemo.tsx` (Phase 27 verification artifact)
- Deleted `BrainRegionMesh.tsx` (replaced by BrainNetworkMesh, no longer imported anywhere)
- Updated brain-utils.ts comment to reference BrainNetworkMesh
- Verified zero dangling imports via grep
- **Commit:** c15e308

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Also deleted BrainRegionMesh.tsx**
- **Found during:** Task 3
- **Issue:** After Task 1 removed BrainRegionMesh usage from BrainViewerCanvas, the component had no imports anywhere in the codebase
- **Fix:** Deleted it as part of dead code cleanup (plan suggested checking for this)
- **Files modified:** web/src/components/results/BrainRegionMesh.tsx (deleted)
- **Commit:** c15e308

## Threat Mitigations Applied

All three threat model items (T-38-01, T-38-02, T-38-03) implemented in the retry route:
- T-38-01 (Spoofing): Auth via `supabase.auth.getUser()`, 401 on failure
- T-38-02 (Tampering): Ownership check `job.user_id === user.id`, 404 on mismatch
- T-38-03 (Elevation of Privilege): Status check `status === 'failed'`, 400 otherwise

## Self-Check: PASSED

All created files exist. All deleted files confirmed removed. All 3 commit hashes verified in git log.
