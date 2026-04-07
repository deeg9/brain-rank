# Technology Stack

**Project:** NeuroCut -- TRIBE v2 RunPod Serverless Inference Pipeline
**Researched:** 2026-04-07

## Recommended Stack

### Container Base Image

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| nvidia/cuda | 12.4.1-cudnn-runtime-ubuntu22.04 | Docker base image | TRIBE v2 pins torch>=2.5.1,<2.7. PyTorch 2.6.x ships stable wheels for CUDA 12.4. Use `runtime` not `devel` -- no compilation needed, saves ~3GB image size. Ubuntu 22.04 is the LTS that all NVIDIA images target. |
| Python | 3.11 | Runtime | TRIBE v2 requires Python 3.11+. Do NOT use 3.12+ -- some ML dependencies (spacy, julius) may have wheel gaps on 3.12. |

**Confidence:** HIGH -- TRIBE v2's pyproject.toml explicitly pins torch<2.7, and PyTorch 2.6.x CUDA 12.4 wheels are the stable channel.

**Why NOT pytorch/pytorch base image:** The official pytorch/pytorch Docker images bundle a full Conda environment (~7GB). For a serverless worker where cold start matters, starting from nvidia/cuda and pip-installing only what you need produces a leaner image (target ~8-10GB vs ~14GB+). RunPod charges from worker-start to worker-stop, so faster image pull = lower cost.

**Why NOT CUDA 12.6 or 12.8:** TRIBE v2 caps torch at <2.7. PyTorch 2.6.x treats CUDA 12.6 as experimental. CUDA 12.4 is the stable, battle-tested path for torch 2.6.x.

### Core ML Dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| torch | 2.6.0+cu124 | Deep learning framework | Latest release within TRIBE v2's constraint (>=2.5.1,<2.7). Install with `--index-url https://download.pytorch.org/whl/cu124`. |
| torchvision | 0.21.0+cu124 | Vision transforms | Paired with torch 2.6.0 per PyTorch compatibility matrix. Within TRIBE v2's >=0.20,<0.22 constraint. |
| torchaudio | 2.6.0+cu124 | Audio processing | Required for Wav2Vec-BERT audio feature extraction in TRIBE v2. |
| transformers | >=4.45,<5.0 | HuggingFace models | TRIBE v2 uses LLaMA 3.2 and Wav2Vec-BERT via HuggingFace. Pin to avoid breaking changes. |
| tribev2 | latest (from source) | Brain activation prediction | Install via `pip install -e .` from cloned repo. No PyPI release exists -- must install from github.com/facebookresearch/tribev2. |
| x_transformers | 1.27.20 | Transformer architecture | Pinned by TRIBE v2's pyproject.toml. Do not upgrade independently. |
| einops | >=0.7 | Tensor operations | Used by TRIBE v2 internals. No strict pin needed. |

**Confidence:** HIGH -- versions extracted directly from TRIBE v2's pyproject.toml.

### TRIBE v2 Sub-Model Dependencies

TRIBE v2 internally loads three large feature extractors. These are NOT separate pip installs -- they download from HuggingFace Hub at first inference. Understanding their size is critical for container strategy.

| Sub-Model | Purpose | Approximate Size | Source |
|-----------|---------|-----------------|--------|
| V-JEPA2 | Video feature extraction | ~1-2GB | facebook/vjepa2 (HuggingFace) |
| LLaMA 3.2 | Text feature extraction | ~3-6GB | meta-llama/Llama-3.2 (HuggingFace) |
| Wav2Vec-BERT | Audio feature extraction | ~1-2GB | facebook/w2v-bert (HuggingFace) |
| TRIBE v2 checkpoint | Brain prediction head | ~1GB | facebook/tribev2 (HuggingFace) |

**Total model weight estimate:** 6-11GB downloaded at first run. This MUST be baked into the Docker image or loaded from a RunPod Network Volume to avoid 2-5 minute cold starts on every scale-from-zero event.

**Confidence:** MEDIUM -- model sizes estimated from architecture types. Exact sizes need validation by running `TribeModel.from_pretrained()` and checking cache folder.

### Video/Audio Processing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| moviepy | >=2.2.1 | Video manipulation | Required by TRIBE v2 for video-to-audio extraction and segment handling. |
| ffmpeg | system package | Video/audio codec backend | moviepy depends on ffmpeg. Install via `apt-get install ffmpeg` in Dockerfile. |
| soundfile | >=0.12 | Audio I/O | Required by TRIBE v2 for reading extracted audio segments. |
| julius | >=0.2 | Audio resampling | Required by TRIBE v2 for resampling audio to model's expected sample rate. |

**Confidence:** HIGH -- these are direct TRIBE v2 dependencies from pyproject.toml.

### Text Processing (for TRIBE v2's speech transcription pipeline)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| spacy | >=3.7 | NLP pipeline | Used by TRIBE v2 for text event processing. |
| langdetect | >=1.0 | Language detection | TRIBE v2 uses this for multilingual support in transcription. |
| Levenshtein | >=0.20 | String matching | Used by TRIBE v2 for text alignment. |
| gtts | >=2.3 | Text-to-speech | Used by TRIBE v2 (likely for generating reference audio). |

**Confidence:** HIGH -- from pyproject.toml.

**Note on WhisperX:** TRIBE v2's demo notebook shows speech transcription via WhisperX for word-level timestamps. WhisperX may be an implicit dependency loaded at runtime. If transcription fails, install `whisperx>=3.8` and its `faster-whisper` backend. This is a likely pitfall -- flag for validation.

### RunPod Serverless SDK

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| runpod | 1.8.2 | Serverless worker SDK | Latest stable release (March 2026). Provides `runpod.serverless.start()` entry point, job handling, and health checks. Requires Python 3.8+. |

**Confidence:** HIGH -- version confirmed from GitHub releases page.

### Utility Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| requests | >=2.31 | HTTP client | Downloading video from input URL before inference. |
| huggingface_hub | >=0.20 | Model downloads | TRIBE v2 uses this to pull pretrained weights. Required dependency. |
| numpy | 2.2.6 | Array operations | Pinned by TRIBE v2. Do not change. |
| pyyaml | >=6.0 | Config parsing | Required by TRIBE v2. |

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Docker | 24+ | Containerization | Standard. Use multi-stage build to minimize image size. |
| RunPod Serverless | N/A | GPU compute platform | Pay-per-second billing, no idle cost. A40 (48GB, $0.35/hr) recommended for validation; A100 80GB ($2.17/hr) if VRAM insufficient. |
| RunPod Network Volume | N/A | Persistent model cache | Store pre-downloaded model weights. Eliminates cold-start model downloads. Adds ~1-2ms latency vs local disk but saves minutes vs re-downloading 6-11GB of weights. |

**Confidence:** HIGH for RunPod SDK, MEDIUM for GPU selection (depends on actual TRIBE v2 VRAM usage -- needs benchmarking).

## GPU Selection Strategy

| GPU | VRAM | Serverless $/hr | Recommendation |
|-----|------|-----------------|----------------|
| A40 | 48GB | $0.35 | Start here. Likely sufficient for TRIBE v2 inference. Best cost for validation. |
| A100 40GB | 40GB | $1.89 | Only if A40 unavailable or VRAM insufficient. |
| A100 80GB | 80GB | $2.17 | If model + feature extractors exceed 40GB VRAM combined. |
| T4 | 16GB | $0.40 | Too small. LLaMA 3.2 alone may exceed 16GB. Do not use. |

**Recommendation:** Start with A40. TRIBE v2 loads V-JEPA2 + LLaMA 3.2 + Wav2Vec-BERT + its own transformer. Combined VRAM likely 15-30GB depending on batch size and precision. A40's 48GB should handle this with headroom.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Base image | nvidia/cuda:12.4.1-runtime | pytorch/pytorch:2.6.0 | Too bloated (~14GB with Conda). Cold start penalty on serverless. |
| Base image | nvidia/cuda:12.4.1-runtime | runpod/base | Convenient but opaque -- unclear what's pre-installed, harder to debug version conflicts with TRIBE v2's strict torch pin. |
| Python | 3.11 | 3.12 | TRIBE v2 says 3.11+, but spacy/julius/neuralset wheel availability on 3.12 is uncertain. Play safe. |
| GPU platform | RunPod Serverless | Modal | RunPod has better GPU selection, more transparent pricing, and explicit Dockerfile-based deployment. Modal's decorator-based approach adds abstraction. |
| GPU platform | RunPod Serverless | AWS SageMaker | Overkill for validation. Complex setup. RunPod is faster to iterate. |
| Torch version | 2.6.0 | 2.5.1 | 2.6.0 is latest within constraint. Better CUDA 12.4 support and performance improvements. |
| Model caching | Network Volume | Bake into image | Baking 6-11GB of weights into Docker image creates a 15-20GB image. Network Volume is more flexible and RunPod caches images at edge anyway. |

## Dockerfile Strategy

```dockerfile
# Stage 1: Base with CUDA + Python
FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 python3.11-venv python3-pip \
    ffmpeg git wget curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Make python3.11 default
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1

# PyTorch (CUDA 12.4 wheels)
RUN pip install --no-cache-dir \
    torch==2.6.0+cu124 \
    torchvision==0.21.0+cu124 \
    torchaudio==2.6.0+cu124 \
    --index-url https://download.pytorch.org/whl/cu124

# TRIBE v2 from source
RUN git clone https://github.com/facebookresearch/tribev2.git /opt/tribev2 \
    && cd /opt/tribev2 && pip install --no-cache-dir -e .

# RunPod SDK
RUN pip install --no-cache-dir runpod==1.8.2

# Download spacy model
RUN python -m spacy download en_core_web_sm

# Copy handler
WORKDIR /app
COPY src/ /app/src/

# Pre-download model weights (optional -- or use Network Volume)
# RUN python -c "from tribev2 import TribeModel; TribeModel.from_pretrained('facebook/tribev2', cache_folder='/app/cache')"

CMD ["python", "-u", "src/handler.py"]
```

**Key decisions in Dockerfile:**
1. `runtime` not `devel` -- saves ~3GB, no compilation needed
2. `--no-cache-dir` on all pip installs -- reduces image size
3. ffmpeg as system package -- required by moviepy
4. Model weights download commented out -- decide after benchmarking if baking in vs Network Volume is better
5. `python -u` for unbuffered output -- important for RunPod log visibility

## Handler Pattern

```python
import runpod
import requests
import tempfile
from tribev2 import TribeModel

# Load model ONCE at container startup (not per-job)
model = TribeModel.from_pretrained(
    "facebook/tribev2",
    cache_folder="/runpod-volume/models"  # Network Volume path
)

def handler(job):
    """RunPod serverless handler for TRIBE v2 inference."""
    job_input = job["input"]
    video_url = job_input["video_url"]

    # Download video to temp file
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        response = requests.get(video_url, stream=True)
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
        video_path = f.name

    # Run inference
    df = model.get_events_dataframe(video_path=video_path)
    preds, segments = model.predict(events=df)

    # preds shape: (n_timesteps, n_vertices) -- ~20k cortical vertices per second
    return {
        "raw_predictions_shape": list(preds.shape),
        "n_segments": len(segments),
        "predictions": preds.tolist(),  # May need truncation for large videos
        "segments": segments,
    }

runpod.serverless.start({"handler": handler})
```

**Critical pattern:** Model loads at module level (container startup), NOT inside handler. This means the model loads once and persists across all jobs the worker handles. RunPod workers can process multiple jobs before scaling down.

## Installation (Local Development)

```bash
# Create environment
python3.11 -m venv .venv
source .venv/bin/activate

# Core ML (requires CUDA-capable GPU locally)
pip install torch==2.6.0+cu124 torchvision==0.21.0+cu124 torchaudio==2.6.0+cu124 \
    --index-url https://download.pytorch.org/whl/cu124

# TRIBE v2
git clone https://github.com/facebookresearch/tribev2.git
cd tribev2 && pip install -e . && cd ..

# RunPod SDK
pip install runpod==1.8.2

# Video processing (system)
# macOS: brew install ffmpeg
# Ubuntu: apt-get install ffmpeg

# Spacy model
python -m spacy download en_core_web_sm
```

## Version Constraint Summary

This is the critical constraint chain that drives all version decisions:

```
TRIBE v2 pyproject.toml
  -> torch>=2.5.1,<2.7      --> torch 2.6.0
  -> torchvision>=0.20,<0.22 --> torchvision 0.21.0
  -> numpy==2.2.6            --> numpy 2.2.6 (hard pin!)
  -> x_transformers==1.27.20 --> x_transformers 1.27.20 (hard pin!)
  -> moviepy>=2.2.1          --> moviepy 2.2.1+

torch 2.6.0
  -> CUDA 12.4 (stable)      --> nvidia/cuda:12.4.1 base image
  -> Python 3.10+             --> Python 3.11 (TRIBE v2 requirement)
```

**Do NOT independently upgrade any pinned dependency.** TRIBE v2's pins are there for compatibility. Breaking the torch<2.7 constraint will cause import errors from x_transformers and internal model code.

## Sources

- [TRIBE v2 GitHub Repository](https://github.com/facebookresearch/tribev2) -- pyproject.toml dependency analysis
- [TRIBE v2 Demo Notebook](https://github.com/facebookresearch/tribev2/blob/main/tribe_demo.ipynb) -- inference API pattern
- [Meta AI Blog: TRIBE v2](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/) -- architecture overview
- [RunPod Python SDK](https://github.com/runpod/runpod-python) -- v1.8.2, handler pattern
- [RunPod Worker Template](https://github.com/runpod-workers/worker-template) -- Dockerfile patterns
- [RunPod Docker + PyTorch Guide](https://www.runpod.io/articles/guides/docker-setup-pytorch-cuda-12-8-python-3-11) -- base image recommendations
- [RunPod Serverless Pricing](https://www.runpod.io/pricing) -- GPU cost comparison
- [PyTorch 2.6 Release](https://pytorch.org/blog/pytorch2-6/) -- CUDA 12.4 compatibility
- [nvidia/cuda Docker Hub](https://hub.docker.com/r/nvidia/cuda) -- base image tags
