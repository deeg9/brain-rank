# Architecture Patterns

**Domain:** Containerized ML inference pipeline (video-to-brain-activation scores)
**Researched:** 2026-04-07

## Recommended Architecture

The system is a single RunPod serverless worker container that accepts a video URL, runs TRIBE v2 inference, and returns JSON activation scores. There is no orchestration layer, no queue management, and no persistent storage within this milestone -- RunPod handles all of that.

```
Client (HTTP POST)
  |
  v
RunPod Serverless Endpoint
  |
  v
+--------------------------------------------------+
|  Worker Container                                |
|                                                  |
|  [Module-level initialization]                   |
|    - Load TribeModel from HuggingFace cache      |
|    - Warm up GPU (dummy forward pass)            |
|                                                  |
|  handler(job) -->                                |
|    1. Validate input (video_url required)        |
|    2. Download video to /tmp                     |
|    3. model.get_events_dataframe(video_path)     |
|       - Extracts video frames (V-JEPA2)          |
|       - Extracts audio (Wav2Vec-BERT 2.0)        |
|       - Transcribes speech via WhisperX (LLaMA)  |
|       - Builds events DataFrame                  |
|    4. model.predict(events=df)                   |
|       - Returns (n_timesteps, 20484) ndarray     |
|    5. Post-process: map cortical vertices to     |
|       NeuroCut schema (segment scores)           |
|    6. Return JSON response                       |
|    7. Cleanup /tmp files                         |
+--------------------------------------------------+
  |
  v
Client receives JSON scores
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **handler.py** | RunPod entry point. Validates input, orchestrates pipeline, returns response. | All components below |
| **model_loader.py** | Module-level singleton. Loads TribeModel once at container start, holds reference. | handler.py (provides model instance) |
| **video_fetcher.py** | Downloads video from URL to local /tmp path. Handles timeouts, retries, validation (file size, format). | handler.py (returns local path) |
| **inference.py** | Wraps `get_events_dataframe()` and `predict()`. Isolates TRIBE v2 API surface. | model_loader.py (uses model), handler.py (returns raw predictions) |
| **postprocessor.py** | Maps raw cortical vertex predictions (20,484 vertices) to NeuroCut schema: 2-second windows with activation, arousal, valence, region breakdown, and summary stats. | handler.py (returns formatted JSON) |
| **schema.py** | Pydantic models for input validation and output serialization. Defines the contract. | All components |

### Data Flow

```
video_url (string)
  |
  v
[video_fetcher] --> /tmp/video_{job_id}.mp4
  |
  v
[inference: get_events_dataframe] --> pandas DataFrame
  |                                   (type, start, duration, filepath, text, context)
  v
[inference: predict] --> numpy array (n_timesteps, 20484)
  |                      + segments metadata
  v
[postprocessor] --> NeuroCut JSON schema
  |                 - segments[]: {start, end, activation_score, arousal, valence, regions{}}
  |                 - summary: {overall, hook_score, retention_score, peak_second, peak_score}
  v
handler returns dict --> RunPod serializes to JSON response
```

## Component Details

### 1. handler.py -- RunPod Entry Point

The handler follows RunPod's required pattern exactly:

```python
import runpod
from model_loader import get_model
from video_fetcher import download_video
from inference import run_inference
from postprocessor import format_output
from schema import InputSchema, OutputSchema

# Model loads ONCE at module level (container startup)
model = get_model()

def handler(job):
    """RunPod serverless handler. Called once per job."""
    job_input = job["input"]

    # 1. Validate
    try:
        params = InputSchema(**job_input)
    except Exception as e:
        return {"error": f"Invalid input: {str(e)}"}

    # 2. Download video
    runpod.serverless.progress_update(job, "Downloading video...")
    video_path = download_video(params.video_url, job["id"])

    # 3. Run inference
    runpod.serverless.progress_update(job, "Running brain activation analysis...")
    raw_preds, segments = run_inference(model, video_path)

    # 4. Post-process
    runpod.serverless.progress_update(job, "Generating results...")
    result = format_output(raw_preds, segments, params.video_url)

    # 5. Cleanup
    video_path.unlink(missing_ok=True)

    return result

runpod.serverless.start({"handler": handler})
```

**Key pattern**: `runpod.serverless.start()` is the last line of the file. The handler receives `job` (dict with `id` and `input` keys), returns a dict or raises an exception (auto-marked FAILED by RunPod).

### 2. model_loader.py -- Singleton Model Loading

```python
from tribev2 import TribeModel
from pathlib import Path
import torch

CACHE_DIR = Path("/models/tribev2")  # Baked into Docker image

_model = None

def get_model():
    global _model
    if _model is None:
        _model = TribeModel.from_pretrained(
            "facebook/tribev2",
            cache_folder=CACHE_DIR,
        )
        # Warm up: dummy forward pass to initialize CUDA kernels
        # (reduces first-job latency)
    return _model
```

**Critical decision**: Model weights must be baked into the Docker image at `/models/tribev2/`, not downloaded at runtime. TRIBE v2 is ~1 GB for the fusion model, but the backbone extractors (LLaMA 3.2-3B, V-JEPA2, Wav2Vec-BERT 2.0) are loaded separately and may total 10-15 GB. Downloading at cold start would add minutes.

### 3. video_fetcher.py -- Video Download

```python
from pathlib import Path
import requests

DOWNLOAD_DIR = Path("/tmp")
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB
DOWNLOAD_TIMEOUT = 120  # seconds

def download_video(url: str, job_id: str) -> Path:
    output_path = DOWNLOAD_DIR / f"video_{job_id}.mp4"
    response = requests.get(url, stream=True, timeout=DOWNLOAD_TIMEOUT)
    response.raise_for_status()

    content_length = int(response.headers.get("content-length", 0))
    if content_length > MAX_VIDEO_SIZE:
        raise ValueError(f"Video too large: {content_length} bytes")

    with open(output_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    return output_path
```

### 4. inference.py -- TRIBE v2 Wrapper

```python
import numpy as np

def run_inference(model, video_path):
    """Run TRIBE v2 inference. Returns (predictions, segments)."""
    df = model.get_events_dataframe(video_path=str(video_path))
    preds, segments = model.predict(events=df)
    return preds, segments  # preds shape: (n_timesteps, 20484)
```

This is intentionally thin. The complexity lives in TRIBE v2 internally (feature extraction with three backbone models, transformer fusion, cortical projection). Wrapping it isolates our code from TRIBE v2's internal API changes.

### 5. postprocessor.py -- Cortical Vertices to NeuroCut Schema

This is the most uncertain component. TRIBE v2 outputs raw fMRI predictions across 20,484 cortical vertices per timestep. The NeuroCut schema expects:
- activation_score (0-100)
- arousal (0-100)
- valence (-1 to 1)
- region breakdown: attention, reward, emotional_processing, social_cognition

**Mapping strategy** (needs validation in Phase 1):

```python
import numpy as np

# fsaverage5 vertex-to-region mapping (approximate ROI indices)
# These must be derived from neuroanatomical atlases (Destrieux, Desikan-Killiany)
REGION_MASKS = {
    "attention": [...],           # Frontal eye fields, IPS, TPJ vertices
    "reward": [...],              # Ventral striatum-adjacent, vmPFC vertices
    "emotional_processing": [...], # Amygdala-adjacent, insula vertices
    "social_cognition": [...],     # mPFC, TPJ, STS vertices
}

def format_output(preds, segments, video_url):
    n_timesteps = preds.shape[0]
    window_size = 2  # seconds

    formatted_segments = []
    for t in range(0, n_timesteps, window_size):
        window = preds[t:t+window_size].mean(axis=0)  # Average across window

        # Overall activation: mean across all vertices, normalized to 0-100
        activation = normalize_to_score(window.mean())

        # Region scores: mean of vertices in each ROI
        regions = {
            name: normalize_to_score(window[mask].mean())
            for name, mask in REGION_MASKS.items()
        }

        formatted_segments.append({
            "start": t,
            "end": min(t + window_size, n_timesteps),
            "activation_score": activation,
            "arousal": regions["attention"],  # Proxy mapping
            "valence": normalize_to_valence(window),
            "regions": regions,
        })

    return {
        "video_url": video_url,
        "duration_seconds": n_timesteps,
        "segments": formatted_segments,
        "summary": compute_summary(formatted_segments),
        "raw_shape": list(preds.shape),
    }
```

**Important**: The mapping from cortical vertices to "attention", "reward", etc. is a neuroscience question, not an engineering one. Phase 1 must output both the raw predictions AND the mapped version so the mapping can be validated and refined.

### 6. schema.py -- Input/Output Contract

```python
from pydantic import BaseModel, HttpUrl
from typing import List, Dict, Optional

class InputSchema(BaseModel):
    video_url: str  # URL to download video from (R2 presigned URL in production)
    include_raw: bool = False  # Whether to include raw vertex data in response

class RegionScores(BaseModel):
    attention: float
    reward: float
    emotional_processing: float
    social_cognition: float

class Segment(BaseModel):
    start: int
    end: int
    activation_score: float
    arousal: float
    valence: float
    regions: RegionScores

class Summary(BaseModel):
    overall: float
    hook_score: float  # Average of first 3 segments (0-6 seconds)
    retention_score: float  # Trend of activation over time
    peak_second: int
    peak_score: float

class OutputSchema(BaseModel):
    video_url: str
    duration_seconds: int
    segments: List[Segment]
    summary: Summary
    raw_shape: List[int]  # For debugging: (n_timesteps, n_vertices)
```

## Docker Architecture

```dockerfile
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# System deps
RUN apt-get update && apt-get install -y \
    python3.11 python3.11-pip python3.11-venv \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download and bake model weights into image
RUN python3.11 -c "
from tribev2 import TribeModel
TribeModel.from_pretrained('facebook/tribev2', cache_folder='/models/tribev2')
"
# This also downloads backbone models (LLaMA 3.2-3B, V-JEPA2, Wav2Vec-BERT 2.0)
# WARNING: This makes the Docker image 15-20GB+ but eliminates cold-start downloads

# App code
COPY src/ /app/
WORKDIR /app

CMD ["python3.11", "handler.py"]
```

**requirements.txt:**
```
runpod>=1.7.0
torch>=2.0
tribev2
whisperx
pydantic>=2.0
requests
numpy
```

**Container size warning**: With CUDA runtime + PyTorch + three backbone models + TRIBE v2 fusion model, expect 15-25 GB. This is normal for ML inference containers but affects:
- Docker build time (~15-30 min)
- Registry push/pull time
- RunPod cold start time (first pull to worker node)

## Patterns to Follow

### Pattern 1: Module-Level Model Loading
**What:** Load the model at import time (module scope), not inside the handler.
**When:** Always for RunPod serverless workers.
**Why:** RunPod reuses the same container for multiple jobs. Loading the model once means job 2+ start instantly. Loading inside the handler means re-loading a 15 GB model on every single request.

### Pattern 2: Progress Updates for Long Jobs
**What:** Call `runpod.serverless.progress_update(job, message)` at each pipeline stage.
**When:** Any job that takes more than a few seconds.
**Why:** Video download + inference for a 60-second video may take 30-120 seconds. Without progress updates, the client has no visibility into whether the job is stuck or working.

### Pattern 3: Return Raw + Mapped Output in Phase 1
**What:** Include both the post-processed NeuroCut schema AND the raw prediction shape/metadata.
**When:** During validation (Phase 1).
**Why:** The cortical-vertex-to-brain-region mapping is a hypothesis. Returning raw data lets you validate whether the mapping produces meaningful scores without redeploying the container.

### Pattern 4: Defensive Video Download
**What:** Validate file size before download completes. Set hard timeouts. Clean up /tmp after every job.
**When:** Always.
**Why:** RunPod workers have limited disk. A malicious or oversized video URL could fill /tmp and crash the worker, affecting subsequent jobs on the same container.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Downloading Models at Runtime
**What:** Calling `from_pretrained()` with a remote source inside the handler or at container startup without pre-cached weights.
**Why bad:** TRIBE v2 + backbones = 10-15 GB. At container startup on a cold worker, this adds 2-10 minutes before the first job can run. On RunPod serverless, this means the client waits 2-10 minutes just for cold start, plus inference time.
**Instead:** Bake all model weights into the Docker image during build. Accept the large image size.

### Anti-Pattern 2: Processing Multiple Videos in One Handler Call
**What:** Accepting two video URLs and processing both in the same job.
**Why bad:** Doubles memory usage, doubles failure blast radius, prevents RunPod from parallelizing across workers. If video B fails, video A's results are also lost.
**Instead:** One video per job. The orchestration layer (Supabase Edge Function, built in Phase 2) dispatches two jobs and correlates results.

### Anti-Pattern 3: Storing State Between Jobs
**What:** Caching video files or results between handler invocations.
**Why bad:** RunPod may recycle workers unpredictably. Files in /tmp may or may not persist. Relying on inter-job state creates intermittent bugs.
**Instead:** Each job is fully self-contained. Download, process, return, cleanup.

### Anti-Pattern 4: Returning Raw Vertex Arrays in Production
**What:** Sending 20,484 floats per timestep back to the client.
**Why bad:** For a 60-second video (60 timesteps), that is 1.2 million floats per response. Serialization is slow, network transfer is slow, and the client cannot use vertex-level data.
**Instead:** Return the mapped NeuroCut schema (a few hundred bytes per segment). Keep a `include_raw` debug flag for Phase 1 validation only.

## Scalability Considerations

| Concern | At 10 jobs/day (Phase 1) | At 1K jobs/day | At 10K jobs/day |
|---------|--------------------------|----------------|-----------------|
| Cold starts | Acceptable (few minutes) | Set 1-2 active workers | Set 5+ active workers, use FlashBoot |
| GPU cost | ~$0.50-2/day (pay-per-job) | ~$50-200/day | Evaluate dedicated GPU vs serverless breakeven |
| Container registry | Any registry works | Use RunPod's recommended registry | Consider multi-region registry |
| Inference time | Must measure in Phase 1 | Optimize if >60s per video | Consider model quantization or smaller backbones |
| Video download | Direct URL fetch fine | Add CDN/caching layer | R2 presigned URLs with edge locations |

## Build Order (Dependencies Between Components)

```
Phase 1a: Local Validation (no RunPod yet)
  1. Clone tribev2, install locally, run tribe_demo.ipynb
  2. inference.py -- wrap get_events_dataframe + predict
  3. postprocessor.py -- map vertices to NeuroCut schema
  4. Validate: does the output make intuitive sense?

Phase 1b: Containerization
  5. schema.py -- define input/output contract
  6. video_fetcher.py -- download from URL
  7. model_loader.py -- singleton loading pattern
  8. handler.py -- wire everything together
  9. Dockerfile -- build with baked weights
  10. test_input.json -- local testing with runpod SDK

Phase 1c: Deployment
  11. Push image to Docker Hub / RunPod registry
  12. Create RunPod serverless endpoint
  13. End-to-end test: POST video URL, receive JSON
  14. Measure inference time, document cold start
```

**Critical path**: Steps 1-4 block everything. If TRIBE v2 does not produce meaningful per-segment differentiation on test videos, the entire product hypothesis is invalid. Do not containerize until local validation passes.

## Key Unknowns (Must Resolve in Phase 1)

1. **TRIBE v2 output interpretation**: The model outputs cortical vertex activations, not "attention" or "arousal" scores. The mapping from 20,484 vertices to 4-5 named brain regions is a neuroscience question. This mapping must be validated against known stimuli (high-engagement vs. low-engagement videos).

2. **Inference time**: No published benchmarks for TRIBE v2 inference. The model runs three large backbone extractors (LLaMA 3.2-3B, V-JEPA2, Wav2Vec-BERT 2.0) sequentially. Expect 30-120 seconds per 60-second video on an A100, but this is an estimate.

3. **WhisperX dependency**: TRIBE v2 uses WhisperX internally for speech transcription. WhisperX requires its own model weights and CUDA. This adds to container size and may have version conflicts with TRIBE v2's torch requirements.

4. **GPU memory**: Three backbone models + fusion transformer, all loaded simultaneously. Likely requires 16-24 GB VRAM minimum. A100 (40/80 GB) is safe. A40 (48 GB) should work. Lower-end GPUs (T4 at 16 GB) may not fit.

5. **Temporal resolution**: TRIBE v2 outputs one prediction per second with a 5-second hemodynamic delay offset. The NeuroCut schema expects 2-second windows. The postprocessor must handle this alignment correctly.

## Sources

- [RunPod Handler Functions Documentation](https://docs.runpod.io/serverless/workers/handler-functions) -- HIGH confidence
- [RunPod Worker Template](https://github.com/runpod-workers/worker-template) -- HIGH confidence
- [RunPod Optimization Guide](https://docs.runpod.io/serverless/development/optimization) -- HIGH confidence
- [RunPod Model Caching](https://docs.runpod.io/serverless/endpoints/model-caching) -- HIGH confidence
- [TRIBE v2 GitHub Repository](https://github.com/facebookresearch/tribev2) -- HIGH confidence
- [TRIBE v2 Demo Notebook](https://github.com/facebookresearch/tribev2/blob/main/tribe_demo.ipynb) -- HIGH confidence
- [TRIBE v2 on HuggingFace](https://huggingface.co/facebook/tribev2) -- HIGH confidence
- [Meta AI Blog: TRIBE v2 Announcement](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/) -- HIGH confidence
- [RunPod Serverless Scaling Blog](https://www.runpod.io/blog/serverless-scaling-strategy-runpod) -- MEDIUM confidence
