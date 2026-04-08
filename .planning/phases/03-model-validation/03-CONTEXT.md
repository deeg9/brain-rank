# Phase 3: Model Validation - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure/validation phase)

<domain>
## Phase Boundary

Validate that TRIBE v2 output meaningfully differentiates between video content types. Run inference on two videos with visibly different engagement levels (e.g., high-action scene vs static/boring content), apply the region mapping from Phase 2, and compare per-region activation scores. Record a go/no-go decision on model viability. Inference time is already measured from Phase 1 (759s total for 60s video on A40).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — validation phase. Key decisions:
- Which two test videos to use (high-engagement vs low-engagement)
- Statistical method for comparing activation scores (effect size, t-test, visual inspection)
- Threshold for "meaningful differentiation" (how different is different enough)
- Format of the go/no-go report

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- scripts/test_inference.py — runs inference and saves JSON output
- src/region_mapping/ — maps raw vertices to 4 brain regions
- scripts/validate_mapping.py — loads masks and computes region scores
- docs/inference_output.json — Phase 1 inference results (Sintel trailer)

### Established Patterns
- Python scripts in scripts/ directory
- JSON output for machine-readable results
- Documentation in docs/ directory

### Integration Points
- Uses region_mapping module from Phase 2
- Results inform whether to proceed with containerization (Phase 4+)
- Inference time already known: 759s on A40 (Phase 1)

</code_context>

<specifics>
## Specific Ideas

- Need TWO different videos: one high-engagement (action, emotion, social interaction) and one low-engagement (static scene, boring content, test pattern)
- The Sintel trailer from Phase 1 could serve as the high-engagement video
- Need a clearly low-engagement video for contrast (screen recording, static landscape, etc.)
- Requires RunPod GPU pod again for inference

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
