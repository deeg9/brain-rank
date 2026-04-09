# Phase 7: Handler Inference and Output - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Complete the RunPod handler pipeline: add inference.py (TRIBE v2 wrapper), postprocessor.py (vertex-to-schema mapping), wire everything into handler.py (replace the Phase 6 TODO stub), add structured error handling, temp file cleanup on all code paths, and per-step logging with job ID.

Requirements: HDLR-05, HDLR-06, HDLR-07, HDLR-08, HDLR-09

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- src/handler.py — Phase 6 handler with TODO Phase 7 stub at line 59
- src/model_loader.py — singleton TribeModel loader
- src/video_fetcher.py — secure video download
- src/schema.py — Pydantic input/output models
- src/region_mapping/ — scoring and temporal alignment
- scripts/test_inference.py — reference for TribeModel API (get_events_dataframe + predict)
- data/region_masks.npz — pre-computed brain region masks

### Integration Points
- inference.py wraps TribeModel.get_events_dataframe() + model.predict()
- postprocessor.py uses region_mapping to map raw (N, 20484) to per-region scores
- handler.py orchestrates: validate → download → infer → postprocess → return JSON

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
