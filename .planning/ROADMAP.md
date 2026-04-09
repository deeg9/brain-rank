# Roadmap: NeuroCut Inference Pipeline

## Overview

This roadmap delivers a containerized RunPod serverless worker that runs TRIBE v2 on video input and returns per-segment neural activation scores as JSON. The journey starts with getting the model running locally and understanding its output (the highest-risk unknown), progresses through containerization and handler implementation, and culminates in a deployed, benchmarked, production-hardened RunPod endpoint. Each phase delivers a verifiable capability that builds on the previous one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Model Setup** - Clone TRIBE v2, install dependencies, run first inference locally (completed 2026-04-08)
- [x] **Phase 2: Output Mapping** - Understand raw vertex output and define vertex-to-region mapping (completed 2026-04-08)
- [x] **Phase 3: Model Validation** - Confirm model differentiates content and benchmark local inference (completed 2026-04-08)
- [x] **Phase 4: Container Foundation** - Build Dockerfile with all dependencies and gated model access (completed 2026-04-08)
- [x] **Phase 5: Container Verification** - Full model load in container, image optimization, weights strategy (completed 2026-04-09)
- [x] **Phase 6: Handler Core** - RunPod handler entry point with input validation and video download (completed 2026-04-09)
- [x] **Phase 7: Handler Inference and Output** - Wire inference, output mapping, error handling, cleanup, logging (completed 2026-04-09)
- [ ] **Phase 8: RunPod Deployment** - Account setup, image push, endpoint creation, async config
- [ ] **Phase 9: End-to-End Validation** - Full pipeline test and performance benchmarking on RunPod
- [ ] **Phase 10: Production Hardening** - Progress updates, timing, duration validation, timeout tuning

## Phase Details

### Phase 1: Model Setup
**Goal**: TRIBE v2 is cloned, installed, and producing raw output for a test video on a remote GPU
**Depends on**: Nothing (first phase)
**Requirements**: MODL-01, MODL-02
**Success Criteria** (what must be TRUE):
  1. TRIBE v2 repository is cloned and all dependencies (including neuralset, neuraltrain) install without errors in a clean environment
  2. Running TRIBE v2 on a 60-second test video produces output without crashing
  3. Raw output tensor shape and format are visible and logged
**Plans:** 2/2 plans complete
Plans:
- [x] 01-01-PLAN.md — Create scripts for installation verification, remote setup, and inference testing
- [x] 01-02-PLAN.md — Execute on remote GPU, verify output, document raw output format

### Phase 2: Output Mapping
**Goal**: The raw cortical vertex output is fully understood and a vertex-to-region mapping is defined for NeuroCut's target constructs
**Depends on**: Phase 1
**Requirements**: MODL-03, MODL-04, MODL-06
**Success Criteria** (what must be TRUE):
  1. The 20,484 cortical vertex output format is documented with temporal resolution and data types
  2. A vertex-to-region mapping exists that assigns vertices to attention, reward, emotional processing, and social cognition regions
  3. The 5-second hemodynamic delay is accounted for in temporal alignment between video segments and activation data
**Plans:** 2/2 plans complete
Plans:
- [x] 02-01-PLAN.md — Core region mapping module (constants, regions, atlas, scoring, temporal) with tests
- [x] 02-02-PLAN.md — Pre-computed masks, validation script, and mapping documentation

### Phase 3: Model Validation
**Goal**: TRIBE v2 output meaningfully differentiates between video content types, and local inference time is known
**Depends on**: Phase 2
**Requirements**: MODL-05, MODL-07
**Success Criteria** (what must be TRUE):
  1. Running two videos with visibly different engagement levels produces measurably different activation scores in the mapped regions
  2. Inference time for a 60-second video on the local GPU is measured and documented
  3. A go/no-go decision on model viability is recorded based on differentiation quality
**Plans:** 2/2 plans complete
Plans:
- [x] 03-01-PLAN.md — Create validation script, setup script, and run on GPU pod (checkpoint)
- [x] 03-02-PLAN.md — Analyze results, write validation report and inference benchmarks

### Phase 4: Container Foundation
**Goal**: A Docker image builds successfully with CUDA, Python 3.11, PyTorch, all TRIBE v2 dependencies, and gated model access
**Depends on**: Phase 3
**Requirements**: CNTR-01, CNTR-02, CNTR-03
**Success Criteria** (what must be TRUE):
  1. Dockerfile based on nvidia/cuda:12.4.1-runtime builds without errors with Python 3.11 and PyTorch 2.6.0
  2. All TRIBE v2 dependencies (including neuralset, neuraltrain, WhisperX if required) resolve inside the container
  3. HF_TOKEN environment variable enables download of gated models (LLaMA 3.2) inside the container
**Plans:** 1/1 plans complete
Plans:
- [x] 04-01-PLAN.md — Dockerfile, .dockerignore, and container verification script

### Phase 5: Container Verification
**Goal**: The container loads all models on GPU and the image is optimized for RunPod deployment
**Depends on**: Phase 4
**Requirements**: CNTR-04, CNTR-05, CNTR-06
**Success Criteria** (what must be TRUE):
  1. All sub-models load inside the container and torch.cuda.is_available() returns True
  2. Docker image size is documented and under 15 GB (excluding model weights)
  3. Model weights strategy (baked into image vs network volume) is decided and implemented
**Plans:** 2/2 plans complete
Plans:
- [x] 05-01-PLAN.md — Create build/verify script and report template
- [x] 05-02-PLAN.md — Build Docker image on RunPod GPU pod, run verification, document results

### Phase 6: Handler Core
**Goal**: A RunPod handler accepts job input, validates it, and downloads video from URL
**Depends on**: Phase 5
**Requirements**: HDLR-01, HDLR-02, HDLR-03, HDLR-04
**Success Criteria** (what must be TRUE):
  1. Handler function conforms to RunPod serverless pattern and accepts a job with a video URL
  2. Model is loaded once at module level (container start) and reused across jobs
  3. Requests missing a video URL or with invalid parameters are rejected with clear error messages
  4. Video is downloaded from URL to temp storage with size limit enforcement
**Plans:** 2/2 plans complete
Plans:
- [x] 06-01-PLAN.md — Input/output schema (Pydantic) and singleton model loader
- [x] 06-02-PLAN.md — Video fetcher with SSRF prevention, handler entry point, Dockerfile CMD update

### Phase 7: Handler Inference and Output
**Goal**: The handler runs TRIBE v2 inference, maps output to NeuroCut schema, handles errors, cleans up temp files, and logs every step
**Depends on**: Phase 6
**Requirements**: HDLR-05, HDLR-06, HDLR-07, HDLR-08, HDLR-09
**Success Criteria** (what must be TRUE):
  1. Handler runs TRIBE v2 on a downloaded video and returns per-segment activation scores
  2. Response includes both raw TRIBE v2 data and mapped NeuroCut schema (2-second windows with activation, arousal, valence, region breakdown)
  3. Validation, download, and inference failures return structured error responses with error type and message
  4. All temp files (video, extracted frames, audio) are cleaned up after every job
  5. Every processing step is logged with job ID and stage name
**Plans:** 2/2 plans complete
Plans:
- [x] 07-01-PLAN.md — Inference wrapper (inference.py) and postprocessor (postprocessor.py)
- [x] 07-02-PLAN.md — Wire full pipeline into handler.py with error handling and cleanup

### Phase 8: RunPod Deployment
**Goal**: The containerized worker is deployed to RunPod as a live serverless endpoint
**Depends on**: Phase 7
**Requirements**: DEPL-01, DEPL-02, DEPL-03, DEPL-04
**Success Criteria** (what must be TRUE):
  1. RunPod account exists with API key configured
  2. Docker image is pushed to a container registry accessible by RunPod
  3. RunPod serverless endpoint is created with appropriate GPU tier, timeout, and scaling config
  4. Endpoint uses async pattern (/run + status polling) instead of sync (/runsync)
**Plans:** 2 plans
Plans:
- [ ] 08-01-PLAN.md — Deployment scripts (build+push, async test client) and deployment guide
- [ ] 08-02-PLAN.md — Docker build, image push, RunPod endpoint creation (human action)

### Phase 9: End-to-End Validation
**Goal**: A video URL sent to the live RunPod endpoint returns correct JSON scores, and performance is benchmarked
**Depends on**: Phase 8
**Requirements**: DEPL-05, DEPL-06
**Success Criteria** (what must be TRUE):
  1. Sending a video URL to the RunPod endpoint returns a complete JSON response with per-segment activation scores
  2. Inference time, cold start time, and VRAM usage are measured and documented for a 60-second video on RunPod GPU
  3. Response format matches the NeuroCut schema defined in Phase 2
**Plans:** 2 plans
Plans:
- [x] 07-01-PLAN.md — Inference wrapper (inference.py) and postprocessor (postprocessor.py)
- [x] 07-02-PLAN.md — Wire full pipeline into handler.py with error handling and cleanup

### Phase 10: Production Hardening
**Goal**: The worker reports progress during processing, includes detailed timing, validates input duration, and has appropriate timeouts
**Depends on**: Phase 9
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04
**Success Criteria** (what must be TRUE):
  1. Progress updates are sent during processing via runpod.serverless.progress_update() and visible through the status polling API
  2. Response includes stage-level timing breakdown (download_ms, preprocess_ms, inference_ms, postprocess_ms, total_ms)
  3. Videos exceeding maximum allowed duration are rejected before any GPU processing begins
  4. Execution timeout is configured based on benchmarked inference time from Phase 9
**Plans:** 2 plans
Plans:
- [x] 07-01-PLAN.md — Inference wrapper (inference.py) and postprocessor (postprocessor.py)
- [x] 07-02-PLAN.md — Wire full pipeline into handler.py with error handling and cleanup

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Model Setup | 2/2 | Complete    | 2026-04-08 |
| 2. Output Mapping | 2/2 | Complete    | 2026-04-08 |
| 3. Model Validation | 2/2 | Complete    | 2026-04-08 |
| 4. Container Foundation | 1/1 | Complete    | 2026-04-08 |
| 5. Container Verification | 2/2 | Complete    | 2026-04-09 |
| 6. Handler Core | 2/2 | Complete    | 2026-04-09 |
| 7. Handler Inference and Output | 2/2 | Complete    | 2026-04-09 |
| 8. RunPod Deployment | 0/2 | Planned | - |
| 9. End-to-End Validation | 0/0 | Not started | - |
| 10. Production Hardening | 0/0 | Not started | - |
