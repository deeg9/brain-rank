---
phase: quick
plan: 260409-sd7
subsystem: postprocessor, web-ui
tags: [normalization, scoring, display]
dependency_graph:
  requires: []
  provides: [robust_normalize, normalized-0-1-scores, percentage-display]
  affects: [src/postprocessor.py, tests/test_postprocessor.py, "web/src/app/(app)/results/[id]/page.tsx"]
tech_stack:
  added: []
  patterns: [percentile-based-normalization]
key_files:
  created: []
  modified:
    - src/postprocessor.py
    - tests/test_postprocessor.py
    - "web/src/app/(app)/results/[id]/page.tsx"
decisions:
  - "robust_normalize applied globally (no per-axis) after align_to_stimulus, before windowing"
  - "Constant input returns 0.5 array to avoid NaN"
  - "Test imports fixed to use src. prefix to resolve dual-import isinstance failure"
metrics:
  duration: 4min
  completed: "2026-04-09"
  tasks: 2
  files: 3
---

# Quick Task 260409-sd7: Add robust_normalize to Postprocessor and Update Web UI Summary

Meta's robust_normalize (99th percentile scaling with clipping) applied to aligned predictions so all OutputSchema scores are 0-1; web UI updated to display as percentages instead of x10 hack.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (TDD) | Add robust_normalize to postprocessor | d6237d3 (RED), 4599171 (GREEN) | src/postprocessor.py, tests/test_postprocessor.py |
| 2 | Update web UI to display normalized scores | e65f741 | web/src/app/(app)/results/[id]/page.tsx |

## What Changed

### src/postprocessor.py
- Added `robust_normalize()` function matching Meta's `tribev2/plotting/utils.py` implementation
- 99th/1st percentile bounds, clipping to [0,1], division-by-zero guard (returns 0.5 for constant input)
- Applied after `align_to_stimulus()` and before all downstream windowing and region scoring
- Added `from typing import Optional` for Python 3.9 compatibility

### tests/test_postprocessor.py
- Fixed imports to use `src.` prefix (resolved dual-import isinstance failure -- pre-existing issue)
- Added `test_segment_region_scores_in_0_1_range` -- region scores bounded
- Added `test_all_scores_normalized_0_to_1` -- all segment and summary scores in [0,1]
- Added `test_uniform_predictions_cluster_near_half` -- constant input produces ~0.5
- Added `TestRobustNormalize` class with 4 unit tests for the function directly
- All 19 tests pass

### web/src/app/(app)/results/[id]/page.tsx
- Replaced `(summary.overall * 10).toFixed(1)` with `Math.round(summary.overall * 100)%`
- Same for hook_score, retention_score, peak_score
- gradeFromScore thresholds unchanged (already correct for 0-1 range)
- RegionBreakdown component unchanged (already does `Math.round(value * 100)`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Python 3.9 type annotation compatibility**
- **Found during:** Task 1
- **Issue:** `int | None` syntax not supported in Python 3.9 (runtime uses 3.9.6)
- **Fix:** Used `Optional[int]` from typing module
- **Files modified:** src/postprocessor.py

**2. [Rule 3 - Blocking] Dual-import isinstance failure in tests**
- **Found during:** Task 1
- **Issue:** Test imported `from postprocessor import ...` (via sys.path to src/) while postprocessor internally imports `from src.schema import ...`, creating two separate module entries for schema classes. isinstance() failed across the boundary.
- **Fix:** Changed test imports to `from src.postprocessor import ...` and `from src.schema import ...` with project root on sys.path
- **Files modified:** tests/test_postprocessor.py

## Verification Results

1. `python3 -m pytest tests/test_postprocessor.py -x -v` -- 19/19 passed
2. `npx tsc --noEmit` -- no errors from results page (pre-existing errors in other files only)
3. `grep "* 10"` on results page -- only `* 100` matches (correct)

## Self-Check: PASSED
