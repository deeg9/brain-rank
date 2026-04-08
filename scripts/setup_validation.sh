#!/bin/bash
# =============================================================================
# NeuroCut Validation Setup Script
# =============================================================================
# Sets up a GPU pod (RunPod A40 recommended) for two-video validation.
# Downloads both test videos and runs the validation script.
#
# Make this script executable: chmod +x scripts/setup_validation.sh
# Usage: bash scripts/setup_validation.sh
#
# Prerequisites:
#   - CUDA-capable GPU (A40 recommended)
#   - Python 3.11 with TRIBE v2 installed (see scripts/setup_remote.sh)
#   - ffmpeg installed (apt-get install ffmpeg)
#   - data/region_masks.npz present in the repo
# =============================================================================

set -euo pipefail

echo "============================================"
echo "NeuroCut Two-Video Validation Setup"
echo "============================================"

# ---------------------------------------------------------------------------
# Step 1: Clone repo (or pull latest if already present)
# ---------------------------------------------------------------------------
# REPLACE this URL with your actual GitHub repo URL
REPO_URL="https://github.com/YOUR_USERNAME/NeuroCut.git"

if [ -d "NeuroCut" ]; then
    echo "NeuroCut directory exists, pulling latest..."
    cd NeuroCut
    git pull
else
    echo "Cloning NeuroCut repo..."
    # Replace REPO_URL with your actual repository URL
    git clone "$REPO_URL"
    cd NeuroCut
fi

# ---------------------------------------------------------------------------
# Step 2: Verify prerequisites
# ---------------------------------------------------------------------------
echo ""
echo "Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "ERROR: python3 not found. Install Python 3.11."
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "Installing ffmpeg..."
    apt-get update -qq && apt-get install -y -qq ffmpeg
fi

if ! python3 -c "import tribev2" 2>/dev/null; then
    echo "WARNING: tribev2 not installed. Run scripts/setup_remote.sh first or:"
    echo "  pip install -e /path/to/tribev2"
fi

if [ ! -f "data/region_masks.npz" ]; then
    echo "WARNING: data/region_masks.npz not found."
    echo "Generate masks first: python scripts/generate_masks.py"
fi

# ---------------------------------------------------------------------------
# Step 3: Create test_videos directory
# ---------------------------------------------------------------------------
mkdir -p test_videos

# ---------------------------------------------------------------------------
# Step 4: Download high-engagement video (Sintel trailer)
# ---------------------------------------------------------------------------
# Sintel is an animated short film by the Blender Foundation with fight scenes,
# emotional moments, and dramatic music -- a high-engagement stimulus.
echo ""
echo "Downloading high-engagement video (Sintel trailer)..."

if [ ! -f "test_videos/high_engagement.mp4" ]; then
    wget -q --show-progress -O test_videos/sintel_full.mkv \
        "https://download.blender.org/demo/movies/Sintel.2010.720p.mkv"

    echo "Trimming to first 60 seconds..."
    ffmpeg -y -i test_videos/sintel_full.mkv -t 60 -c copy test_videos/high_engagement.mp4

    # Clean up full download
    rm -f test_videos/sintel_full.mkv
    echo "High-engagement video ready: test_videos/high_engagement.mp4"
else
    echo "High-engagement video already exists, skipping download."
fi

# ---------------------------------------------------------------------------
# Step 5: Download low-engagement video (Big Buck Bunny opening)
# ---------------------------------------------------------------------------
# Big Buck Bunny opening (first 60 seconds) -- slow pan over a static nature
# scene with minimal character interaction, no action, and no dialogue.
# This provides a genuinely low-engagement contrast to Sintel's high-action
# trailer. The calm, static nature footage should produce measurably lower
# brain activation in attention, reward, and emotional processing regions.
echo ""
echo "Downloading low-engagement video (Big Buck Bunny opening)..."

if [ ! -f "test_videos/low_engagement.mp4" ]; then
    wget -q --show-progress -O test_videos/bbb_full.mp4 \
        "https://download.blender.org/demo/movies/BBB/bbb_sunflower_1080p_60fps_normal.mp4"

    echo "Trimming to first 60 seconds..."
    ffmpeg -y -i test_videos/bbb_full.mp4 -t 60 -c copy test_videos/low_engagement.mp4

    # Clean up full download
    rm -f test_videos/bbb_full.mp4
    echo "Low-engagement video ready: test_videos/low_engagement.mp4"
else
    echo "Low-engagement video already exists, skipping download."
fi

# ---------------------------------------------------------------------------
# Step 6: Run validation
# ---------------------------------------------------------------------------
echo ""
echo "============================================"
echo "Running two-video validation..."
echo "This will take approximately 25 minutes"
echo "(two 60s videos at ~12 minutes each)"
echo "============================================"
echo ""

python3 scripts/validate_model.py \
    test_videos/high_engagement.mp4 \
    test_videos/low_engagement.mp4 \
    2>&1 | tee data/validation_output.txt

echo ""
echo "============================================"
echo "Validation complete!"
echo "============================================"
echo ""
echo "Output files:"
echo "  - data/validation_comparison.json  (structured results)"
echo "  - data/validation_output.txt       (full terminal output)"
echo "  - data/predictions_high.npy        (raw predictions, optional)"
echo "  - data/predictions_low.npy         (raw predictions, optional)"
echo ""
echo "Copy data/validation_comparison.json and data/validation_output.txt"
echo "back to your local machine and commit them to the repo."
