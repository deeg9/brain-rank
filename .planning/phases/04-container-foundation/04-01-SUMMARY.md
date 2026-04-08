---
phase: 04-container-foundation
plan: 01
subsystem: infra
tags: [docker, cuda, pytorch, tribev2, runpod, containerization]

requires:
  - phase: 01-model-setup
    provides: "Proven install sequence (PyTorch -> TRIBE v2 -> spaCy) and dependency conflict discovery"
  - phase: 02-output-mapping
    provides: "Pre-computed region_masks.npz and region_mapping package for container inclusion"
provides:
  - "Dockerfile with nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04 base and proven install order"
  - ".dockerignore for lean build context"
  - "Container verification script (scripts/verify_container.py) checking 23 dependency items"
  - "HF_TOKEN plumbing for gated model access at build and runtime"
affects: [05-container-build, 06-handler, 07-deployment]

tech-stack:
  added: [nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04, runpod==1.8.2, uv]
  patterns: [proven-install-order, hf-token-arg-env-pattern, container-verification]

key-files:
  created:
    - Dockerfile
    - .dockerignore
    - scripts/verify_container.py
  modified: []

key-decisions:
  - "Install order encoded as PyTorch -> TRIBE v2 -> uv -> spaCy -> RunPod SDK (mirrors Phase 1 setup_remote.sh)"
  - "uv installed instead of whisperx directly to avoid torch version corruption"
  - "HF_TOKEN as both ARG (build-time) and ENV (runtime) for flexible gated model access"
  - "CUDA availability check is non-critical in verification script (allows CPU-only Docker builds)"

patterns-established:
  - "Proven install order: Always install PyTorch with explicit CUDA wheels before TRIBE v2"
  - "Container verification: Run verify_container.py as default CMD to validate dependencies"
  - "Secret safety: Never print HF_TOKEN value, only check presence and auth status"

requirements-completed: [CNTR-01, CNTR-02, CNTR-03]

duration: 2min
completed: 2026-04-08
---

# Phase 4 Plan 1: Container Foundation Summary

**Dockerfile with proven PyTorch-first install order, .dockerignore, and 23-check container verification script**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-08T23:26:58Z
- **Completed:** 2026-04-08T23:29:20Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- Dockerfile encodes the proven install sequence discovered in Phase 1 (PyTorch 2.6.0+cu124 before TRIBE v2) to prevent the WhisperX/torch dependency conflict
- HF_TOKEN plumbed as ARG for optional build-time model pre-download and ENV for runtime gated model access (LLaMA 3.2)
- Container verification script checks 23 items across 10 categories with clear PASS/FAIL output and appropriate exit codes
- .dockerignore excludes .git, .planning, .venv, test_videos, docs, and other development artifacts

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Dockerfile and .dockerignore** - `f6e8060` (feat)
2. **Task 2: Create container verification script** - `0c2b282` (feat)

## Files Created/Modified
- `Dockerfile` - Container build definition with nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04 base, proven install order, HF_TOKEN support
- `.dockerignore` - Excludes development/planning artifacts from Docker build context
- `scripts/verify_container.py` - Comprehensive 23-check verification script for all TRIBE v2 dependencies

## Decisions Made
- Installed uv package (not whisperx) -- TRIBE v2 invokes WhisperX via uvx at runtime, avoiding the torch 2.6->2.8 replacement bug
- Made CUDA GPU availability a non-critical check in verify_container.py -- containers may be built and tested without GPU, Phase 5 validates with GPU
- HF_TOKEN uses both ARG and ENV pattern per threat model T-04-01 -- ARG for build-time conditional login, ENV for runtime access

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dockerfile is ready for Phase 5 to build and test with GPU
- verify_container.py serves as the build validation gate
- Container expects data/region_masks.npz and src/region_mapping/ to be present (both exist)
- Phase 6 will replace the default CMD with the RunPod handler

## Self-Check: PASSED

All 3 created files verified on disk. Both task commits (f6e8060, 0c2b282) verified in git history.

---
*Phase: 04-container-foundation*
*Completed: 2026-04-08*
