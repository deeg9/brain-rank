# ============================================================================
# NeuroCut — TRIBE v2 Inference Container
# ============================================================================
#
# CRITICAL: Install order matters. Do NOT reorder these steps.
#
# Phase 1 discovery: Installing WhisperX via pip replaces PyTorch 2.6 with 2.8
# and corrupts nvidia CUDA libraries. The solution is:
#   1. Install PyTorch FIRST (pins CUDA 12.4 wheels)
#   2. Install TRIBE v2 (pulls neuralset, neuraltrain, transformers, etc.)
#   3. Install uv (provides uvx command that TRIBE v2 uses for WhisperX)
#   4. NEVER install whisperx directly — TRIBE v2 handles it via uvx at runtime
#
# This order was validated in scripts/setup_remote.sh on an A40 GPU pod.
# See .planning/research/PITFALLS.md (Pitfall 6) for full context.
# ============================================================================

FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

# ---------- Environment ----------
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Build-time arg for optional model pre-download (gated models like LLaMA 3.2)
ARG HF_TOKEN
# Runtime access to gated models — RunPod endpoint config passes this at start
ENV HF_TOKEN=${HF_TOKEN}

# ---------- System dependencies (single layer) ----------
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3.11 \
        python3.11-venv \
        python3.11-dev \
        python3-pip \
        ffmpeg \
        git \
        wget \
        curl && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 && \
    update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 && \
    ln -sf /usr/bin/pip3 /usr/bin/pip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ---------- Pip upgrade ----------
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# ---------- PyTorch FIRST (CRITICAL — must be before TRIBE v2) ----------
# Installing TRIBE v2 first would pull a CPU-only torch or wrong CUDA version.
# We pin torch 2.6.0+cu124 to match the CUDA 12.4 base image.
RUN pip install --no-cache-dir \
    torch==2.6.0+cu124 \
    torchvision==0.21.0+cu124 \
    torchaudio==2.6.0+cu124 \
    --index-url https://download.pytorch.org/whl/cu124

# ---------- TRIBE v2 from source ----------
# Installs neuralset, neuraltrain, transformers, einops, x_transformers,
# moviepy, soundfile, julius, spacy, langdetect, and all other deps.
RUN pip install --no-cache-dir \
    "tribev2 @ git+https://github.com/facebookresearch/tribev2.git"

# ---------- uv (provides uvx for TRIBE v2's WhisperX runtime) ----------
# TRIBE v2 invokes WhisperX via uvx at runtime. Do NOT install whisperx
# directly — it replaces torch 2.6 with 2.8 and corrupts nvidia libs.
RUN pip install --no-cache-dir uv

# ---------- spaCy language model ----------
RUN python -m spacy download en_core_web_sm

# ---------- RunPod SDK ----------
RUN pip install --no-cache-dir runpod==1.8.2

# ---------- HuggingFace CLI login (conditional) ----------
# If HF_TOKEN is provided at build time, authenticate for model pre-download.
# This enables downloading gated models (e.g., LLaMA 3.2) during the build.
RUN if [ -n "$HF_TOKEN" ]; then \
        python -c "from huggingface_hub import login; login(token='${HF_TOKEN}')"; \
    fi

# ---------- Application code ----------
WORKDIR /app
COPY src/ /app/src/
COPY data/region_masks.npz /app/data/region_masks.npz
COPY scripts/verify_container.py /app/scripts/verify_container.py

# ---------- Entry point ----------
CMD ["python", "-u", "src/handler.py"]
