# NeuroCut — Inference Pipeline

## What This Is

A containerized RunPod serverless worker that runs TRIBE v2 (Meta's brain-activation prediction model) on video input and returns per-segment neural activation scores. This is the foundational inference layer for NeuroCut — a neural A/B testing tool for content creators. This project covers only the inference pipeline: finding TRIBE v2, getting it running, containerizing it, and deploying it as a RunPod serverless endpoint.

## Core Value

Send a video URL to a RunPod endpoint and get back per-segment brain activation scores as JSON — proving the model works, the pipeline is viable, and inference time is acceptable.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Locate and clone the TRIBE v2 model from Meta/facebookresearch
- [ ] Get TRIBE v2 running locally and producing output for a 60-second video
- [ ] Understand TRIBE v2's actual output format and map it to the NeuroCut schema
- [ ] Containerize TRIBE v2 as a RunPod serverless worker (Dockerfile, handler)
- [ ] Set up RunPod account and deploy the containerized worker as a serverless endpoint
- [ ] Worker accepts a video URL, downloads it, runs inference, returns JSON scores
- [ ] Output includes both raw model output and a mapped version (2-second windows with activation, arousal, valence, region breakdown)
- [ ] Measure and document inference time per 60-second video on RunPod GPU
- [ ] End-to-end test: send video URL to RunPod endpoint, receive JSON scores back

### Out of Scope

- Frontend/UI — deferred to future milestone
- Backend scaffolding (Supabase, R2, Stripe) — deferred to future milestone
- Multiple video comparison (A/B) — only single video inference for now
- Credit system / payments — deferred
- Authentication / user accounts — deferred
- Video upload flow — worker takes a URL, upload mechanism is separate

## Context

- TRIBE v2 is a Meta Research model (facebookresearch) for predicting brain activation from video/audio stimuli
- Licensed CC BY-NC-4.0 — fine for validation, commercial use needs separate arrangement later
- The architecture doc specifies nvidia/cuda base image with Python 3.11, torch, transformers, torchaudio, tribev2, runpod SDK
- RunPod account and API access need to be set up from scratch
- This is Phase 1 of a larger NeuroCut product — everything downstream (backend, frontend, payments) depends on proving inference works
- Key open question: how long does TRIBE v2 take per 60-second video on a RunPod GPU? This determines UX strategy for the full product

## Constraints

- **Model license**: CC BY-NC-4.0 — non-commercial only for now, acceptable for validation
- **GPU requirement**: TRIBE v2 requires CUDA-capable GPU — RunPod A100/A40 expected
- **Container size**: ML model containers can be large (10GB+) — affects cold start time on RunPod serverless
- **RunPod serverless**: Must conform to RunPod's serverless worker pattern (handler function, input/output schema)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Inference-only scope | Validate the model works before building product around it | — Pending |
| RunPod serverless (not dedicated GPU) | Pay-per-job, no idle cost, matches eventual production architecture | — Pending |
| Return both raw + mapped output | Understand what TRIBE v2 actually produces while also validating the target schema | — Pending |
| Video input via URL (not direct upload) | Simpler for serverless, matches eventual R2 presigned URL flow | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-07 after initialization*
