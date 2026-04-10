---
phase: 35-unified-glb-mesh-export
plan: 01
subsystem: infra
tags: [trimesh, glb, fsaverage5, nilearn, mesh-export]

requires:
  - phase: 32-3d-brain-viewer
    provides: existing export_brain_glb.py script and region-split GLB
provides:
  - "Unified single-mesh GLB with 20,484 fsaverage5 vertices in original ordering"
  - "export_unified_glb() function in export_brain_glb.py"
  - "--unified-only CLI flag for selective export"
affects: [36-cortical-heatmap-viewer]

tech-stack:
  added: []
  patterns: ["process=False on trimesh.Trimesh to preserve vertex ordering"]

key-files:
  created: ["web/public/models/brain-fsaverage5-unified.glb"]
  modified: ["scripts/export_brain_glb.py"]

key-decisions:
  - "Used process=False to prevent trimesh vertex deduplication at hemisphere seams"
  - "Named mesh node 'brain' for useGLTF access as nodes.brain in frontend"

patterns-established:
  - "Unified mesh vertex ordering: left hemisphere 0-10241, right hemisphere 10242-20483"

requirements-completed: [DATA-03]

duration: 2min
completed: 2026-04-10
---

# Phase 35 Plan 01: Unified GLB Mesh Export Summary

**Single-mesh GLB with 20,484 fsaverage5 vertices preserving TRIBE v2 index ordering for direct per-vertex heatmap mapping**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-10T20:32:47Z
- **Completed:** 2026-04-10T20:34:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added export_unified_glb() function to existing export script with process=False vertex preservation
- Generated brain-fsaverage5-unified.glb (720.8 KB) with exactly 20,484 vertices and 40,960 faces
- Existing region-split GLB (brain-fsaverage5.glb) remains untouched
- Added --unified-only CLI flag via argparse for selective export

## Task Commits

Each task was committed atomically:

1. **Task 1: Add unified mesh export function** - `170a0cd` (feat)
2. **Task 2: Generate unified GLB and validate** - `a6478ca` (feat)

## Files Created/Modified
- `scripts/export_brain_glb.py` - Added export_unified_glb() function and argparse CLI
- `web/public/models/brain-fsaverage5-unified.glb` - Single-mesh GLB with 20,484 vertices in fsaverage5 order

## Decisions Made
- Used process=False on trimesh.Trimesh to prevent vertex deduplication at hemisphere seams, preserving 1:1 mapping to TRIBE v2 output indices
- Named the mesh node "brain" so Phase 36 can access it via useGLTF as nodes.brain

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Unified GLB ready for Phase 36 (Cortical Heatmap Viewer) to load and apply per-vertex activation colors
- Vertex ordering guaranteed: left hemisphere indices 0-10241, right hemisphere 10242-20483 matching TRIBE v2 output

## Self-Check: PASSED

All files and commits verified:
- scripts/export_brain_glb.py: FOUND
- web/public/models/brain-fsaverage5-unified.glb: FOUND
- web/public/models/brain-fsaverage5.glb: FOUND (existing, untouched)
- Commit 170a0cd: FOUND
- Commit a6478ca: FOUND

---
*Phase: 35-unified-glb-mesh-export*
*Completed: 2026-04-10*
