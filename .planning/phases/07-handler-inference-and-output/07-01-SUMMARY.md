---
phase: 07-handler-inference-and-output
plan: 01
subsystem: inference
tags: [numpy, tribe-v2, postprocessing, pydantic, hemodynamic-delay]

# Dependency graph
requires:
  - phase: 02-region-mapping
    provides: compute_region_scores, align_to_stimulus, region_masks.npz
  - phase: 05-containerization
    provides: schema.py (OutputSchema, Segment, RegionScores, Summary)
provides:
  - "run_inference() -- TRIBE v2 inference wrapper returning (ndarray, segments, timing)"
  - "postprocess() -- raw predictions to OutputSchema with 2-second windows"
affects: [07-02-handler-wiring, 08-dockerfile, 09-testing]

# Tech tracking
tech-stack:
  added: []
  patterns: [hasattr-based-torch-detection, 2-second-windowing, hrf-delay-correction]

key-files:
  created:
    - src/inference.py
    - src/postprocessor.py
    - tests/test_inference_module.py
    - tests/test_postprocessor.py
  modified: []

key-decisions:
  - "Torch detection via hasattr(preds, 'detach') avoids module-level torch import"
  - "2-second windows built by averaging pairs of 1-second aligned segments; trailing odd segment gets 1-second window"

patterns-established:
  - "Inference wrapper pattern: timing via perf_counter, job_id in all logs, tensor conversion"
  - "Postprocessor pattern: HRF align -> region score -> window aggregation -> Pydantic construction"

requirements-completed: [HDLR-05, HDLR-06, HDLR-09]

# Metrics
duration: 2min
completed: 2026-04-09
---

# Phase 7 Plan 01: Inference Wrapper and Postprocessor Summary

**TRIBE v2 inference wrapper and postprocessor converting raw cortical vertex predictions to 2-second windowed OutputSchema with region scores, arousal/valence, and summary statistics**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-09T01:25:53Z
- **Completed:** 2026-04-09T01:28:17Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- run_inference wraps TribeModel API with timing, logging, and torch-to-numpy conversion
- postprocess applies hemodynamic delay, computes 4 region scores, builds 2-second output windows with activation/arousal/valence
- Summary computed with overall, hook_score (first 10s), retention_score (last 10s), peak detection
- 20 tests covering both modules without GPU dependency

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/inference.py** - `57c6a3b` (feat)
2. **Task 2: Create src/postprocessor.py** - `c3aab49` (feat)

## Files Created/Modified
- `src/inference.py` - TRIBE v2 inference wrapper with timing and tensor conversion
- `src/postprocessor.py` - Raw predictions to OutputSchema mapper with 2-second windowing
- `tests/test_inference_module.py` - 8 tests for inference wrapper
- `tests/test_postprocessor.py` - 12 tests for postprocessor

## Decisions Made
- Torch tensor detection uses `hasattr(preds, 'detach')` to avoid importing torch at module level (keeps module importable without GPU)
- 2-second windows built by averaging consecutive pairs of 1-second aligned segments; trailing odd segment produces a 1-second window
- Region masks loaded from `data/region_masks.npz` via `Path(__file__).parent.parent` for Docker compatibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both modules ready to be wired into handler.py in Plan 02
- run_inference and postprocess are independently testable with mock models
- No GPU required for testing (all model interactions are mockable)

## Self-Check: PASSED

---
*Phase: 07-handler-inference-and-output*
*Completed: 2026-04-09*
