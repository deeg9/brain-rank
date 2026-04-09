# Container Verification Report

**Date:** 2026-04-08
**GPU:** NVIDIA RTX A4500 (20GB VRAM)
**Pod Template:** RunPod PyTorch 2.4.0 (py3.11-cuda12.4.1)

## CNTR-04: Full Model Load on GPU

**Status: PASS**

All 23 verification checks passed:
- Python 3.11.10
- PyTorch 2.6.0+cu124 with CUDA 12.4
- torch.cuda.is_available() = True
- GPU detected: NVIDIA RTX A4500
- TribeModel imports successfully
- All sub-dependencies: neuralset, neuraltrain, transformers 5.5.0, einops, x_transformers, moviepy 2.1.2, soundfile, julius, spacy 3.8.14, langdetect
- ffmpeg on PATH
- uv/uvx on PATH (for TRIBE v2's WhisperX integration)
- HF_TOKEN authenticated (user: cdfill)
- region_masks.npz found
- src/region_mapping/ package found
- runpod 1.8.2 installed

## CNTR-05: Docker Image Size

**Status: DOCUMENTED (build deferred)**

Docker is not available inside RunPod pods (they are already containers). The Dockerfile was verified by installing its exact dependency sequence in the pod environment. Estimated image size based on installed packages:
- Base nvidia/cuda:12.4.1-cudnn-runtime: ~4.5 GB
- PyTorch 2.6.0+cu124: ~2.5 GB
- TRIBE v2 + all dependencies: ~3 GB
- **Estimated total: ~10-11 GB** (within 15 GB target)

Actual Docker image size will be measured when building on a Docker-capable machine (CI/CD pipeline or local Docker Desktop).

## CNTR-06: Model Weights Strategy

**Decision: Network Volume (not baked into image)**

**Rationale:**
- Model weights total ~6.5 GB (audio encoder 2.3GB + video encoder 4.1GB + TRIBE checkpoint 709MB)
- Baking weights into image would push it to ~17 GB (exceeds 15 GB target)
- RunPod supports network volumes that persist across pod restarts
- First-run download from HuggingFace cached in ~/.cache/huggingface/
- Cold start with cached weights: ~2s model load (measured in Phase 1)
- Cold start without cache: ~10-15s for downloads

**Implementation:**
- Dockerfile does NOT bake model weights
- HF_TOKEN passed as runtime env var for gated model access
- Model weights cached on first inference in /root/.cache/huggingface/
- RunPod network volume can be attached to persist cache across worker restarts

## Verification Command Output

```
Results: 23/23 checks passed
All checks passed! Container is ready for inference.
```

## Install Sequence (Proven Working)

1. PyTorch 2.6.0+cu124 (FIRST)
2. tribev2 from git (pulls neuralset, neuraltrain, spacy, etc.)
3. nilearn, uv, runpod==1.8.2
4. spacy en_core_web_sm model
5. ffmpeg via apt-get
6. HuggingFace login for gated models

**Critical: Do NOT install whisperx separately — it corrupts PyTorch.**
