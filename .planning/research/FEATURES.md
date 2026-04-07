# Feature Landscape

**Domain:** RunPod serverless ML inference worker for video-processing (TRIBE v2 brain activation prediction)
**Researched:** 2026-04-07

## Table Stakes

Features users expect. Missing = worker won't function reliably in production.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Handler function with model pre-loading** | RunPod pattern: model loaded globally outside handler, not per-request. Without this, every job re-loads the model (minutes of waste on GPU). | Low | Load TRIBE v2 model + tokenizer at module level, before `runpod.serverless.start()`. Standard RunPod pattern. |
| **Input validation** | Reject bad payloads early before burning GPU time. Must validate: video URL present, URL format valid, optional parameters have correct types. | Low | Use manual validation (check required keys, return `{"error": "..."}` dict). RunPod has a `rp_validator` utility but manual is simpler for this scope. |
| **Video download from URL** | Worker receives a URL (not raw video bytes -- 10MB payload limit enforces this). Must download video to temp storage before inference. | Low | Use `requests` or `httpx` to download. Validate content-type, enforce max file size (e.g., 500MB). Clean up temp files after processing. |
| **Structured JSON output** | Callers need predictable output schema: per-segment scores with timestamps. Both raw TRIBE v2 output and mapped NeuroCut schema (2-second windows with activation, arousal, valence, region breakdown). | Medium | Define output schema contract. Return both `raw_output` and `mapped_output` in response. |
| **Error handling with structured error responses** | Unhandled exceptions mark jobs as FAILED with opaque messages. Wrap handler in try/except, return `{"error": "message", "error_type": "validation|download|inference|unknown"}` for graceful failures. | Low | RunPod SDK auto-captures unhandled exceptions, but structured errors give callers actionable info. |
| **Execution timeout configuration** | Video inference can take minutes. Default RunPod timeout is 600s (10 min). Must configure appropriate timeout for 60-second video inference. | Low | Set via RunPod endpoint config. Range: 5s to 7 days. Set to ~15 min initially, adjust after benchmarking. |
| **Temp file cleanup** | Downloaded videos and intermediate files (extracted frames, audio) consume disk. Serverless workers have limited storage. Must clean up after every job. | Low | Use `try/finally` or `tempfile.TemporaryDirectory()` context manager. Critical -- disk fills up across jobs if workers aren't refreshed. |
| **Container with CUDA + FFmpeg** | TRIBE v2 requires CUDA GPU. Video processing likely needs FFmpeg for frame/audio extraction. Both must be in the Docker image. | Medium | Base: `runpod/base` (includes CUDA, Python, uv) or `nvidia/cuda`. Install FFmpeg via apt. Install torch, torchaudio, transformers, tribev2, runpod SDK. |
| **Logging** | Must log job ID, processing stages, timing, errors. RunPod collects stdout and surfaces it in dashboard. Logs retained 90 days. | Low | Use Python `logging` module with structured format. Include job ID in every log line. Log timing for each stage (download, preprocess, inference, postprocess). |

## Differentiators

Features that improve production quality. Not required for a working worker, but significantly improve reliability, debuggability, and cost efficiency.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Progress updates** | Video inference is slow (potentially minutes). Callers polling `/status` see "IN_PROGRESS" but no detail. `runpod.serverless.progress_update(job, msg)` sends stage updates: "downloading video", "extracting frames", "running inference (segment 5/30)". | Low | One-liner per stage. Visible when polling job status. Excellent for debugging and UX. |
| **Stage-level timing in response** | Return `timing: {download_ms, preprocess_ms, inference_ms, postprocess_ms, total_ms}` in output. Critical for benchmarking and optimizing the pipeline. | Low | Wrap each stage with `time.perf_counter()`. Essential for answering the project's key question: "how long does inference take?" |
| **Video duration validation** | Reject videos that are too long (e.g., >5 min) before downloading/processing. Prevents abuse and runaway GPU costs. Can check via HEAD request content-length or post-download FFprobe. | Low | Post-download check with FFprobe is more reliable than content-length guessing. Return error with actual duration and max allowed. |
| **Cold start optimization via model baking** | Bake model weights into the Docker image rather than downloading at startup. Increases image size (10GB+) but eliminates cold-start model download (which can take minutes). | Medium | Trade-off: larger image = slightly slower container pull, but RunPod caches images. Net win for cold start. Alternative: use RunPod network volume for model cache. |
| **Worker refresh after job** | Return `{"refresh_worker": True, "job_results": results}` to clear worker state between jobs. Prevents memory leaks from accumulating torch tensors across jobs. | Low | One-line addition to return. Use if memory profiling shows leaks. Cost: slightly slower next job (re-init, but not re-pull). |
| **Health/readiness signal** | Log a clear "READY" message after model loads so RunPod knows the worker is initialized. Helps distinguish cold-start init time from actual job processing time. | Low | Single log line after model load completes. RunPod uses worker status (init -> ready -> idle) automatically, but explicit logging aids debugging. |
| **Configurable inference parameters** | Allow callers to pass optional parameters: `segment_duration` (default 2s), `output_format` (raw/mapped/both), `include_region_breakdown` (bool). Makes the worker flexible without separate endpoints. | Medium | Define defaults in schema. Validate parameter ranges. Don't over-engineer -- start with 2-3 optional params max. |
| **Retry logic for video download** | Network issues can cause download failures. Retry with exponential backoff (2-3 attempts) before failing the job. | Low | Use `tenacity` or manual retry loop. Only retry on transient errors (timeouts, 5xx), not on 4xx. |

## Anti-Features

Features to explicitly NOT build at this stage.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Video upload to worker** | RunPod has 10/20MB payload limits. Video files easily exceed this. Building upload handling adds complexity for no gain. | Accept video URL only. Caller uploads to R2/S3 first, passes presigned URL to worker. This is the documented RunPod pattern. |
| **Result storage in cloud** | Tempting to have the worker upload results to S3/R2. Adds IAM credentials management, cloud SDK deps, failure modes. | Return JSON directly in response (scores are small, well under 10MB). Let the caller handle storage. |
| **Multiple video comparison (A/B)** | Explicitly out of scope per PROJECT.md. Adds complexity to handler, input schema, and output schema. | Single video per job. A/B comparison is caller-side: submit two jobs, compare results. |
| **Authentication/authorization** | Worker runs behind RunPod's API. RunPod handles auth via API keys. Adding auth inside the worker is redundant. | Rely on RunPod's built-in API key auth for the endpoint. |
| **Async/streaming handler** | TRIBE v2 inference is batch-style (process whole video, return scores). No intermediate results to stream. Async adds complexity for no benefit here. | Use standard synchronous handler. Progress updates provide sufficient feedback. |
| **Concurrent handler** | Video inference is GPU-bound and memory-intensive. Running multiple jobs concurrently on one GPU risks OOM. | One job per worker. Scale horizontally via RunPod's auto-scaling (configure max workers). |
| **Custom dashboard/monitoring** | RunPod provides built-in monitoring dashboard with GPU utilization, memory, execution times, P70/P90/P98 percentiles. | Use RunPod's native monitoring. Export logs to external service only if retention >90 days is needed. |
| **Model versioning/A-B testing** | Only one model (TRIBE v2) exists. No variants to test. | Hardcode model. Revisit if Meta releases TRIBE v3 or alternative models. |
| **Webhook callbacks** | RunPod supports webhooks natively (caller passes `webhook` URL in payload). No worker-side code needed. | Document that callers can use RunPod's built-in webhook support. Zero worker-side implementation. |

## Feature Dependencies

```
Container (CUDA + FFmpeg) --> Model Pre-loading --> Handler Function
                                                       |
                                                       v
                                            Input Validation
                                                       |
                                                       v
                                            Video Download (from URL)
                                                       |
                                                       v
                                            Video Preprocessing (FFmpeg/torchaudio)
                                                       |
                                                       v
                                            TRIBE v2 Inference
                                                       |
                                                       v
                                            Output Mapping (raw -> NeuroCut schema)
                                                       |
                                                       v
                                            Structured JSON Response + Timing
                                                       |
                                                       v
                                            Temp File Cleanup
```

Cross-cutting (apply to all stages):
- Error handling wraps the entire pipeline
- Logging happens at every stage
- Progress updates happen between stages

## MVP Recommendation

**Prioritize (Phase 1 -- make it work):**
1. Container with CUDA + FFmpeg + dependencies (prerequisite for everything)
2. Model pre-loading at module level (prerequisite for handler)
3. Handler with input validation and structured error responses
4. Video download from URL with basic retry
5. TRIBE v2 inference pipeline (the core value)
6. Structured JSON output (both raw + mapped)
7. Temp file cleanup
8. Logging with job ID and stage timing

**Add immediately after working (Phase 1.5 -- make it production-ready):**
1. Progress updates (trivial to add, high debugging value)
2. Stage-level timing in response (critical for benchmarking)
3. Video duration validation (cost protection)
4. Execution timeout configuration (safety net)

**Defer (Phase 2+):**
- Cold start optimization via model baking (optimize after baseline works)
- Worker refresh (add if memory issues observed)
- Configurable inference parameters (add when callers need flexibility)

## Sources

- [RunPod Handler Functions Documentation](https://docs.runpod.io/serverless/workers/handler-functions)
- [RunPod Error Handling](https://docs.runpod.io/serverless/workers/handlers/handler-error-handling)
- [RunPod Endpoint Configurations (timeout, TTL)](https://docs.runpod.io/serverless/endpoints/endpoint-configurations)
- [RunPod Worker Template](https://github.com/runpod-workers/worker-template)
- [RunPod Cold Start / Model Caching](https://www.runpod.io/blog/reduce-automatic1111-start-time)
- [RunPod Payload Size Limits Discussion](https://www.answeroverflow.com/m/1199970565381967982)
- [RunPod Monitoring and Logging](https://docs.runpod.io/serverless/development/logs)
- [RunPod FFmpeg Worker Example](https://github.com/Csaba8472/runpod-ffmpeg)
- [RunPod Concurrent Handlers](https://docs.runpod.io/serverless/workers/handlers/handler-concurrency)
