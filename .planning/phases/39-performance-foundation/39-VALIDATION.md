---
phase: 39
slug: performance-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-10
---

# Phase 39 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if configured) / manual browser verification |
| **Config file** | web/vitest.config.ts or "none — Wave 0 installs" |
| **Quick run command** | `cd web && npx next build` |
| **Full suite command** | `cd web && npx next build && npx tsc --noEmit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd web && npx next build`
- **After every plan wave:** Run `cd web && npx next build && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 39-01-01 | 01 | 1 | PERF-01 | — | N/A | build | `cd web && npx next build` | ✅ | ⬜ pending |
| 39-01-02 | 01 | 1 | PERF-01 | — | N/A | build | `cd web && npx next build` | ✅ | ⬜ pending |
| 39-01-03 | 01 | 1 | PERF-03 | — | N/A | build | `cd web && npx next build` | ✅ | ⬜ pending |
| 39-01-04 | 01 | 1 | PERF-03 | — | N/A | manual | Browser FPS check | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 60fps during video playback | PERF-03 | Performance is runtime-only | Play video, observe brain viewer FPS in browser devtools |
| Video-to-brain sync accuracy | PERF-03 | Requires video playback | Seek video, verify brain colors update at display refresh rate |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
