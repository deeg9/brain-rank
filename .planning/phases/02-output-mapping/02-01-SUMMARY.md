---
phase: 02-output-mapping
plan: 01
subsystem: data-processing
tags: [nilearn, destrieux, fsaverage5, numpy, brain-mapping, fmri, hemodynamic]

# Dependency graph
requires:
  - phase: 01-model-setup
    provides: "TRIBE v2 output format documentation (20484 vertices, 61 segments, float32)"
provides:
  - "region_mapping Python package with constants, region definitions, atlas masks, scoring, temporal alignment"
  - "Boolean vertex masks for 4 NeuroCut brain regions derived from Destrieux atlas"
  - "compute_region_scores() for per-region mean activation aggregation"
  - "align_to_stimulus() for 5-second hemodynamic delay correction"
affects: [output-mapping, model-validation, handler-output, engagement-scoring]

# Tech tracking
tech-stack:
  added: [nilearn, pytest]
  patterns: [destrieux-surface-atlas, boolean-vertex-masking, mean-roi-aggregation, hrf-index-shift]

key-files:
  created:
    - src/region_mapping/__init__.py
    - src/region_mapping/constants.py
    - src/region_mapping/regions.py
    - src/region_mapping/atlas.py
    - src/region_mapping/scoring.py
    - src/region_mapping/temporal.py
    - tests/conftest.py
    - tests/test_region_mapping.py
    - pytest.ini
  modified: []

key-decisions:
  - "Used nilearn 0.12.1 (latest compatible with Python 3.9) instead of planned 0.13.1"
  - "Mean aggregation for per-region scores (standard fMRI ROI analysis approach)"
  - "Left hemisphere first concatenation order for 20484-vertex array (fsaverage5 convention)"

patterns-established:
  - "Pattern: Import path via sys.path.insert in conftest.py for src/ layout"
  - "Pattern: Destrieux label names as string keys in REGION_DEFINITIONS dict"
  - "Pattern: Boolean numpy masks for vertex-to-region mapping"

requirements-completed: [MODL-03, MODL-04, MODL-06]

# Metrics
duration: 4min
completed: 2026-04-07
---

# Phase 2 Plan 1: Region Mapping Core Summary

**Destrieux atlas-based vertex-to-region mapping for 4 brain regions (attention, reward, emotional_processing, social_cognition) with hemodynamic delay correction and 11 passing tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-07T17:34:33Z
- **Completed:** 2026-04-07T17:38:07Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Built region_mapping Python package converting TRIBE v2's raw 20,484-vertex output to per-region activation scores
- Defined 33 Destrieux parcel-to-region mappings across 4 NeuroCut brain regions, all validated against the nilearn atlas
- Implemented hemodynamic delay correction (5-second shift, 61 segments to 56)
- Full TDD coverage with 11 unit tests covering constants, region definitions, atlas masks, scoring, and temporal alignment

## Task Commits

Each task was committed atomically:

1. **Task 1: Test scaffold and module structure with constants** - `bf836bf` (feat)
2. **Task 2: Region definitions, atlas masks, scoring, and temporal alignment** - `ad658fa` (feat)

## Files Created/Modified
- `pytest.ini` - Pytest configuration
- `tests/__init__.py` - Test package marker
- `tests/conftest.py` - Shared fixtures (mock_predictions shape 61x20484, mock_segments)
- `tests/test_region_mapping.py` - 11 unit tests covering MODL-03, MODL-04, MODL-06
- `src/region_mapping/__init__.py` - Public API exposing all module exports
- `src/region_mapping/constants.py` - Output format constants (N_VERTICES=20484, HRF_DELAY_S=5, etc.)
- `src/region_mapping/regions.py` - REGION_DEFINITIONS mapping Destrieux parcels to 4 NeuroCut regions
- `src/region_mapping/atlas.py` - build_region_masks() using nilearn fetch_atlas_surf_destrieux
- `src/region_mapping/scoring.py` - compute_region_scores() with mean aggregation
- `src/region_mapping/temporal.py` - align_to_stimulus() for hemodynamic delay correction

## Decisions Made
- Used nilearn 0.12.1 instead of planned 0.13.1 (0.13.1 not available for Python 3.9; 0.12.1 has identical fetch_atlas_surf_destrieux API)
- Mean aggregation chosen for per-region scoring (standard in fMRI ROI analysis; can be refined in Phase 3 validation if needed)
- Left-hemisphere-first concatenation order verified with assertions in atlas.py

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] nilearn 0.13.1 unavailable for Python 3.9**
- **Found during:** Task 2 (nilearn installation)
- **Issue:** nilearn 0.13.1 requires Python 3.10+; this environment runs Python 3.9.6
- **Fix:** Installed nilearn 0.12.1 (latest available for Python 3.9). The fetch_atlas_surf_destrieux API is identical between versions.
- **Files modified:** None (runtime dependency only)
- **Verification:** All 11 tests pass, atlas labels validate correctly
- **Committed in:** ad658fa (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minimal. nilearn 0.12.1 provides the same surface atlas API. Production Docker image will use Python 3.11 where 0.13.1 is available.

## Issues Encountered
None beyond the nilearn version constraint noted in deviations.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- region_mapping package is complete and tested, ready for integration
- build_region_masks() can be called to generate masks at setup time
- Masks can be serialized to .npz for Docker runtime (no nilearn dependency at inference time)
- Phase 3 (Model Validation) can use compute_region_scores() to test content differentiation

---
*Phase: 02-output-mapping*
*Completed: 2026-04-07*
