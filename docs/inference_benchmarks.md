# TRIBE v2 Inference Benchmarks

**Purpose:** Formal documentation of inference timing for downstream phases. These benchmarks inform timeout configuration, async endpoint design, user-facing "processing" time estimates, and cost projections for the NeuroCut pipeline.

**GPU:** NVIDIA A40 (48 GB VRAM)
**Model:** TRIBE v2 (facebookresearch/tribev2)
**Data Sources:** `docs/inference_output.json` (Phase 1), `data/validation_comparison.json` (Phase 3)

## Benchmark Results

| Metric | Sintel (Phase 1) | Sintel (Phase 3) | BBB Opening (Phase 3) |
|--------|-------------------|-------------------|------------------------|
| Model load | 2.21s | 2.27s | 2.27s |
| Events extraction | 77.16s | 78.12s | 51.25s |
| Inference | 679.62s | 699.50s | 593.64s |
| **Total** | **758.99s** | **777.62s** | **644.88s** |
| Segments produced | 61 | 60 | 61 |
| Aligned segments | -- | 55 | 56 |

### Observations

- **Phase 1 vs Phase 3 consistency:** Sintel trailer timing is consistent across runs (759s vs 778s, ~2.5% variance). The slight increase in Phase 3 may reflect different system load or minor environment differences. This variance is within acceptable bounds.
- **Content affects timing:** Big Buck Bunny (644.9s) is ~17% faster than Sintel (777.6s). This likely reflects simpler visual content requiring less V-JEPA2 encoding effort, and possibly shorter audio (no dialogue to transcribe).
- **Model load is stable:** 2.2s across all runs. Loading once at container startup is effective.

## GPU Specifications

| Property | Value |
|----------|-------|
| GPU | NVIDIA A40 |
| VRAM Total | 48 GB |
| VRAM Peak (Phase 1) | 11.16 GB allocated / 13.63 GB reserved |
| VRAM Peak (Phase 3) | 10.88 GB |
| VRAM Headroom | ~35-37 GB unused |
| Architecture | Ampere |

## Key Findings for Downstream Phases

### 1. Async endpoint required

Inference takes 10-13 minutes per 60-second video. RunPod's `/runsync` endpoint has a 90-second timeout. The NeuroCut worker **must** use the `/run` (async) endpoint with status polling via `/status/{job_id}`.

### 2. Timeout recommendation

Set the RunPod execution timeout to **20 minutes** (1200 seconds). This provides headroom for:
- Longer videos (up to ~90 seconds)
- Cold start model loading (2.2s -- negligible if pre-loaded)
- Network variability in video download
- Occasional V-JEPA2 encoding variance

### 3. Cost per inference

| GPU | $/hr | 60s Video Cost | 60s Video Time |
|-----|------|----------------|----------------|
| A40 | $0.35 | ~$0.06-0.08 | ~11-13 min |
| A30 (24GB) | $0.26 | ~$0.05-0.06 | ~11-13 min (estimated) |
| RTX 4090 (24GB) | $0.44 | ~$0.08-0.10 | ~11-13 min (estimated) |
| A100 80GB | $2.17 | ~$0.43-0.47 | ~11-13 min (estimated) |

**A40 at $0.35/hr yields approximately $0.07 per 60-second video.** This is cost-effective for a per-analysis pricing model.

### 4. Model load is fast

At 2.2 seconds, model loading is negligible. Loading the model once at container startup (global scope in the RunPod handler) eliminates per-request overhead. Cold starts only add ~2 seconds.

### 5. Video encoding dominates

V-JEPA2 video encoding accounts for the bulk of inference time (~10-11 minutes of the ~12 minute total). Events extraction (audio extraction + WhisperX) takes ~1 minute. The prediction head itself is fast. Optimization efforts should focus on V-JEPA2 encoding if faster inference is needed.

### 6. VRAM allows cheaper GPU

Peak VRAM usage is 10.9-11.2 GB. This means GPUs with 24 GB VRAM (A30, RTX 4090) should have sufficient headroom. Testing on a 24 GB GPU is recommended before production to confirm no OOM issues under load. The A40's 48 GB is more capacity than needed for single-video inference.

## Scaling Estimates

Based on measured data (Sintel = 778s, BBB = 645s for 60s videos):

| Video Duration | Estimated Time | Estimated Cost (A40) | Notes |
|---------------|----------------|----------------------|-------|
| 30s | ~5-7 min | ~$0.03-0.04 | Roughly linear with duration |
| 60s | 11-13 min (measured) | ~$0.06-0.08 | Actual benchmark data |
| 90s | ~16-19 min | ~$0.09-0.11 | Within 20-min timeout |
| 120s | ~22-26 min | ~$0.13-0.15 | Exceeds 20-min timeout -- needs 30-min |
| 180s | ~33-39 min | ~$0.19-0.23 | Impractical for serverless |

**Maximum practical video length:** ~90 seconds with a 20-minute timeout. Videos beyond 120 seconds risk timeout failures and should either be split into segments or processed with extended timeouts.

**Note:** Scaling is estimated as roughly linear with video duration based on V-JEPA2's frame-by-frame encoding. Actual scaling may be sub-linear (fixed overhead amortized) or super-linear (memory pressure on longer videos). Production testing with varied durations is needed.

## Pipeline Stage Breakdown

| Stage | Phase 1 Time | % of Total | Notes |
|-------|-------------|------------|-------|
| Model loading | 2.2s | 0.3% | One-time at container start |
| Audio extraction | ~5s | 0.7% | moviepy wav extraction |
| WhisperX transcription | ~15s | 2.0% | Skipped if no speech detected |
| Audio encoding (Wav2Vec-BERT) | ~55s | 7.3% | 2.32 GB model |
| Video encoding (V-JEPA2) | ~660s | 87.0% | 4.14 GB model, dominant cost |
| Prediction head | ~20s | 2.6% | TRIBE v2 transformer |
| **Total** | **759s** | **100%** | |

*Note: Stage-level breakdown is approximate, derived from the events_extract vs inference split in the timing data. V-JEPA2 encoding time is estimated as the majority of the "inference" stage.*

## Recommendations Summary

| Topic | Recommendation | Rationale |
|-------|---------------|-----------|
| Endpoint type | Async (`/run` + polling) | 12+ min inference exceeds sync timeout |
| Execution timeout | 20 minutes | Covers 60-90s videos with headroom |
| Target GPU | A40 (validation) / A30 (production candidate) | 11 GB VRAM peak; A30 saves ~25% cost |
| Max video length | 90 seconds (default) | Beyond 120s risks timeout |
| Model loading | Global scope (once per container) | 2.2s load, no per-request penalty |
| User-facing estimate | "Results in 10-15 minutes" | Sets expectations for async processing |
