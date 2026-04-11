---
phase: 44-social-schema-identity-foundation
fixed_at: 2026-04-11T18:45:00Z
review_path: .planning/phases/44-social-schema-identity-foundation/44-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 44: Code Review Fix Report

**Fixed at:** 2026-04-11T18:45:00Z
**Source review:** .planning/phases/44-social-schema-identity-foundation/44-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: `citext` + lowercase regex constraint is inconsistent — mixed-case usernames can be stored

**Files modified:** `web/supabase/migrations/00004_create_profiles_table.sql`
**Commit:** e0dad90
**Applied fix:** Changed CHECK constraint to use `lower(username::text) ~ '^[a-z0-9_]+$'` and `length(username::text)` so the regex is always applied to the lowercase form regardless of citext semantics.

### WR-04: `username` CHECK constraint regex does not anchor properly for `citext` pattern matching

**Files modified:** `web/supabase/migrations/00004_create_profiles_table.sql`
**Commit:** e0dad90
**Applied fix:** Resolved together with CR-01 -- the `lower(username::text)` cast ensures the explicit `~` operator always matches against a lowercase string, eliminating the citext/case-sensitive operator mismatch.

### WR-01: Silent non-atomic backfill — existing users with no profile row will never get one

**Files modified:** `web/src/app/api/profile/route.ts`
**Commit:** c6db78c
**Applied fix:** Changed the profile PATCH handler from `.update()` to `.upsert()` with `id`, `username`, and `updated_at` fields, so a missing profile row is created on first write rather than silently failing.

### WR-02: Sending `username: undefined` silently clears the username

**Files modified:** `web/src/app/api/profile/route.ts`
**Commit:** 0a921bb
**Applied fix:** Added explicit check for `body.username === undefined` returning 400. Restructured the handler to clearly separate three paths: absent field (400 error), null value (clear username), and string value (set username).

### WR-03: "Save Changes" button in Profile Information section has no submit handler

**Files modified:** `web/src/app/(app)/settings/SettingsForm.tsx`
**Commit:** 9c1a8a7
**Applied fix:** Removed the uncontrolled Display Name input field and the non-functional "Save Changes" button. Added a TODO comment to wire up Display Name editing when the backend supports it.

---

_Fixed: 2026-04-11T18:45:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
