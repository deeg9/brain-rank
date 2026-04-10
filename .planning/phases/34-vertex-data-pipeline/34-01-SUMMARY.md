---
phase: 34-vertex-data-pipeline
plan: 01
subsystem: api
tags: [base64, quantization, vertex-data, postprocessor, typescript, vitest]

requires:
  - phase: 33-functional-networks
    provides: "9-region scoring pipeline and normalized vertex activations"
provides:
  - "Optional per-vertex base64-encoded uint8 activation data in API response"
  - "Frontend decodeVertexData() utility for base64 -> Float32Array conversion"
  - "include_vertex_data input flag for controlling vertex payload inclusion"
affects: [36-cortical-heatmap-viewer, brain-heatmap-mesh, results-display]

tech-stack:
  added: []
  patterns: ["uint8 quantization for efficient float transport", "base64 encoding for JSON-safe binary data"]

key-files:
  created:
    - web/src/lib/vertex-codec.ts
    - web/src/lib/vertex-codec.test.ts
    - tests/test_schema_vertex.py
  modified:
    - src/schema.py
    - src/postprocessor.py
    - src/handler.py
    - tests/test_postprocessor.py

key-decisions:
  - "Used Optional[str] instead of str | None for Python 3.9 compatibility"
  - "include_vertex_data defaults to True so new consumers get vertex data by default"
  - "Quantize float32 [0,1] to uint8 [0,255] for 65% payload reduction (~28KB vs ~80KB per segment)"

patterns-established:
  - "Pattern: Binary data transport via uint8 quantization + base64 encoding in JSON responses"
  - "Pattern: Optional response fields with backward-compatible None defaults"

requirements-completed: [DATA-01]

duration: 4min
completed: 2026-04-10
---

# Phase 34 Plan 01: Vertex Data Pipeline Summary

**Quantized per-vertex brain activation data as base64 uint8 in API response with frontend decoder utility**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-10T20:22:44Z
- **Completed:** 2026-04-10T20:27:07Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Added optional `vertex_data` base64 string field to Segment schema (None default for backward compat)
- Postprocessor quantizes 20,484 float32 vertex activations to uint8, base64-encodes per segment (~28KB vs ~80KB)
- Frontend `vertex-codec.ts` decodes base64 back to normalized Float32Array [0,1] for heatmap rendering
- `include_vertex_data` input flag wired through handler to postprocessor for opt-out capability

## Task Commits

Each task was committed atomically:

1. **Task 1: Add vertex_data field to schema and include_vertex_data input flag** - `4ffedd6` (feat)
2. **Task 2: Quantize vertex activations to uint8 base64 in postprocessor** - `0888ee2` (feat)
3. **Task 3: Create frontend vertex-codec.ts decoder utility** - `2c787ee` (feat)

## Files Created/Modified
- `src/schema.py` - Added `vertex_data: Optional[str] = None` to Segment, `include_vertex_data: bool = True` to InputSchema
- `src/postprocessor.py` - Added base64 import, `include_vertex_data` parameter, uint8 quantization + encoding in window loop
- `src/handler.py` - Wired `params.include_vertex_data` through to `postprocess()` call
- `tests/test_schema_vertex.py` - 5 tests for schema backward compat and new fields
- `tests/test_postprocessor.py` - 4 new vertex_data tests (present, size, disabled, roundtrip)
- `web/src/lib/vertex-codec.ts` - `decodeVertexData()` and `VERTEX_COUNT` exports
- `web/src/lib/vertex-codec.test.ts` - 6 vitest tests for decoder

## Decisions Made
- Used `Optional[str]` instead of `str | None` for Python 3.9 compatibility (Rule 1 - auto-fix)
- `include_vertex_data` defaults to `True` so new consumers get vertex data automatically
- Quantization strategy: multiply normalized [0,1] by 255, clip, cast to uint8 -- 1/255 (~0.004) max error is imperceptible for heatmap visualization

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Python 3.9 type syntax compatibility**
- **Found during:** Task 1 (schema changes)
- **Issue:** `str | None` union syntax requires Python 3.10+; project runs Python 3.9.6
- **Fix:** Changed to `Optional[str]` from `typing` module
- **Files modified:** src/schema.py
- **Verification:** All tests pass on Python 3.9.6
- **Committed in:** 4ffedd6

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor syntax adjustment, no scope change.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Vertex data pipeline is complete and ready for Phase 36 (Cortical Heatmap Viewer)
- Frontend `decodeVertexData()` provides the Float32Array input needed by BrainHeatmapMesh
- Backend produces ~28KB base64 strings per segment, well within API payload limits

## Self-Check: PASSED

All 7 created/modified files verified on disk. All 3 task commits verified in git log.

---
*Phase: 34-vertex-data-pipeline*
*Completed: 2026-04-10*
