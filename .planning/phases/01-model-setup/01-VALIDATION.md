---
phase: 1
slug: model-setup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.x (or manual script validation) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `python scripts/test_inference.py` |
| **Full suite command** | `python scripts/test_inference.py` |
| **Estimated runtime** | ~120 seconds (includes model load + inference) |

---

## Sampling Rate

- **After every task commit:** Run `python scripts/test_inference.py`
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | MODL-01 | — | N/A | integration | `pip install "tribev2 @ git+https://github.com/facebookresearch/tribev2.git" && python -c "from tribe.model import TribeModel; print('OK')"` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | MODL-02 | — | N/A | integration | `python scripts/test_inference.py` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/test_inference.py` — inference test script that loads model and runs on test video
- [ ] Test video file — 60-second video for inference validation

*Note: This phase runs on remote GPU (RunPod pod or Colab). Scripts are written locally, executed remotely.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Model loads all sub-models on GPU | MODL-02 | Requires NVIDIA GPU not available locally | SSH into RunPod pod, run test script, verify CUDA usage |
| Raw output tensor shape logged | MODL-02 | Visual verification of output format | Check script output for shape (n_timesteps, 20484) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
