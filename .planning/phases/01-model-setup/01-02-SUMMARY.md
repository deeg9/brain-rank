---
plan: 01-02
phase: 01-model-setup
status: complete
started: 2026-04-08T20:20:00Z
completed: 2026-04-08T20:40:00Z
---

# Plan 01-02 Summary: Remote GPU Execution & Output Documentation

## What Was Built

Executed TRIBE v2 installation and inference on a RunPod A40 GPU Pod, validated the complete pipeline end-to-end, and documented the raw output format for downstream phases.

## Key Results

- **TRIBE v2 inference works** on a 60-second video, producing (61, 20484) numpy array
- **Output is cortical vertex activations** (20,484 per second), NOT engagement scores — Phase 2 must map these
- **Total time: 12.7 minutes** for 60s video (inference alone: 11.3 min) — async endpoint required
- **VRAM: 11.16 GB peak** on A40 48GB — significant headroom, cheaper GPUs possible
- **WhisperX is required** but handles no-speech gracefully

## Issues Encountered

1. **`total_mem` vs `total_memory`** — PyTorch 2.6 renamed the property. Fixed with sed on the pod.
2. **moviepy chapter metadata bug** — Video with chapter markers caused ffmpeg parse error. Fixed by re-encoding with `-map_chapters -1`.
3. **WhisperX dependency conflict** — Installing whisperx replaced PyTorch 2.6 with 2.8. Fixed by reinstalling torch 2.6.0+cu124 after whisperx, then installing whisperx with `--no-deps`.
4. **GitHub auth on RunPod** — Private repo required personal access token for clone.
5. **SSH timeout** — RunPod SSH connection timed out, used web terminal instead.

## Key Files

### Created
- `docs/inference_output.json` — Machine-readable inference results
- `docs/model_output_format.md` — Complete output format documentation

### Modified
- `scripts/test_inference.py` — Fixed `total_mem` → `total_memory`

## Deviations from Plan

- Used web terminal instead of SSH (connection timeout)
- Had to re-encode video to strip chapter metadata (moviepy bug)
- WhisperX installation required careful dependency management (installed with --no-deps)
- 61 segments produced instead of 60 (model's internal filtering kept 61/100)

## Self-Check

- [x] TRIBE v2 cloned and installed on GPU machine
- [x] Inference completed on 60-second test video
- [x] Raw output shape (61, 20484) logged and documented
- [x] Inference time measured: 759s total
- [x] VRAM usage measured: 11.16 GB peak
- [x] JSON output saved to docs/inference_output.json
- [x] Output format documented in docs/model_output_format.md
