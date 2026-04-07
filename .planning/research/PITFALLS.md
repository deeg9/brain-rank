# Domain Pitfalls

**Domain:** ML inference pipeline — PyTorch neuroscience model (TRIBE v2) containerized for RunPod serverless
**Researched:** 2026-04-07

## Critical Pitfalls

Mistakes that cause rewrites, deployment failures, or unusable pipelines.

### Pitfall 1: Gated Model Access Breaks in Container

**What goes wrong:** TRIBE v2 uses LLaMA 3.2-3B as its text encoder, which is a gated model on HuggingFace. The first run triggers an interactive prompt for a HuggingFace token. In a Docker container or RunPod serverless worker, there is no interactive prompt — the model download silently fails or throws an opaque error, and inference crashes at runtime.

**Why it happens:** Developers test locally where they have already accepted the LLaMA license and cached credentials. They forget that a fresh container has no cached token, no accepted license agreement, and no way to interactively authenticate.

**Consequences:** Worker starts, loads TRIBE v2 checkpoint (~1 GB), then crashes when trying to load the text encoder. Cold start time is wasted. Every request fails until someone realizes the token is missing.

**Prevention:**
- Accept the LLaMA 3.2 license on HuggingFace before any containerization work
- Pass `HF_TOKEN` as an environment variable in the RunPod endpoint configuration (never bake it into the Docker image)
- Set `HUGGING_FACE_HUB_TOKEN` or use `huggingface-cli login --token $HF_TOKEN` in the container entrypoint
- Test the full model load in the container with `docker run` before deploying to RunPod
- Consider pre-downloading LLaMA 3.2-3B weights into the Docker image at build time (adds ~6 GB to image but eliminates runtime auth)

**Detection:** Handler crashes with "access denied" or "gated repo" errors in RunPod logs. Model loads partially but text encoder initialization fails.

**Phase:** Must be addressed in Phase 1 (containerization). Test before deploying to RunPod.

---

### Pitfall 2: Docker Image Too Large, Cold Starts Exceed Timeout

**What goes wrong:** TRIBE v2 depends on multiple large sub-models: V-JEPA2 (~1.2B params), LLaMA 3.2-3B, Wav2Vec-BERT, DINOv2, plus PyTorch, CUDA runtime, ffmpeg, WhisperX, and spaCy language models. A naive Docker image easily reaches 20-35 GB. On RunPod serverless, the first request to a cold worker must pull this image, which can take minutes — potentially exceeding the caller's timeout.

**Why it happens:** Developers include all dependencies, training extras, visualization packages (matplotlib, pyvista, nilearn from the `[plotting]` extra), and full CUDA toolkit. They test on a machine where the image is already cached and never experience the cold pull.

**Consequences:** First requests after scale-down timeout. Users see errors. RunPod charges for idle time during image pull (though model caching helps). Perceived latency is terrible.

**Prevention:**
- Install only the base `tribev2` package (not `[plotting]` or `[training]` extras) — plotting deps (nibabel, matplotlib, seaborn, pyvista, nilearn, scipy, scikit-image) are unnecessary for inference
- Use a slim CUDA base image (e.g., `nvidia/cuda:12.4.1-runtime-ubuntu22.04` not `-devel`)
- Multi-stage Docker build: install build deps in stage 1, copy only runtime artifacts to stage 2
- Use RunPod's model caching feature for the HuggingFace model weights — keeps weights separate from container image
- Strip PyTorch of unused backends (CPU-only fallback code, test files)
- Pre-download and cache all sub-model weights (V-JEPA2, DINOv2, Wav2Vec-BERT, LLaMA 3.2) at build time to avoid first-request download delays, OR use network volume
- Target: keep the Docker image under 15 GB; keep model weights on network volume or use RunPod model caching
- Set at least 1 active worker (min workers = 1) during validation to avoid cold start entirely

**Detection:** Measure time from RunPod request to first log line in handler. If > 60 seconds, image pull is the bottleneck.

**Phase:** Phase 1 (containerization). Get the image right before deploying. Iterate on size before pushing to registry.

---

### Pitfall 3: GPU Memory Exhaustion from Stacked Sub-Models

**What goes wrong:** TRIBE v2 loads four feature extractors simultaneously — V-JEPA2 (1.2B params, ~2.4 GB FP16), LLaMA 3.2-3B (~6.8 GB FP16), DINOv2 (~1.5 GB), Wav2Vec-BERT (~1.3 GB) — plus the TRIBE v2 Transformer itself. Total VRAM requirement is estimated at 15-20 GB for FP16 inference with activations. If you pick a GPU with insufficient VRAM (e.g., A4000 16GB, T4 16GB), or if the model loads in FP32 by default, you get OOM crashes.

**Why it happens:** TRIBE v2 is a research model designed to run on A100s. The documentation does not state explicit VRAM requirements. Developers pick a cheaper GPU tier on RunPod and discover OOM only at runtime.

**Consequences:** Worker crashes with CUDA OOM. RunPod charges for the GPU time up to the crash. No inference result returned. Debugging requires examining nvidia-smi logs or adding memory profiling.

**Prevention:**
- Start with A40 (48 GB VRAM) or A100 (40/80 GB) on RunPod — do not try to optimize GPU tier until baseline works
- Force FP16 inference: `model.half()` or `torch.autocast('cuda', dtype=torch.float16)`
- Profile actual VRAM usage with `torch.cuda.max_memory_allocated()` after a successful inference run
- Add `torch.cuda.empty_cache()` between processing stages if doing sequential feature extraction
- Do NOT load sub-models you do not need (if text is not present in video, consider skipping LLaMA — investigate if TRIBE v2 supports this)
- Once baseline VRAM is known, select the smallest GPU that fits with 20% headroom

**Detection:** `RuntimeError: CUDA out of memory` in logs. Worker exits with non-zero code. RunPod shows job failed status.

**Phase:** Phase 1 (local testing). Profile VRAM before containerizing. GPU tier selection in Phase 1 (deployment).

---

### Pitfall 4: Video Download Fills Disk, Worker Crashes

**What goes wrong:** RunPod serverless workers have limited temporary disk space (default ~5 GB for container disk). A 60-second 1080p video is roughly 50-200 MB, but the handler also needs space for: extracted audio (WAV format can be 10x the compressed size), WhisperX temporary files, model cache, and intermediate tensors. Processing longer or higher-resolution videos can exhaust disk space.

**Why it happens:** Developers test with short clips locally where disk is unlimited. They do not account for WAV audio extraction (uncompressed audio from a 60s video at 16kHz mono is ~1.9 MB, but at 44.1kHz stereo it is ~21 MB), temporary files from ffmpeg, and spaCy model caches.

**Consequences:** Worker crashes mid-inference with no useful error. The video downloads successfully but audio extraction or model inference fails due to disk full. Partial results are lost.

**Prevention:**
- Clean up downloaded video and extracted audio files immediately after feature extraction completes (use `try/finally` blocks)
- Stream video download, do not buffer entire file in memory
- Validate video duration/size BEFORE downloading — reject videos over a configurable limit (e.g., 5 minutes for initial validation)
- Increase container disk size in RunPod endpoint configuration if needed
- Use `/tmp` for all temporary files and clean aggressively
- Consider processing audio in chunks rather than extracting entire WAV at once

**Detection:** `OSError: No space left on device` or `IOError` in logs. Worker stops responding mid-job.

**Phase:** Phase 1 (handler implementation). Build cleanup into the handler from day one.

---

### Pitfall 5: Misunderstanding TRIBE v2 Output Format

**What goes wrong:** TRIBE v2 outputs a `(n_timesteps, 20484)` numpy array — one prediction per second across ~20,000 cortical vertices on the fsaverage5 mesh. This is NOT "activation score per video segment." Developers assume the output is a simple scalar per time window (like "engagement: 0.85") and build the entire downstream schema around that assumption. The actual output requires neuroscience-aware post-processing to extract meaningful metrics.

**Why it happens:** The project description mentions "per-segment neural activation scores" and "activation, arousal, valence, region breakdown." TRIBE v2 does not natively output arousal, valence, or engagement scores — it outputs predicted fMRI voxel activations. Mapping voxels to psychological constructs requires knowing which brain regions correspond to which functions (e.g., amygdala for arousal, prefrontal cortex for attention).

**Consequences:** The entire output mapping layer has to be designed from scratch. If discovered late, the project timeline slips significantly. The MVP schema may need fundamental revision.

**Prevention:**
- Run the demo notebook (`tribe_demo.ipynb`) end-to-end BEFORE designing the output schema
- Understand the output: 20,484 vertices on fsaverage5 = 10,242 per hemisphere of cortical surface
- The 5-second hemodynamic offset means predictions at time T correspond to stimuli at time T-5 — the output timestamps must be adjusted
- Plan the mapping layer explicitly: which vertex groups map to which brain regions, and which regions map to which psychological constructs
- Start with simple aggregations (mean activation per region of interest) before attempting arousal/valence decomposition
- Consult neuroscience literature on fMRI-to-affect mapping — this is a research problem, not an engineering one

**Detection:** Output JSON has 20,484 values per timestep instead of the expected 3-5 summary metrics. Downstream consumers cannot interpret raw vertex data.

**Phase:** Phase 1 (model exploration). Must be resolved before designing the handler output schema. This is the highest-risk knowledge gap in the project.

## Moderate Pitfalls

### Pitfall 6: WhisperX/ffmpeg Dependency Hell in Docker

**What goes wrong:** TRIBE v2 uses WhisperX for speech transcription (extracting text from video audio). WhisperX depends on `faster-whisper`, which depends on `ctranslate2`, which has strict CUDA version requirements. Installing WhisperX via pip inside a Docker container frequently breaks because: (a) pip installs CPU-only PyTorch, overriding the CUDA version, (b) ctranslate2 binaries are compiled for a specific CUDA version, (c) ffmpeg must be installed via apt, not pip.

**Prevention:**
- Install PyTorch with CUDA explicitly FIRST, then install WhisperX
- Install ffmpeg via `apt-get install ffmpeg` in the Dockerfile
- Pin `faster-whisper` and `ctranslate2` versions that match your CUDA base image
- Test the full import chain (`import whisperx; import torch; assert torch.cuda.is_available()`) in the container before proceeding
- Consider pre-extracting audio with ffmpeg directly instead of relying on WhisperX's internal pipeline if transcription quality is not critical

**Detection:** `ImportError` for ctranslate2, or `torch.cuda.is_available()` returns False despite running on GPU.

**Phase:** Phase 1 (Dockerfile creation). Resolve before any model inference testing.

---

### Pitfall 7: MoviePy Memory Leaks on Sequential Processing

**What goes wrong:** TRIBE v2 lists `moviepy>=2.2.1` as a dependency (used for video/audio processing). MoviePy has well-documented memory leak issues — `VideoFileClip` objects do not release memory when deleted due to reference cycles in `__del__`. If the handler processes multiple requests without restarting, memory grows unbounded.

**Prevention:**
- Explicitly close all MoviePy clips with `.close()` in a `finally` block
- Call `gc.collect()` after processing each video
- Monitor RSS memory between requests — if it grows, the worker needs periodic restart
- RunPod serverless helps here: workers can be configured to restart after N requests
- Consider using `ffmpeg` subprocess calls directly instead of MoviePy for simple audio extraction

**Detection:** Worker memory usage grows with each request. Eventually crashes with MemoryError or gets OOM-killed by the container runtime.

**Phase:** Phase 1 (handler implementation). Add cleanup from the start.

---

### Pitfall 8: RunPod Sync Timeout for Video Processing

**What goes wrong:** RunPod's synchronous endpoint (`/runsync`) has a 90-100 second timeout. For a 60-second video, the pipeline must: download video (2-10s), extract audio (2-5s), run WhisperX transcription (10-30s), extract visual features from every frame (unknown, potentially 30-60s+), run text through LLaMA (5-10s), run TRIBE v2 Transformer (unknown), and return results. This can easily exceed 90 seconds.

**Prevention:**
- Use the async endpoint (`/run`) with status polling (`/status/{job_id}`) from day one — do not design around `/runsync`
- Set an appropriate execution timeout on the RunPod endpoint (300-600 seconds)
- Implement progress reporting using RunPod's streaming/webhook capabilities
- Benchmark each pipeline stage independently to understand where time is spent
- Consider pre-downloading the video to a URL the worker can access with low latency (e.g., same-region S3/R2 bucket)

**Detection:** Client receives timeout errors despite the worker still processing. Jobs appear to fail but actually complete — results are lost because nobody polls for them.

**Phase:** Phase 1 (handler design). Architect for async from the beginning.

---

### Pitfall 9: neuralset/neuraltrain Private or Undocumented Dependencies

**What goes wrong:** TRIBE v2's `pyproject.toml` lists `neuralset==0.0.2` and `neuraltrain==0.0.2` as dependencies. These are Meta-internal packages that may not be published on PyPI, may be included in the tribev2 repo itself, or may require special installation. If `pip install` cannot resolve them, the entire installation fails.

**Prevention:**
- Install tribev2 from the git repo (`pip install git+https://github.com/facebookresearch/tribev2.git`) which should include these packages as local dependencies
- If they fail to install, check if they are submodules or subdirectories in the tribev2 repo
- Test `pip install` in a clean Docker container early — do not assume local install success translates to container success
- Pin the tribev2 git commit hash in the Dockerfile for reproducibility

**Detection:** `pip install` fails with "No matching distribution found for neuralset==0.0.2" or similar. Import errors at runtime.

**Phase:** Phase 1 (environment setup). This is one of the first things to verify.

## Minor Pitfalls

### Pitfall 10: Hemodynamic Offset Creates Confusing Timestamps

**What goes wrong:** TRIBE v2 predictions are offset by 5 seconds backward to compensate for hemodynamic lag. This means the prediction at time T=10 actually corresponds to stimuli at T=5. If the handler returns timestamps without accounting for this offset, downstream consumers (the eventual NeuroCut UI) will show activation scores misaligned from the actual video content by 5 seconds.

**Prevention:**
- Apply the 5-second offset correction in the handler before returning results
- Document the offset in the API response schema
- The first 5 seconds of video will have no corresponding predictions — handle this edge case explicitly (return null or zero)

**Phase:** Phase 1 (output mapping). Simple to fix but easy to forget.

---

### Pitfall 11: spaCy Model Not Downloaded in Container

**What goes wrong:** TRIBE v2 depends on spaCy for text processing. spaCy requires downloading a language model (e.g., `en_core_web_sm`) separately from `pip install`. If the Dockerfile does not include `python -m spacy download en_core_web_sm`, text processing fails at runtime.

**Prevention:**
- Add `RUN python -m spacy download en_core_web_sm` (or whichever model TRIBE v2 uses) to the Dockerfile
- Test that `import spacy; spacy.load('en_core_web_sm')` works in the container

**Phase:** Phase 1 (Dockerfile). Quick fix but commonly missed.

---

### Pitfall 12: Not Validating Video Input Before Processing

**What goes wrong:** The handler receives a video URL and downloads it without validation. The URL might point to a non-video file, a corrupted file, an extremely long video, a format TRIBE v2 cannot process, or a URL that requires authentication. Any of these causes the worker to waste GPU time before failing.

**Prevention:**
- Check HTTP headers (Content-Type, Content-Length) before downloading
- Validate video format and duration after download but before inference (use ffprobe)
- Set hard limits: max duration (e.g., 5 minutes), max file size (e.g., 500 MB), allowed formats (MP4, MOV, WebM)
- Return clear error messages for rejected inputs

**Phase:** Phase 1 (handler implementation). Add validation early.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Model exploration | Output format surprise (Pitfall 5) | Run demo notebook first, understand the 20,484-vertex output before designing anything |
| Environment setup | neuralset/neuraltrain resolution (Pitfall 9) | Install from git repo in clean container immediately |
| Dockerfile creation | WhisperX/ffmpeg dependency chain (Pitfall 6) | Install PyTorch+CUDA first, then WhisperX, then tribev2 |
| Dockerfile creation | Image size explosion (Pitfall 2) | Multi-stage build, no plotting extras, slim CUDA base |
| Handler implementation | Disk exhaustion (Pitfall 4) | Cleanup in finally blocks, validate input size |
| Handler implementation | MoviePy memory leaks (Pitfall 7) | Explicit .close(), gc.collect(), consider ffmpeg subprocess |
| Handler design | Sync timeout (Pitfall 8) | Use async /run endpoint from day one |
| RunPod deployment | Gated model auth (Pitfall 1) | HF_TOKEN env var, test in container before deploying |
| RunPod deployment | GPU OOM (Pitfall 3) | Start with A40/A100, profile VRAM, then optimize |
| Output mapping | Hemodynamic offset (Pitfall 10) | Apply 5-second correction in output timestamps |
| Output mapping | Raw voxels vs summary metrics (Pitfall 5) | Design region-of-interest aggregation layer |

## Sources

- [TRIBE v2 GitHub Repository](https://github.com/facebookresearch/tribev2) - Dependencies, demo notebook, output format
- [TRIBE v2 on HuggingFace](https://huggingface.co/facebook/tribev2) - Model loading, gated access
- [Meta AI Blog - TRIBE v2](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/) - Architecture, sub-models
- [RunPod Model Caching Docs](https://docs.runpod.io/serverless/endpoints/model-caching) - Cold start mitigation
- [RunPod Storage Options](https://docs.runpod.io/serverless/storage/overview) - Disk limits
- [RunPod Async Handler Docs](https://docs.runpod.io/serverless/workers/handlers/handler-async) - Timeout handling
- [RunPod OOM Guide](https://www.runpod.io/articles/guides/avoid-oom-crashes-for-large-models) - GPU memory management
- [RunPod Cloud GPU Mistakes](https://www.runpod.io/articles/guides/cloud-gpu-mistakes-to-avoid) - General pitfalls
- [MoviePy Memory Leak Issues](https://github.com/Zulko/moviepy/issues/96) - VideoFileClip memory management
- [V-JEPA2 GitHub](https://github.com/facebookresearch/vjepa2) - Model size (1.2B params)
- [LLaMA 3.2 3B VRAM Requirements](https://apxml.com/models/llama-3-2-3b) - ~3.4 GB inference
- [WhisperX Docker Issues](https://deepwiki.com/m-bain/whisperX/2-installation-and-setup) - CUDA dependency chain
