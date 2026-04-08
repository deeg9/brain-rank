# Phase 4: Container Foundation - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Build a Docker image that contains CUDA, Python 3.11, PyTorch 2.6.0, all TRIBE v2 dependencies, and gated model access via HF_TOKEN. The image must build without errors and be suitable for RunPod serverless deployment.

Key constraints from earlier phases:
- PyTorch 2.6.0+cu124 (TRIBE v2 pins torch>=2.5.1,<2.7)
- NEVER install whisperx separately — it corrupts the environment (replaces torch 2.6 with 2.8)
- uv package provides uvx command needed by TRIBE v2 for WhisperX
- nilearn needed for atlas fetching (or use pre-computed masks from data/region_masks.npz)
- ffmpeg needed at system level for video processing
- HF_TOKEN env var for gated LLaMA 3.2 access
- Model weights ~6.5GB (audio 2.3GB + video 4.1GB + TRIBE checkpoint 709MB)
- Peak VRAM: ~11GB on A40

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — infrastructure phase. Key decisions:
- Base image: nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04 (research recommendation)
- Whether to bake model weights into image or use network volume
- Multi-stage build vs single stage
- requirements.txt vs inline pip install in Dockerfile

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- scripts/setup_remote.sh — proven install sequence (reference, don't copy directly)
- data/region_masks.npz — pre-computed masks (eliminates nilearn runtime dependency)
- src/region_mapping/ — Python package to include

### Established Patterns
- Install order: PyTorch first → TRIBE v2 → nilearn → uv (CRITICAL)
- spaCy en_core_web_sm model needed
- huggingface-cli login via python -c (CLI may not be on PATH)

### Integration Points
- Phase 5 verifies the container loads models on GPU
- Phase 6-7 adds the RunPod handler inside this container

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
