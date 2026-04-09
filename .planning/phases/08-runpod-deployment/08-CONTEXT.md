# Phase 8: RunPod Deployment - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Deploy the NeuroCut worker to RunPod as a live serverless endpoint. This includes: creating a RunPod account with API key (DEPL-01), pushing the Docker image to a container registry (DEPL-02), creating the serverless endpoint with appropriate GPU/timeout/scaling config (DEPL-03), and configuring async endpoint usage (DEPL-04).

Requirements: DEPL-01, DEPL-02, DEPL-03, DEPL-04

Note: The user already has a RunPod account. DEPL-01 just needs API key configuration.
Docker build must happen on a machine with Docker access — RunPod pods don't have Docker.
Options: build locally with Docker Desktop, use GitHub Actions CI, or use RunPod's template system.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Key decisions:
- Container registry: Docker Hub (free, simple) vs GitHub Container Registry
- Deployment method: RunPod CLI, API, or web console
- Whether to write deployment scripts or provide manual instructions

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Dockerfile — verified working, ready to build
- src/handler.py — complete RunPod handler
- All src/ modules — inference, postprocessor, schema, model_loader, video_fetcher, region_mapping

### Integration Points
- Phase 9 tests the deployed endpoint E2E
- Phase 10 adds production hardening (progress updates, timing, validation)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
