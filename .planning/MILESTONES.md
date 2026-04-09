# Milestones

## Completed

### v1.0: Inference Pipeline (2026-04-07 — 2026-04-09)

**Goal:** Send a video URL to a RunPod endpoint and get back per-segment brain activation scores as JSON — proving the model works, the pipeline is viable, and inference time is acceptable.

**Phases:** 10 phases, all complete
1. Model Setup — TRIBE v2 cloned, installed, first inference on GPU
2. Output Mapping — 20,484 cortical vertices mapped to brain regions
3. Model Validation — GO decision: model differentiates engagement (Cohen d 0.40-1.02)
4. Container Foundation — Dockerfile with CUDA, Python 3.11, PyTorch, TRIBE v2
5. Container Verification — Full model load in container, image optimized
6. Handler Core — RunPod handler with input validation, video download
7. Handler Inference and Output — Full inference pipeline with error handling
8. RunPod Deployment — Live serverless endpoint on RunPod
9. End-to-End Validation — Pipeline test and benchmarking
10. Production Hardening — Progress updates, timing, timeout tuning

**Key outcomes:**
- TRIBE v2 inference works end-to-end on RunPod A40
- 759s total / 679s inference time for 60s video
- Async endpoint pattern (/run + polling) due to 12+ min inference
- Pre-computed brain region masks (no nilearn at runtime)
- CC BY-NC-4.0 license — non-commercial validation only
