<!-- GSD:project-start source:PROJECT.md -->
## Project

**NeuroCut — Inference Pipeline**

A containerized RunPod serverless worker that runs TRIBE v2 (Meta's brain-activation prediction model) on video input and returns per-segment neural activation scores. This is the foundational inference layer for NeuroCut — a neural A/B testing tool for content creators. This project covers only the inference pipeline: finding TRIBE v2, getting it running, containerizing it, and deploying it as a RunPod serverless endpoint.

**Core Value:** Send a video URL to a RunPod endpoint and get back per-segment brain activation scores as JSON — proving the model works, the pipeline is viable, and inference time is acceptable.

### Constraints

- **Model license**: CC BY-NC-4.0 — non-commercial only for now, acceptable for validation
- **GPU requirement**: TRIBE v2 requires CUDA-capable GPU — RunPod A100/A40 expected
- **Container size**: ML model containers can be large (10GB+) — affects cold start time on RunPod serverless
- **RunPod serverless**: Must conform to RunPod's serverless worker pattern (handler function, input/output schema)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Container Base Image
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| nvidia/cuda | 12.4.1-cudnn-runtime-ubuntu22.04 | Docker base image | TRIBE v2 pins torch>=2.5.1,<2.7. PyTorch 2.6.x ships stable wheels for CUDA 12.4. Use `runtime` not `devel` -- no compilation needed, saves ~3GB image size. Ubuntu 22.04 is the LTS that all NVIDIA images target. |
| Python | 3.11 | Runtime | TRIBE v2 requires Python 3.11+. Do NOT use 3.12+ -- some ML dependencies (spacy, julius) may have wheel gaps on 3.12. |
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
### TRIBE v2 Sub-Model Dependencies
| Sub-Model | Purpose | Approximate Size | Source |
|-----------|---------|-----------------|--------|
| V-JEPA2 | Video feature extraction | ~1-2GB | facebook/vjepa2 (HuggingFace) |
| LLaMA 3.2 | Text feature extraction | ~3-6GB | meta-llama/Llama-3.2 (HuggingFace) |
| Wav2Vec-BERT | Audio feature extraction | ~1-2GB | facebook/w2v-bert (HuggingFace) |
| TRIBE v2 checkpoint | Brain prediction head | ~1GB | facebook/tribev2 (HuggingFace) |
### Video/Audio Processing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| moviepy | >=2.2.1 | Video manipulation | Required by TRIBE v2 for video-to-audio extraction and segment handling. |
| ffmpeg | system package | Video/audio codec backend | moviepy depends on ffmpeg. Install via `apt-get install ffmpeg` in Dockerfile. |
| soundfile | >=0.12 | Audio I/O | Required by TRIBE v2 for reading extracted audio segments. |
| julius | >=0.2 | Audio resampling | Required by TRIBE v2 for resampling audio to model's expected sample rate. |
### Text Processing (for TRIBE v2's speech transcription pipeline)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| spacy | >=3.7 | NLP pipeline | Used by TRIBE v2 for text event processing. |
| langdetect | >=1.0 | Language detection | TRIBE v2 uses this for multilingual support in transcription. |
| Levenshtein | >=0.20 | String matching | Used by TRIBE v2 for text alignment. |
| gtts | >=2.3 | Text-to-speech | Used by TRIBE v2 (likely for generating reference audio). |
### RunPod Serverless SDK
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| runpod | 1.8.2 | Serverless worker SDK | Latest stable release (March 2026). Provides `runpod.serverless.start()` entry point, job handling, and health checks. Requires Python 3.8+. |
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
## GPU Selection Strategy
| GPU | VRAM | Serverless $/hr | Recommendation |
|-----|------|-----------------|----------------|
| A40 | 48GB | $0.35 | Start here. Likely sufficient for TRIBE v2 inference. Best cost for validation. |
| A100 40GB | 40GB | $1.89 | Only if A40 unavailable or VRAM insufficient. |
| A100 80GB | 80GB | $2.17 | If model + feature extractors exceed 40GB VRAM combined. |
| T4 | 16GB | $0.40 | Too small. LLaMA 3.2 alone may exceed 16GB. Do not use. |
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
# Stage 1: Base with CUDA + Python
# System deps
# Make python3.11 default
# PyTorch (CUDA 12.4 wheels)
# TRIBE v2 from source
# RunPod SDK
# Download spacy model
# Copy handler
# Pre-download model weights (optional -- or use Network Volume)
# RUN python -c "from tribev2 import TribeModel; TribeModel.from_pretrained('facebook/tribev2', cache_folder='/app/cache')"
## Handler Pattern
# Load model ONCE at container startup (not per-job)
## Installation (Local Development)
# Create environment
# Core ML (requires CUDA-capable GPU locally)
# TRIBE v2
# RunPod SDK
# Video processing (system)
# macOS: brew install ffmpeg
# Ubuntu: apt-get install ffmpeg
# Spacy model
## Version Constraint Summary
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
