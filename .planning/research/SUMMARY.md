# Project Research Summary

**Project:** NeuroCut -- TRIBE v2 RunPod Serverless Inference Pipeline
**Domain:** Containerized ML inference (video-to-brain-activation prediction)
**Researched:** 2026-04-07
**Confidence:** MEDIUM

## Executive Summary

NeuroCut wraps Meta's TRIBE v2 brain-activation prediction model inside a RunPod serverless worker. TRIBE v2 accepts a video file and outputs predicted fMRI activations across 20,484 cortical vertices per second of video. The worker's job is straightforward in structure -- accept a video URL, download it, run inference, map the raw vertex output to a simplified NeuroCut schema (activation, arousal, valence, region breakdown per 2-second window), and return JSON. The recommended stack is nvidia/cuda:12.4.1 base image, Python 3.11, PyTorch 2.6.0+cu124, and the RunPod SDK 1.8.2, all tightly constrained by TRIBE v2's dependency pins.

The primary risk is not engineering complexity but scientific uncertainty: TRIBE v2 outputs raw cortical vertex activations, not the "engagement scores" or "arousal/valence" metrics the NeuroCut product requires. Mapping 20,484 brain vertices to 4-5 psychological constructs (attention, reward, emotional processing, social cognition) is a neuroscience problem that no amount of clean code will solve automatically. This mapping must be validated against known stimuli before any production deployment. The second major risk is container size and cold start -- the full dependency stack (CUDA + PyTorch + 4 backbone models + TRIBE v2) produces a 15-25 GB Docker image that can cause multi-minute cold starts on RunPod.

The recommended approach is a strict three-phase build: first validate locally that TRIBE v2 produces meaningfully differentiated output across video segments (this gates everything), then containerize with a lean Dockerfile and deploy to RunPod, and finally add production hardening (progress updates, timing, duration validation). The architecture is deliberately simple -- six Python modules in a single container, no orchestration layer, no persistent storage. RunPod handles scaling, queueing, and auth.

## Key Findings

### Recommended Stack

TRIBE v2's pyproject.toml drives all version decisions. PyTorch is pinned to >=2.5.1,<2.7, which means torch 2.6.0 with CUDA 12.4 wheels. Python must be 3.11 (3.12 has uncertain wheel availability for spacy/julius). The base image should be nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04 -- NOT the pytorch/pytorch image (too bloated, ~14GB with Conda) and NOT the -devel variant (saves ~3GB). Model weights total 6-11 GB across four sub-models (V-JEPA2, LLaMA 3.2-3B, Wav2Vec-BERT, TRIBE v2 checkpoint).

**Core technologies:**
- **nvidia/cuda:12.4.1-runtime**: Docker base -- lean CUDA runtime matching torch 2.6.0 stable wheels
- **Python 3.11**: Runtime -- required by TRIBE v2, safest for ML wheel compatibility
- **PyTorch 2.6.0+cu124**: ML framework -- latest within TRIBE v2's hard constraint
- **tribev2 (from source)**: Core model -- no PyPI release, must clone and pip install -e
- **RunPod SDK 1.8.2**: Serverless worker framework -- handler pattern, health checks, progress updates
- **ffmpeg (system)**: Video/audio codec backend required by moviepy
- **A40 (48GB VRAM)**: Starting GPU -- likely sufficient, best cost-performance for validation at $0.35/hr

### Expected Features

**Must have (table stakes):**
- Module-level model pre-loading (load once, serve many jobs)
- Input validation (reject bad payloads before burning GPU time)
- Video download from URL (RunPod has 10MB payload limit, so URL-based input is mandatory)
- Structured JSON output with both raw and mapped NeuroCut schema
- Error handling with typed error responses
- Temp file cleanup after every job
- Logging with job ID and stage timing

**Should have (add immediately after working):**
- Progress updates via runpod.serverless.progress_update() (trivial, high debugging value)
- Stage-level timing in response (critical for benchmarking the pipeline)
- Video duration validation (cost protection against oversized inputs)
- Async endpoint usage (/run + polling, NOT /runsync which has 90s timeout)

**Defer (v2+):**
- Cold start optimization via model baking vs network volume (optimize after baseline)
- Worker refresh between jobs (add only if memory leaks observed)
- Configurable inference parameters (add when callers need flexibility)
- Result storage in cloud (caller handles storage, not the worker)
- A/B video comparison (out of scope, caller-side concern)

### Architecture Approach

The system is a single stateless container with six modules: handler.py (entry point), model_loader.py (singleton model), video_fetcher.py (download), inference.py (TRIBE v2 wrapper), postprocessor.py (vertex-to-schema mapping), and schema.py (Pydantic contracts). The critical architectural pattern is module-level model loading -- the model loads once at container startup and persists across all jobs the worker handles. Each job is fully self-contained: download, process, return, cleanup. No state is shared between jobs.

**Major components:**
1. **handler.py** -- RunPod entry point, orchestrates pipeline, returns response
2. **model_loader.py** -- Loads TribeModel once at container start from cache/network volume
3. **video_fetcher.py** -- Downloads video from URL to /tmp with size/timeout validation
4. **inference.py** -- Thin wrapper around get_events_dataframe() + predict(), isolates TRIBE v2 API
5. **postprocessor.py** -- Maps 20,484 cortical vertices to NeuroCut schema (the hardest component, requires neuroscience knowledge)
6. **schema.py** -- Pydantic models defining input/output contract

### Critical Pitfalls

1. **Gated model access (LLaMA 3.2)** -- LLaMA is gated on HuggingFace. Container builds fail silently without HF_TOKEN. Prevention: pass token as RunPod env var, accept license beforehand, test full model load in container before deploying.
2. **Docker image bloat causing cold start timeouts** -- Naive image reaches 20-35 GB. Prevention: use runtime (not devel) base, skip plotting extras, multi-stage build, use network volume for weights. Target under 15 GB for image, weights on volume.
3. **GPU OOM from stacked sub-models** -- Four backbone models loaded simultaneously need 15-20 GB VRAM in FP16. Prevention: start with A40 (48GB), force FP16, profile with torch.cuda.max_memory_allocated(), do not try cheaper GPUs until baseline measured.
4. **TRIBE v2 output misunderstanding** -- Output is 20,484 cortical vertices per second, NOT engagement scores. The entire postprocessor mapping is a neuroscience question. Prevention: run demo notebook first, output both raw and mapped data, validate mapping against known stimuli.
5. **WhisperX dependency conflicts** -- WhisperX's ctranslate2 has strict CUDA requirements and can overwrite PyTorch CUDA with CPU-only version. Prevention: install PyTorch+CUDA first, then WhisperX, test torch.cuda.is_available() in container.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Model Exploration and Local Validation
**Rationale:** The entire project hypothesis depends on TRIBE v2 producing meaningfully differentiated output across video segments. If the model outputs near-uniform activation regardless of content, the product is invalid. This MUST be proven before any containerization work.
**Delivers:** Confirmed TRIBE v2 output format, working local inference pipeline, initial vertex-to-region mapping, answer to "does this model actually differentiate high-engagement vs low-engagement content?"
**Addresses:** Understanding output format (20,484 vertices), hemodynamic 5-second offset, temporal resolution alignment
**Avoids:** Pitfall 5 (output misunderstanding), Pitfall 9 (neuralset/neuraltrain dependency resolution)

### Phase 2: Containerization and Dockerfile
**Rationale:** Once local validation passes, the proven inference code must be containerized. This is where most dependency pitfalls surface (WhisperX conflicts, gated models, image bloat). Keeping this as a dedicated phase ensures container issues are isolated from inference logic issues.
**Delivers:** Working Docker image under 15 GB, all dependencies resolved, model weights strategy decided (bake vs network volume), full model load tested in container
**Addresses:** Container with CUDA + FFmpeg, model pre-loading, Dockerfile optimization
**Avoids:** Pitfall 1 (gated model auth), Pitfall 2 (image bloat), Pitfall 6 (WhisperX dependency hell), Pitfall 11 (spaCy model missing)

### Phase 3: Handler Implementation
**Rationale:** With a working container, build the RunPod handler with all six modules. This phase wires together input validation, video download, inference, post-processing, and structured output.
**Delivers:** Complete handler.py with all supporting modules, Pydantic schemas, error handling, temp file cleanup, logging
**Addresses:** Input validation, video download with retry, structured JSON output, error handling, temp file cleanup, logging
**Avoids:** Pitfall 4 (disk exhaustion), Pitfall 7 (MoviePy memory leaks), Pitfall 12 (unvalidated input)

### Phase 4: RunPod Deployment and Benchmarking
**Rationale:** Deploy to RunPod, run end-to-end tests, measure real performance. This is where GPU tier, cold start, and inference time questions get definitive answers. Use async endpoint from the start.
**Delivers:** Live RunPod endpoint, measured inference time per 60s video, cold start time, VRAM usage profile, GPU tier recommendation
**Addresses:** Execution timeout config, async endpoint usage, progress updates, stage-level timing
**Avoids:** Pitfall 3 (GPU OOM), Pitfall 8 (sync timeout)

### Phase 5: Production Hardening
**Rationale:** With benchmarks in hand, optimize for production use. Add duration validation, refine the vertex-to-region mapping based on validation results, tune GPU tier and scaling config.
**Delivers:** Production-ready worker with cost controls, validated output mapping, documented API contract
**Addresses:** Video duration validation, worker refresh (if needed), configurable parameters
**Avoids:** Cost overruns from oversized inputs, stale workers from memory leaks

### Phase Ordering Rationale

- Phase 1 before everything: the research unanimously flags output interpretation as the highest-risk unknown. Building a container around a model you do not understand wastes time.
- Phase 2 before Phase 3: dependency resolution in Docker is notoriously fragile for ML stacks. Isolate container problems from application logic problems.
- Phase 3 before Phase 4: the handler should work locally (via RunPod SDK local testing) before deploying to paid GPU infrastructure.
- Phase 4 before Phase 5: you cannot optimize what you have not measured. GPU tier, cold start strategy, and timeout config all depend on real benchmarks.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Needs /gsd-research-phase -- the vertex-to-region mapping is a neuroscience problem with sparse engineering documentation. Must research fsaverage5 atlases (Destrieux, Desikan-Killiany) to define REGION_MASKS.
- **Phase 2:** Needs /gsd-research-phase -- WhisperX + ctranslate2 + CUDA version matrix is poorly documented. May need to test multiple version combinations.

Phases with standard patterns (skip research-phase):
- **Phase 3:** Well-documented RunPod handler patterns, Pydantic schemas, standard Python HTTP download code.
- **Phase 4:** RunPod deployment is well-documented. Standard endpoint configuration.
- **Phase 5:** Standard production hardening patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions extracted directly from TRIBE v2 pyproject.toml. CUDA/torch compatibility verified against PyTorch release matrix. |
| Features | HIGH | RunPod handler patterns are well-documented. Feature set is conventional for ML inference workers. |
| Architecture | MEDIUM | Component boundaries are clear, but the postprocessor (vertex-to-region mapping) is speculative. No established pattern for this specific mapping exists. |
| Pitfalls | HIGH | Pitfalls sourced from TRIBE v2 repo analysis, RunPod documentation, and known ML containerization failure modes. Well-grounded. |

**Overall confidence:** MEDIUM -- the engineering is straightforward and well-documented, but the core value proposition (meaningful brain activation scores from TRIBE v2) depends on a neuroscience mapping that has not been validated. The stack and infrastructure are high-confidence; the output interpretation is the gap.

### Gaps to Address

- **Vertex-to-region mapping**: No established engineering pattern for mapping fsaverage5 cortical vertices to psychological constructs (attention, arousal, valence). Requires neuroscience atlas lookup and validation against known stimuli. Must be addressed in Phase 1.
- **Exact model sizes**: Sub-model weight sizes are estimated from architecture types (LLaMA 3.2-3B ~6GB, V-JEPA2 ~2GB, etc.). Exact sizes need validation by running from_pretrained() and checking cache folder.
- **WhisperX as implicit dependency**: TRIBE v2's demo notebook uses WhisperX but it may not be in pyproject.toml. Need to verify if it is required or optional, and resolve its CUDA version requirements.
- **neuralset/neuraltrain packages**: Listed in TRIBE v2's pyproject.toml as v0.0.2. May be Meta-internal packages bundled in the repo. Must verify installation works in a clean environment early.
- **Inference time**: No published benchmarks. Estimated 30-120 seconds per 60-second video on A100. Must measure in Phase 4.
- **DINOv2 dependency**: ARCHITECTURE.md mentions DINOv2 as an additional backbone not mentioned in STACK.md. Unclear if this is a separate download or bundled with V-JEPA2. Needs verification.

## Sources

### Primary (HIGH confidence)
- [TRIBE v2 GitHub Repository](https://github.com/facebookresearch/tribev2) -- pyproject.toml, demo notebook, output format
- [RunPod Handler Documentation](https://docs.runpod.io/serverless/workers/handler-functions) -- handler pattern, progress updates
- [RunPod Worker Template](https://github.com/runpod-workers/worker-template) -- Dockerfile patterns
- [PyTorch 2.6 Release](https://pytorch.org/blog/pytorch2-6/) -- CUDA 12.4 compatibility
- [RunPod Endpoint Configuration](https://docs.runpod.io/serverless/endpoints/endpoint-configurations) -- timeout, scaling

### Secondary (MEDIUM confidence)
- [Meta AI Blog: TRIBE v2](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/) -- architecture overview, sub-model descriptions
- [RunPod Serverless Pricing](https://www.runpod.io/pricing) -- GPU cost comparison
- [RunPod Model Caching](https://docs.runpod.io/serverless/endpoints/model-caching) -- cold start mitigation strategies

### Tertiary (LOW confidence)
- Sub-model VRAM estimates -- inferred from parameter counts, not measured
- Vertex-to-region mapping approach -- speculative, requires neuroscience validation
- WhisperX dependency status -- inferred from demo notebook, not confirmed in pyproject.toml

---
*Research completed: 2026-04-07*
*Ready for roadmap: yes*
