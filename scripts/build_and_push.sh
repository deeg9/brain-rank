#!/usr/bin/env bash
# =============================================================================
# NeuroCut — Docker Build and Push Script
# =============================================================================
#
# Builds the NeuroCut inference container for linux/amd64 and pushes it to
# Docker Hub. Run `docker login` first if not already authenticated.
#
# Required environment variables:
#   DOCKER_USERNAME  — Your Docker Hub username
#   HF_TOKEN         — Hugging Face access token (for gated model access)
#
# Optional environment variables:
#   IMAGE_NAME       — Docker image name (default: neurocut-worker)
#
# Usage:
#   export DOCKER_USERNAME=your-dockerhub-username
#   export HF_TOKEN=your-huggingface-token
#   ./scripts/build_and_push.sh
#
# Estimated build time: 15-30 minutes (large ML dependencies)
# Estimated image size: ~10-12 GB
# =============================================================================

set -euo pipefail

# ---------- Configuration ----------
IMAGE_NAME="${IMAGE_NAME:-neurocut-worker}"

# ---------- Validate required env vars ----------
if [ -z "${DOCKER_USERNAME:-}" ]; then
    echo "ERROR: DOCKER_USERNAME environment variable is not set."
    echo "Usage: export DOCKER_USERNAME=your-dockerhub-username"
    exit 1
fi

if [ -z "${HF_TOKEN:-}" ]; then
    echo "ERROR: HF_TOKEN environment variable is not set."
    echo "This is required as a build arg for gated model access (e.g., LLaMA 3.2)."
    echo "Usage: export HF_TOKEN=your-huggingface-token"
    exit 1
fi

FULL_IMAGE="${DOCKER_USERNAME}/${IMAGE_NAME}:latest"

echo "============================================="
echo "NeuroCut Docker Build & Push"
echo "============================================="
echo "Image:    ${FULL_IMAGE}"
echo "Platform: linux/amd64"
echo "============================================="
echo ""

# ---------- Build ----------
echo "[1/2] Building Docker image (this may take 15-30 minutes)..."
echo ""

docker build \
    --platform linux/amd64 \
    --build-arg HF_TOKEN="$HF_TOKEN" \
    -t "$FULL_IMAGE" \
    .

echo ""
echo "[1/2] Build complete."
echo ""

# ---------- Push ----------
echo "[2/2] Pushing to Docker Hub..."
echo ""

docker push "$FULL_IMAGE"

echo ""
echo "============================================="
echo "SUCCESS"
echo "============================================="
echo "Image pushed: ${FULL_IMAGE}"
echo ""
echo "Use this image URL in RunPod endpoint configuration:"
echo "  ${FULL_IMAGE}"
echo "============================================="
