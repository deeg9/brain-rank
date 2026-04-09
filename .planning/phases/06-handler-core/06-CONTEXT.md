# Phase 6: Handler Core - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Build the RunPod serverless handler: handler.py entry point, model_loader.py (singleton model loading at module level), video_fetcher.py (download video from URL to temp storage), and schema.py (Pydantic input/output models). The handler accepts job input with a video URL, validates it, and downloads the video.

Requirements: HDLR-01, HDLR-02, HDLR-03, HDLR-04

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase. Follow the architecture from research: handler.py orchestrates, model_loader.py loads TribeModel once at module level, video_fetcher.py handles download with size limits, schema.py defines Pydantic contracts.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- scripts/test_inference.py — reference for TribeModel API pattern
- src/region_mapping/ — scoring and temporal alignment modules
- Dockerfile — container structure (handler goes in src/)

### Integration Points
- Phase 7 adds inference pipeline and output mapping to this handler
- handler.py must conform to RunPod serverless pattern: runpod.serverless.start({"handler": handler_fn})

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
