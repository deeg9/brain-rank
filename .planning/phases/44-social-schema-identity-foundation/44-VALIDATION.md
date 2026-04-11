---
phase: 44
slug: social-schema-identity-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 44 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Next.js API routes (manual curl/fetch verification) + Supabase SQL |
| **Config file** | none — no test framework for SQL migrations |
| **Quick run command** | `cd web && npx tsc --noEmit` |
| **Full suite command** | `cd web && npx tsc --noEmit && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd web && npx tsc --noEmit`
- **After every plan wave:** Run `cd web && npx tsc --noEmit && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 44-01-01 | 01 | 1 | PROF-01 | — | profiles table created with citext username | migration | `supabase db push` | ❌ W0 | ⬜ pending |
| 44-01-02 | 01 | 1 | PROF-01 | — | RLS policies enforce read-any, write-own | migration | `supabase db push` | ❌ W0 | ⬜ pending |
| 44-01-03 | 01 | 1 | PROF-01 | — | is_public column on jobs with public read RLS | migration | `supabase db push` | ❌ W0 | ⬜ pending |
| 44-02-01 | 02 | 2 | PROF-01 | — | Username validation enforces [a-z0-9_] 3-20 chars | unit | `cd web && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 44-02-02 | 02 | 2 | PROF-01 | — | Availability check API route returns correct status | api | `curl localhost:3000/api/username/check` | ❌ W0 | ⬜ pending |
| 44-02-03 | 02 | 2 | PROF-01 | — | Settings form saves username to profiles table | integration | manual browser test | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (Supabase migrations + Next.js API routes).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Username claiming in settings UI | PROF-01 | Requires browser interaction | 1. Navigate to /settings 2. Enter username 3. Verify availability check appears 4. Submit and verify save |
| Dashboard banner for unclaimed username | PROF-01 | Visual UI check | 1. Log in as user without username 2. Verify banner appears on dashboard 3. Click link, verify redirect to settings |
| Case-insensitive uniqueness | PROF-01 | Requires two accounts | 1. Claim "TestUser" on account A 2. Try claiming "testuser" on account B 3. Verify rejection |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
