#!/usr/bin/env bash
# Usage: bash scripts/setup_remote.sh [HF_TOKEN]
#
# Automated environment setup for TRIBE v2 on a fresh Ubuntu machine with NVIDIA GPU.
# Installs all dependencies, creates a Python 3.11 venv, and verifies installation.

set -euo pipefail

echo "=============================================="
echo "TRIBE v2 Remote Environment Setup"
echo "=============================================="

# Handle optional HF_TOKEN argument
if [[ "${1:-}" != "" ]]; then
    export HF_TOKEN="$1"
    echo "HF_TOKEN set from argument (not logged for security)"
else
    echo "No HF_TOKEN provided. Set it manually if LLaMA 3.2 access is needed:"
    echo "  export HF_TOKEN=hf_..."
fi

# Check for NVIDIA GPU
echo ""
echo "=== Checking GPU ==="
if ! command -v nvidia-smi &> /dev/null; then
    echo "ERROR: nvidia-smi not found. This script requires an NVIDIA GPU."
    exit 1
fi
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
echo ""

# Install system dependencies
echo "=== Installing system dependencies ==="
apt-get update -qq
apt-get install -y -qq ffmpeg python3.11 python3.11-venv git > /dev/null 2>&1
echo "System dependencies installed: ffmpeg, python3.11, python3.11-venv, git"

# Create Python 3.11 virtual environment
echo ""
echo "=== Creating Python 3.11 virtual environment ==="
python3.11 -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate
echo "Virtual environment created and activated at .venv/"
echo "Python version: $(python --version)"

# Upgrade pip
pip install --upgrade pip > /dev/null 2>&1

# Install PyTorch with CUDA 12.4 FIRST (prevents CPU-only fallback)
echo ""
echo "=== Installing PyTorch with CUDA 12.4 ==="
pip install torch==2.6.0+cu124 torchvision==0.21.0+cu124 torchaudio==2.6.0+cu124 \
    --index-url https://download.pytorch.org/whl/cu124
echo "PyTorch installed"

# Verify CUDA is available in PyTorch
python -c "import torch; assert torch.cuda.is_available(), 'CUDA not available in PyTorch!'; print(f'PyTorch CUDA OK: {torch.cuda.get_device_name(0)}')"

# Install TRIBE v2 from source (pulls neuralset, neuraltrain, and all deps)
echo ""
echo "=== Installing TRIBE v2 from source ==="
pip install "tribev2 @ git+https://github.com/facebookresearch/tribev2.git"
echo "TRIBE v2 installed"

# Download spaCy English model
echo ""
echo "=== Downloading spaCy model ==="
python -m spacy download en_core_web_sm
echo "spaCy model downloaded"

# Run verification script
echo ""
echo "=== Running installation verification ==="
python scripts/verify_install.py

echo ""
echo "=============================================="
echo "Setup complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Download a test video:  wget -O test_videos/test_video.mp4 'https://download.blender.org/demo/movies/Sintel.2010.720p.mkv'"
echo "  2. Run inference test:     python scripts/test_inference.py"
