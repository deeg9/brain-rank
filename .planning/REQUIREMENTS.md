# Requirements: NeuroCut Inference Pipeline

**Defined:** 2026-04-07
**Core Value:** Send a video URL to a RunPod endpoint and get back per-segment brain activation scores as JSON

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Model Validation

- [ ] **MODL-01**: TRIBE v2 cloned from facebookresearch/tribev2 and dependencies installed in a clean environment
- [ ] **MODL-02**: TRIBE v2 runs locally on a GPU and produces output for a 60-second test video
- [ ] **MODL-03**: Raw TRIBE v2 output format (20,484 cortical vertices per timestep) is documented and understood
- [ ] **MODL-04**: Vertex-to-region mapping defined for target brain regions (attention, reward, emotional processing, social cognition)
- [ ] **MODL-05**: Output meaningfully differentiates between high-engagement and low-engagement video segments
- [ ] **MODL-06**: Hemodynamic delay (5-second offset) accounted for in temporal alignment
- [ ] **MODL-07**: Inference time measured and documented for a 60-second video on target GPU

### Containerization

- [ ] **CNTR-01**: Dockerfile built on nvidia/cuda:12.4.1-runtime with Python 3.11 and PyTorch 2.6.0
- [ ] **CNTR-02**: All TRIBE v2 dependencies resolved in container (including neuralset, neuraltrain, WhisperX if required)
- [ ] **CNTR-03**: Gated model access (LLaMA 3.2) works in container via HF_TOKEN environment variable
- [ ] **CNTR-04**: Full model load (all sub-models) succeeds in container and torch.cuda.is_available() returns True
- [ ] **CNTR-05**: Docker image size documented and optimized (target: under 15 GB excluding model weights)
- [ ] **CNTR-06**: Model weights strategy decided and implemented (bake into image vs network volume)

### Handler

- [ ] **HDLR-01**: RunPod handler function accepts job input with video URL and returns structured JSON
- [ ] **HDLR-02**: Model loaded at module level (once at container start), reused across all jobs
- [ ] **HDLR-03**: Input validation rejects requests missing video URL or with invalid parameters
- [ ] **HDLR-04**: Video downloaded from URL to temp storage with size limit enforcement
- [ ] **HDLR-05**: TRIBE v2 inference runs on downloaded video and produces per-segment scores
- [ ] **HDLR-06**: Output includes both raw TRIBE v2 data and mapped NeuroCut schema (2-second windows with activation, arousal, valence, region breakdown)
- [ ] **HDLR-07**: Structured error responses returned for validation, download, and inference failures
- [ ] **HDLR-08**: Temp files cleaned up after every job (video files, extracted frames, audio)
- [ ] **HDLR-09**: Logging with job ID and processing stage at every step

### Deployment

- [ ] **DEPL-01**: RunPod account created with API key configured
- [ ] **DEPL-02**: Docker image pushed to container registry accessible by RunPod
- [ ] **DEPL-03**: RunPod serverless endpoint created and configured (GPU tier, timeout, scaling)
- [ ] **DEPL-04**: Async endpoint (/run + status polling) used instead of sync (/runsync) to avoid 90s timeout
- [ ] **DEPL-05**: End-to-end test passes: send video URL to RunPod endpoint, receive JSON scores back
- [ ] **DEPL-06**: Inference time, cold start time, and VRAM usage measured on RunPod GPU

### Production Hardening

- [ ] **PROD-01**: Progress updates sent during processing via runpod.serverless.progress_update()
- [ ] **PROD-02**: Stage-level timing included in response (download_ms, preprocess_ms, inference_ms, postprocess_ms, total_ms)
- [ ] **PROD-03**: Video duration validation rejects videos exceeding maximum length before processing
- [ ] **PROD-04**: Execution timeout configured appropriately based on benchmarked inference time

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Cold Start Optimization

- **COLD-01**: Model weights cached on RunPod network volume for faster cold starts
- **COLD-02**: Docker image optimized with multi-stage build to minimize pull time

### Worker Reliability

- **RELY-01**: Worker refresh between jobs if memory leaks detected
- **RELY-02**: Configurable inference parameters (segment_duration, output_format)

### Multiple Video Support

- **MULT-01**: A/B comparison mode processing two videos per job
- **MULT-02**: Summary comparison output (overall, hook, retention, peak moment per video)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Frontend/UI | Deferred to future milestone — inference validation first |
| Backend scaffolding (Supabase, R2, Stripe) | Deferred to future milestone |
| Authentication/authorization in worker | RunPod handles auth via API keys |
| Video upload to worker | RunPod has 10MB payload limit; URL-based input only |
| Result storage in cloud (S3/R2) | Worker returns JSON; caller handles storage |
| Streaming/async handler | Batch inference; no intermediate results to stream |
| Concurrent job handling | GPU-bound; one job per worker, scale horizontally |
| Webhook callbacks | RunPod supports webhooks natively; no worker code needed |
| Credit system / payments | Future milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MODL-01 | Phase ? | Pending |
| MODL-02 | Phase ? | Pending |
| MODL-03 | Phase ? | Pending |
| MODL-04 | Phase ? | Pending |
| MODL-05 | Phase ? | Pending |
| MODL-06 | Phase ? | Pending |
| MODL-07 | Phase ? | Pending |
| CNTR-01 | Phase ? | Pending |
| CNTR-02 | Phase ? | Pending |
| CNTR-03 | Phase ? | Pending |
| CNTR-04 | Phase ? | Pending |
| CNTR-05 | Phase ? | Pending |
| CNTR-06 | Phase ? | Pending |
| HDLR-01 | Phase ? | Pending |
| HDLR-02 | Phase ? | Pending |
| HDLR-03 | Phase ? | Pending |
| HDLR-04 | Phase ? | Pending |
| HDLR-05 | Phase ? | Pending |
| HDLR-06 | Phase ? | Pending |
| HDLR-07 | Phase ? | Pending |
| HDLR-08 | Phase ? | Pending |
| HDLR-09 | Phase ? | Pending |
| DEPL-01 | Phase ? | Pending |
| DEPL-02 | Phase ? | Pending |
| DEPL-03 | Phase ? | Pending |
| DEPL-04 | Phase ? | Pending |
| DEPL-05 | Phase ? | Pending |
| DEPL-06 | Phase ? | Pending |
| PROD-01 | Phase ? | Pending |
| PROD-02 | Phase ? | Pending |
| PROD-03 | Phase ? | Pending |
| PROD-04 | Phase ? | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 0
- Unmapped: 32

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after initial definition*
