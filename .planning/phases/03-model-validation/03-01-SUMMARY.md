---
plan: 03-01
phase: 03-model-validation
status: complete
started: 2026-04-08T22:39:00Z
completed: 2026-04-08T23:10:00Z
---

# Plan 03-01 Summary: Two-Video Validation + GPU Execution

## What Was Built

Created validation scripts and executed TRIBE v2 inference on two contrasting videos (Sintel trailer vs Big Buck Bunny opening) on RunPod A40 GPU Pod. Computed per-region activation scores with hemodynamic alignment and Cohen's d effect sizes.

## Key Results

- **Overall differentiation: YES** — all 4 regions show meaningful differences
- **Attention:** Cohen's d = 1.02 (large effect)
- **Reward:** Cohen's d = 0.75 (medium effect)
- **Emotional Processing:** Cohen's d = 0.40 (small effect)
- **Social Cognition:** Cohen's d = 0.65 (medium effect)
- **GO decision: Model is viable** for NeuroCut engagement scoring

## Timing

- High-engagement video: 777.6s total (699.5s inference)
- Low-engagement video: 644.9s total (593.6s inference)
- VRAM peak: 10.88 GB on A40

## Issues Encountered

1. WhisperX dependency corrupted the Python environment (urllib3, torch) — required full venv rebuild
2. ffmpeg not installed on RunPod template — needed `apt-get install ffmpeg`
3. moviepy chapter metadata bug — required re-encoding videos with `-map_chapters -1`
4. `uvx` (from `uv` package) needed for TRIBE v2's WhisperX integration
5. setup_validation.sh tried to re-clone repo — had to run validation manually

## Key Files

### Created
- `scripts/validate_model.py` — Two-video validation script
- `scripts/setup_validation.sh` — GPU pod setup script
- `data/validation_comparison.json` — Structured comparison results

## Self-Check

- [x] Validation script created and committed
- [x] Two contrasting videos processed on GPU
- [x] Per-region activation scores computed with hemodynamic alignment
- [x] Cohen's d effect sizes calculated for all 4 regions
- [x] Comparison JSON saved with structured results
- [x] Overall differentiation = YES (4/4 regions above threshold)
