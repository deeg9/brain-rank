---
phase: 32-3d-brain-viewer
plan: 01
subsystem: ui
tags: [react-three-fiber, three.js, glb, brain-mesh, nilearn, trimesh, vitest]

requires:
  - phase: 15-project-scaffold-design-system
    provides: Next.js project structure, design tokens
provides:
  - GLB brain mesh at web/public/models/brain-fsaverage5.glb with 5 named mesh nodes
  - getRegionsAtTime utility for region score lookup at given time
  - REGION_COLORS constant for consistent region coloring
  - Python conversion script for fsaverage5 to GLB export
  - R3F dependencies installed (three, @react-three/fiber, @react-three/drei, @react-three/postprocessing)
affects: [32-02, 35-vertex-heatmap, results-page]

tech-stack:
  added: [three@0.183.2, "@react-three/fiber@9.5.0", "@react-three/drei@10.7.7", "@react-three/postprocessing@3.0.4"]
  patterns: [GLB mesh loading via useGLTF, region score lookup from segments array]

key-files:
  created:
    - scripts/export_brain_glb.py
    - web/public/models/brain-fsaverage5.glb
    - web/src/components/results/brain-utils.ts
    - web/src/components/results/__tests__/brain-utils.test.ts
  modified:
    - web/package.json

key-decisions:
  - "Used all 9 brain regions in REGION_COLORS (not just 4) to match expanded SegmentRegionScores interface"
  - "GLB exported with process=False to preserve vertex ordering for future per-vertex heatmap support"

patterns-established:
  - "Region score lookup: getRegionsAtTime(segments, time) finds containing or nearest segment"
  - "Brain mesh naming: GLB nodes named attention, reward, emotional_processing, social_cognition, base"

requirements-completed: [RSLT-03]

duration: 2min
completed: 2026-04-10
---

# Phase 32 Plan 01: Brain Mesh Asset and Data Utilities Summary

**fsaverage5 brain mesh exported as 702KB GLB with 5 named region groups, plus getRegionsAtTime utility with 6 passing unit tests**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-10T22:55:39Z
- **Completed:** 2026-04-10T22:57:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- R3F dependencies (three, @react-three/fiber, @react-three/drei, @react-three/postprocessing) installed in web/package.json
- brain-utils.ts exports getRegionsAtTime and REGION_COLORS with full type safety
- 6 unit tests all passing: empty array, exact match, gap lookup, before-all, after-all, color constants
- Python conversion script exports fsaverage5 pial surface as GLB with 5 named mesh nodes (attention, reward, emotional_processing, social_cognition, base)
- GLB file at 702KB, well under 2MB budget

## Task Commits

All work was previously committed on the base branch:

1. **Task 1: Install R3F dependencies and create brain-utils with tests** - `19e9ef7` (feat) - original implementation
2. **Task 2: Create Python conversion script and generate brain GLB mesh** - `19e9ef7` (feat) - original implementation, later enhanced in `170a0cd` (unified GLB) and `ce5ce6a` (9 regions)

## Files Created/Modified
- `web/package.json` - Added three, @react-three/fiber, @react-three/drei, @react-three/postprocessing
- `web/src/components/results/brain-utils.ts` - getRegionsAtTime utility and REGION_COLORS constant
- `web/src/components/results/__tests__/brain-utils.test.ts` - 6 unit tests for brain-utils
- `scripts/export_brain_glb.py` - Python script: fsaverage5 pial surface to GLB with named region submeshes
- `web/public/models/brain-fsaverage5.glb` - Pre-converted brain mesh (702KB, 5 named nodes)

## Decisions Made
- Used all 9 brain regions in REGION_COLORS to match the expanded SegmentRegionScores interface (attention, reward, emotional_processing, social_cognition, visual_processing, auditory_processing, language_narrative, default_mode, motion_processing)
- Script includes both region-split GLB and unified GLB export (for future per-vertex heatmap use)
- Vertex ordering preserved with process=False in trimesh to maintain 1:1 mapping with TRIBE v2 output indices

## Deviations from Plan

None - all artifacts existed on the base branch and met acceptance criteria exactly as specified.

## Issues Encountered
None - all work was already implemented and committed. Tests pass, file sizes within budget, all acceptance criteria verified.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- GLB mesh ready for BrainViewer component (Plan 02)
- brain-utils.ts provides the data utility layer Plan 02 needs
- R3F packages installed and available for 3D component development

## Self-Check: PASSED

All 4 created files verified present. All referenced commit hashes verified in git log.

---
*Phase: 32-3d-brain-viewer*
*Completed: 2026-04-10*
