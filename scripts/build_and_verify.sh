#!/usr/bin/env bash
# ============================================================================
# NeuroCut — Docker Build & GPU Verification Script
# ============================================================================
#
# Run this on a RunPod GPU pod after cloning the repo:
#   chmod +x scripts/build_and_verify.sh
#   export HF_TOKEN=hf_...
#   bash scripts/build_and_verify.sh
#
# This script:
#   1. Pre-flight checks (docker, nvidia-smi, HF_TOKEN)
#   2. Builds the Docker image with timing
#   3. Captures image size
#   4. Runs the 23-check GPU verification suite
#   5. Tests actual model weight loading on GPU
#   6. Prints a structured summary with weights strategy recommendation
#
# Exit code 0: all critical steps passed
# Exit code 1: one or more critical steps failed
# ============================================================================

set -uo pipefail

# Track overall timing
SECONDS=0

# Result tracking
BUILD_OK=false
VERIFY_OK=false
MODEL_LOAD_OK=false
BUILD_TIME="N/A"
IMAGE_SIZE="N/A"

# ============================================================================
# Step 1: Pre-flight checks
# ============================================================================
echo ""
echo "=============================================="
echo "Step 1: Pre-flight checks"
echo "=============================================="

PREFLIGHT_PASS=true

# Check docker
if command -v docker &> /dev/null; then
    echo "[PASS] docker found: $(docker --version)"
else
    echo "[FAIL] docker not found. Install Docker first."
    PREFLIGHT_PASS=false
fi

# Check nvidia-smi
if command -v nvidia-smi &> /dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)
    GPU_VRAM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader | head -1)
    echo "[PASS] nvidia-smi found: $GPU_NAME ($GPU_VRAM)"
else
    echo "[FAIL] nvidia-smi not found. This script requires an NVIDIA GPU."
    PREFLIGHT_PASS=false
fi

# Check HF_TOKEN (presence only — never print the value)
if [ -n "${HF_TOKEN:-}" ]; then
    echo "[PASS] HF_TOKEN is set (value not shown for security)"
else
    echo "[FAIL] HF_TOKEN is not set. Required for gated model access (LLaMA 3.2)."
    echo "       Set it with: export HF_TOKEN=hf_..."
    PREFLIGHT_PASS=false
fi

if [ "$PREFLIGHT_PASS" = false ]; then
    echo ""
    echo "Pre-flight checks failed. Fix the above issues and re-run."
    exit 1
fi

echo ""
echo "All pre-flight checks passed."

# ============================================================================
# Step 2: Docker build
# ============================================================================
echo ""
echo "=============================================="
echo "Step 2: Docker build"
echo "=============================================="

BUILD_START=$SECONDS

# Build the image — HF_TOKEN passed as build arg (never echoed)
if docker build --build-arg HF_TOKEN="$HF_TOKEN" -t neurocut .; then
    BUILD_OK=true
    BUILD_ELAPSED=$((SECONDS - BUILD_START))
    BUILD_TIME="${BUILD_ELAPSED}s ($((BUILD_ELAPSED / 60))m $((BUILD_ELAPSED % 60))s)"
    echo ""
    echo "Docker build succeeded in $BUILD_TIME"
else
    BUILD_ELAPSED=$((SECONDS - BUILD_START))
    BUILD_TIME="${BUILD_ELAPSED}s"
    echo ""
    echo "Docker build FAILED after ${BUILD_TIME}."
    echo "Check the build output above for errors."
    exit 1
fi

# ============================================================================
# Step 3: Image size capture
# ============================================================================
echo ""
echo "=============================================="
echo "Step 3: Image size"
echo "=============================================="

IMAGE_SIZE=$(docker images neurocut --format "{{.Size}}")
IMAGE_DETAIL=$(docker images neurocut --format "{{.Repository}}:{{.Tag}}  {{.Size}}  {{.ID}}")

echo "Image: $IMAGE_DETAIL"
echo ""
echo "  Image size (no weights): $IMAGE_SIZE"

# ============================================================================
# Step 4: GPU verification (verify_container.py — 23 checks)
# ============================================================================
echo ""
echo "=============================================="
echo "Step 4: GPU verification (verify_container.py)"
echo "=============================================="

VERIFY_OUTPUT=$(docker run --rm --gpus all neurocut python -u scripts/verify_container.py 2>&1) || true
VERIFY_EXIT=$?

echo "$VERIFY_OUTPUT"

if [ $VERIFY_EXIT -eq 0 ]; then
    VERIFY_OK=true
    echo ""
    echo "Verification: PASSED"
else
    echo ""
    echo "Verification: FAILED (exit code $VERIFY_EXIT)"
fi

# ============================================================================
# Step 5: Model load test (TribeModel.from_pretrained on GPU)
# ============================================================================
echo ""
echo "=============================================="
echo "Step 5: Model load test"
echo "=============================================="

MODEL_START=$SECONDS

MODEL_OUTPUT=$(docker run --rm --gpus all -e HF_TOKEN="$HF_TOKEN" neurocut \
    python -u -c "
from tribev2 import TribeModel
m = TribeModel.from_pretrained('facebook/tribev2')
print('TribeModel loaded successfully')
import torch
print(f'GPU: {torch.cuda.get_device_name(0)}')
print(f'VRAM allocated: {torch.cuda.memory_allocated()/1e9:.2f} GB')
" 2>&1) || true
MODEL_EXIT=$?

MODEL_ELAPSED=$((SECONDS - MODEL_START))

echo "$MODEL_OUTPUT"

if [ $MODEL_EXIT -eq 0 ]; then
    MODEL_LOAD_OK=true
    echo ""
    echo "Model load: PASSED (${MODEL_ELAPSED}s)"
else
    echo ""
    echo "Model load: FAILED (exit code $MODEL_EXIT, ${MODEL_ELAPSED}s)"
fi

# ============================================================================
# Step 6: Summary
# ============================================================================
TOTAL_TIME=$SECONDS

echo ""
echo "=============================================="
echo "=============================================="
echo "         NeuroCut Build & Verify Summary"
echo "=============================================="
echo "=============================================="
echo ""
echo "--- Build Results ---"
echo "  Build time:          $BUILD_TIME"
echo "  Image size:          $IMAGE_SIZE"
echo "  Build status:        $([ "$BUILD_OK" = true ] && echo "PASS" || echo "FAIL")"
echo ""
echo "--- Verification Results ---"
echo "  verify_container.py: $([ "$VERIFY_OK" = true ] && echo "PASS" || echo "FAIL")"
echo "  Model load test:     $([ "$MODEL_LOAD_OK" = true ] && echo "PASS" || echo "FAIL")"
echo ""
echo "--- Weights Strategy Recommendation ---"
echo ""
echo "  Decision: Use RunPod Network Volume (do NOT bake weights into image)"
echo ""
echo "  Rationale:"
echo "    - Image size without weights: $IMAGE_SIZE"
echo "    - Estimated image size WITH weights: add ~8-10 GB (total ~18-20 GB)"
echo "    - Baking weights creates an unnecessarily large image"
echo "    - Network Volume eliminates cold-start downloads while keeping image lean"
echo ""
echo "  Implementation:"
echo "    - RunPod Network Volume mounts at /runpod-volume"
echo "    - Set HF_HOME=/runpod-volume/huggingface in RunPod endpoint config"
echo "    - First cold start downloads weights (~2-5 min depending on model)"
echo "    - Subsequent starts use cached weights (near-instant)"
echo "    - Recommended Network Volume size: ~15 GB (weights + HF cache overhead)"
echo ""
echo "--- Overall ---"
echo "  Total time:          ${TOTAL_TIME}s ($((TOTAL_TIME / 60))m $((TOTAL_TIME % 60))s)"

# Determine exit code
if [ "$BUILD_OK" = true ] && [ "$VERIFY_OK" = true ] && [ "$MODEL_LOAD_OK" = true ]; then
    echo "  Result:              ALL PASSED"
    echo ""
    exit 0
else
    echo "  Result:              SOME CHECKS FAILED"
    echo ""
    exit 1
fi
