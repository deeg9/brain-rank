# TRIBE v2 Output Format Documentation

**Validated:** 2026-04-08 on NVIDIA A40 (48GB) via RunPod GPU Pod
**Video:** Sintel trailer, 60 seconds, 1280x544, 24fps, h264+ac3

## Raw Output

TRIBE v2's `model.predict()` returns a **numpy ndarray** of shape `(n_segments, 20484)`.

| Property | Value |
|----------|-------|
| **Type** | numpy.ndarray (float32) |
| **Shape** | (61, 20484) for a 60-second video |
| **Segments** | 1 per second of video (61 segments for 60.08s video) |
| **Vertices** | 20,484 cortical vertices (fsaverage5 surface mesh) |
| **Value range** | -1.48 to 1.80 (centered near 0, std ~0.23) |
| **Hemodynamic delay** | ~5 seconds (fMRI convention — brain response lags stimulus) |

### Segment Structure

Each segment is a `Segment` namedtuple:
```python
Segment(start=0.0, duration=1.0, timeline='default', _trigger_idx=2)
```

- `start`: timestamp in seconds (0.0, 1.0, 2.0, ...)
- `duration`: always 1.0 second
- `timeline`: always 'default'
- `_trigger_idx`: internal index

### Events DataFrame

Before inference, TRIBE v2 extracts events from the video:

| Column | Description |
|--------|-------------|
| type | 'Audio' or 'Video' |
| start | Start time (0.0) |
| duration | Video duration in seconds |
| filepath | Path to extracted audio (.wav) or video (.mp4) |
| frequency | Sample rate (44100 for audio, 24 for video fps) |

**Note:** Text/transcript events are optional. If WhisperX finds no speech, the text extractor is skipped (`"Removing extractor text as there are no corresponding events"`).

## Model Pipeline Stages

1. **Audio extraction** — moviepy extracts .wav from video
2. **WhisperX transcription** — attempts speech-to-text (skipped if no speech found)
3. **Audio encoding** — Wav2Vec-BERT 2.0 encodes audio (2.32GB model, ~5s download)
4. **Video encoding** — V-JEPA2 encodes video frames (4.14GB model, ~5s download). Produces tensor of shape (120, 20, 1408) for 60s video at 24fps. This is the slowest step (~11 minutes).
5. **Prediction** — TRIBE v2 transformer predicts cortical activation from encoded features

## Performance (NVIDIA A40, 60s video)

| Stage | Time |
|-------|------|
| Model loading | 2.2s |
| Events extraction (audio + WhisperX) | 77.2s |
| Inference (encoding + prediction) | 679.6s |
| **Total** | **759.0s (~12.7 min)** |

| Resource | Value |
|----------|-------|
| Peak VRAM allocated | 11.16 GB |
| Peak VRAM reserved | 13.63 GB |
| GPU | NVIDIA A40 (48 GB) |

## Key Findings for NeuroCut

1. **Output is raw cortical vertices, not engagement scores.** The 20,484 values per segment are predicted fMRI activations across the brain surface, not pre-computed metrics like "attention" or "arousal." Phase 2 must map these vertices to named brain regions.

2. **1-second resolution, not 2-second.** The architecture doc assumed 2-second windows, but TRIBE v2 produces 1-second segments. The NeuroCut schema can aggregate to 2-second windows by averaging pairs.

3. **Inference is slow (~12 min for 60s video).** This means the product MUST use async processing (/run endpoint, not /runsync which has a 90s timeout). Users will need a "processing" screen.

4. **VRAM is modest (11 GB).** An A40 (48GB) has 4x headroom. Could potentially use a cheaper GPU (A30 24GB or even RTX 4090 24GB) to reduce costs.

5. **WhisperX is a runtime dependency** but gracefully handles videos without speech. The text extractor is simply skipped.

6. **61 segments from 60s video** — the model predicts for 61 of 100 possible segments (61% kept). The filtering is internal to TRIBE v2.

## Raw JSON Output

See `docs/inference_output.json` for machine-readable results from this validation run.
