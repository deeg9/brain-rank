---
phase: 01-model-setup
plan: 01
subsystem: infra
tags: [tribev2, cuda, pytorch, gpu, inference, bash, python]

# Dependency graph
requires: []
provides:
  - "GPU environment setup automation (setup_remote.sh)"
  - "Dependency verification for all 13 TRIBE v2 packages (verify_install.py)"
  - "Full inference test with output format logging (test_inference.py)"
  - "Project directory structure and .gitignore"
affects: [02-output-mapping, 03-containerization]

# Tech tracking
tech-stack:
  added: [tribev2, neuralset, neuraltrain, torch, torchvision, torchaudio, transformers, moviepy, spacy, soundfile, julius, einops, huggingface_hub]
  patterns: [standalone-scripts, cuda-gate-pattern, json-output-logging]

key-files:
  created:
    - scripts/verify_install.py
    - scripts/test_inference.py
    - scripts/setup_remote.sh
    - .gitignore
  modified: []

key-decisions:
  - "Scripts are fully self-contained with no project imports, designed to run on ephemeral GPU pods"
  - "JSON output captures all inference metadata needed for Phase 2 planning"

patterns-established:
  - "CUDA gate: check torch.cuda.is_available() and exit(1) before any GPU work"
  - "Section-delimited output: === SECTION === format for clear log parsing"
  - "Machine-readable JSON alongside human-readable console output"

requirements-completed: [MODL-01, MODL-02]

# Metrics
duration: 3min
completed: 2026-04-07
---

# Phase 1 Plan 1: Model Setup Scripts Summary

**Three self-contained scripts for TRIBE v2 GPU setup, dependency verification, and inference validation with JSON output logging**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-07T22:29:48Z
- **Completed:** 2026-04-07T22:32:42Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Created project .gitignore covering ML artifacts, test videos, cache, and environment files
- Built verify_install.py that checks all 13 required TRIBE v2 packages, CUDA availability, and numpy 2.2.6 pin
- Built setup_remote.sh that automates full environment setup on a fresh Ubuntu GPU machine (PyTorch CUDA first, then tribev2 from source)
- Built test_inference.py that runs the full TribeModel API (from_pretrained -> get_events_dataframe -> predict), logs output shapes/dtypes/ranges, GPU memory, timing, and writes machine-readable JSON

## Task Commits

Each task was committed atomically:

1. **Task 1: Create project .gitignore and directory structure** - `077259c` (chore)
2. **Task 2: Create installation verification and remote setup scripts** - `82f938f` (feat)
3. **Task 3: Create inference test script** - `9730d7b` (feat)

## Files Created/Modified
- `.gitignore` - Python, ML artifacts, test videos, IDE, OS, env exclusions
- `scripts/.gitkeep` - Scripts directory placeholder
- `test_videos/.gitkeep` - Test videos directory placeholder
- `cache/.gitkeep` - HuggingFace model cache directory placeholder
- `docs/.gitkeep` - Documentation directory placeholder
- `scripts/verify_install.py` - Checks all 13 TRIBE v2 deps, CUDA, numpy pin (136 lines)
- `scripts/setup_remote.sh` - Automated GPU environment setup with HF_TOKEN support (84 lines)
- `scripts/test_inference.py` - Full inference test with JSON output logging (258 lines)

## Decisions Made
- Scripts are standalone with no project imports, designed for ephemeral GPU pod execution
- test_inference.py writes JSON output to docs/inference_output.json for machine-readable Phase 2 consumption
- setup_remote.sh accepts HF_TOKEN as CLI argument but never logs the value (T-01-02 threat mitigation)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- cache/.gitkeep required `git add -f` because cache/ is in .gitignore. Used force-add to keep the directory tracked while ignoring its contents.

## User Setup Required
None - no external service configuration required. Scripts are ready to execute on a remote GPU machine.

## Next Phase Readiness
- All three scripts ready for execution on a RunPod GPU Pod or similar environment
- User needs to: (1) spin up a GPU machine, (2) clone the repo, (3) run `bash scripts/setup_remote.sh`, (4) download a test video, (5) run `python scripts/test_inference.py`
- JSON output from test_inference.py will inform Phase 2 output format mapping

## Self-Check: PASSED

All 9 files verified present. All 3 task commits verified in git log.

---
*Phase: 01-model-setup*
*Completed: 2026-04-07*
