---
phase: 06-handler-core
plan: 01
subsystem: api
tags: [pydantic, runpod, schema, singleton, tribev2]

requires:
  - phase: 01-discovery
    provides: TribeModel API (from_pretrained, predict)
  - phase: 02-region-mapping
    provides: Region mapping constants and scoring functions
provides:
  - InputSchema with video_url validation for RunPod handler
  - OutputSchema contract (Segment, RegionScores, Summary) for inference pipeline
  - ErrorResponse for structured error reporting
  - get_model() singleton TribeModel loader
affects: [06-handler-core, 07-inference-pipeline]

tech-stack:
  added: [pydantic v2]
  patterns: [singleton model loader with lazy import, Pydantic ConfigDict strict=False for RunPod compatibility]

key-files:
  created: [src/schema.py, src/model_loader.py]
  modified: []

key-decisions:
  - "str type for video_url instead of HttpUrl to avoid RunPod serialization issues"
  - "Lazy tribev2 import inside get_model() to allow schema tests without GPU"
  - "No cache_folder arg in from_pretrained -- uses default HF cache for network volume compatibility"
  - "Fail-fast model loading -- no exception handling, crashes container on failure"

patterns-established:
  - "Pydantic models use ConfigDict(strict=False) for RunPod dict input compatibility"
  - "GPU-dependent imports are lazy (inside function body, not at module top level)"

requirements-completed: [HDLR-02, HDLR-03]

duration: 1min
completed: 2026-04-09
---

# Phase 6 Plan 1: Handler Core Contracts Summary

**Pydantic v2 input/output schema with URL validation and singleton TribeModel loader with lazy import**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-09T01:12:32Z
- **Completed:** 2026-04-09T01:13:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- InputSchema with field_validator rejecting empty strings and non-HTTP(S) schemes
- Full output contract: OutputSchema, Segment, RegionScores, Summary, ErrorResponse
- Singleton model loader with lazy tribev2 import and perf_counter timing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create input/output schema with Pydantic models** - `10f6085` (feat)
2. **Task 2: Create singleton model loader** - `8be5a13` (feat)

## Files Created/Modified
- `src/schema.py` - Pydantic v2 models: InputSchema, OutputSchema, Segment, RegionScores, Summary, ErrorResponse
- `src/model_loader.py` - Singleton TribeModel loader with lazy import and timing

## Decisions Made
- Used `str` type for `video_url` with custom `field_validator` instead of `HttpUrl` to avoid RunPod serialization issues
- Lazy `tribev2` import inside `get_model()` function body so schema tests work on machines without GPU
- No `cache_folder` argument to `from_pretrained` -- default HuggingFace cache respects `HF_HOME`/`TRANSFORMERS_CACHE` env vars, works with RunPod network volumes
- Fail-fast design: no exception handling around model load so broken model crashes container at startup

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `InputSchema` and `OutputSchema` ready for handler.py (Phase 6 Plan 02) to import
- `get_model()` ready for module-level call in handler.py
- ErrorResponse ready for structured error returns from handler

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 06-handler-core*
*Completed: 2026-04-09*
