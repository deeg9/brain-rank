---
phase: 44-social-schema-identity-foundation
reviewed: 2026-04-11T18:30:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - web/src/app/(app)/dashboard/page.tsx
  - web/src/app/(app)/settings/page.tsx
  - web/src/app/(app)/settings/SettingsForm.tsx
  - web/src/app/api/profile/route.ts
  - web/src/app/api/username/check/route.ts
  - web/src/lib/database.types.ts
  - web/supabase/migrations/00004_create_profiles_table.sql
  - web/supabase/migrations/00005_add_is_public_to_jobs.sql
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 44: Code Review Report

**Reviewed:** 2026-04-11T18:30:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This phase introduces the social identity foundation: a `profiles` table with username support, `is_public` on jobs, two API routes (profile PATCH and username availability GET), and UI in the settings form and dashboard. The overall implementation is solid — RLS is enabled, the schema CHECK constraint reinforces application-layer validation, and the username availability check correctly excludes the current user's own row.

One critical issue exists: the `citext` username CHECK constraint uses a lowercase regex (`^[a-z0-9_]+$`) but `citext` comparisons are case-insensitive, so a user could store `"Admin"` and the constraint would pass. Additionally, there are four warnings: a non-atomic profile upsert that can silently miss rows introduced before the trigger, an unguarded silent clear of usernames in the API, a dead "Save Changes" button that has no submit handler, and a display-name field that is rendered but never persisted.

---

## Critical Issues

### CR-01: `citext` + lowercase regex constraint is inconsistent — mixed-case usernames can be stored

**File:** `web/supabase/migrations/00004_create_profiles_table.sql:15-20`
**Issue:** The column type is `citext` (case-insensitive text), but the CHECK constraint regex is `'^[a-z0-9_]+$'`. In PostgreSQL, `~` pattern matching against a `citext` value is case-sensitive by default — so `"Admin"`, `"ADMIN"`, and `"admin"` all satisfy the lowercase regex check AND all compare as equal via `citext` uniqueness, but only `"admin"` actually matches the regex. This means a direct SQL insert of `"Admin"` bypasses the format guard while still consuming the `"admin"` uniqueness slot. The application-layer normalisation (`toLowerCase()`) is the only thing preventing this today; any direct DB access or future admin tooling would be exposed.

**Fix:** Use `lower(username::text)` in the constraint so it is always applied to the lowercase form, independent of column type:
```sql
CONSTRAINT username_format CHECK (
  username IS NULL OR (
    length(username::text) BETWEEN 3 AND 20
    AND lower(username::text) ~ '^[a-z0-9_]+$'
  )
)
```
Alternatively, change the column to plain `text` (not `citext`) and add a normalising trigger or generated column that forces lowercase on write. Using `citext` alongside a lowercase-only constraint is semantically redundant and confusing.

---

## Warnings

### WR-01: Silent non-atomic backfill — existing users with no profile row will never get one

**File:** `web/supabase/migrations/00004_create_profiles_table.sql:58-61`
**Issue:** The migration creates the `on_auth_user_created` trigger *and* runs a one-time `INSERT … ON CONFLICT DO NOTHING` backfill in the same migration. However, the trigger fires `AFTER INSERT ON auth.users`, which means any `auth.users` row created in the window between a prior migration run and this migration's execution — for instance, during a failed partial migration replay — will not have a profile row. More practically: the `profiles` table is queried with `.single()` in both `settings/page.tsx:26` and `dashboard/page.tsx:81` but without error checking. If a profile row is absent (race or missed backfill), `.single()` returns `{ data: null, error: PGRST116 }`. The code silently treats `null` as "no username set", which is harmless for now, but will cause silent failures for any future `INSERT`-style operations that assume the row exists (the PATCH route does `update()`, not `upsert()`).

**Fix:** Change `profile/route.ts` PATCH to use `upsert` so a missing row is created on first write:
```typescript
const { data, error } = await supabase
  .from('profiles')
  .upsert({ id: user.id, username: normalized, updated_at: new Date().toISOString() })
  .select()
  .single()
```
This eliminates the dependency on the trigger having fired correctly.

### WR-02: Sending `username: undefined` silently clears the username

**File:** `web/src/app/api/profile/route.ts:14-56`
**Issue:** The PATCH handler checks `if (username !== undefined && username !== null)` to decide whether to clear the username. Any malformed request body (e.g., `{}`, missing `username` key) falls through to the else branch on line 44-56 and sets `username = null` on the profile. This is a destructive side-effect of a likely client bug or network retry. The intent appears to be "only update username when explicitly provided", not "clear username when key is absent".

**Fix:** Return a 400 if `username` is absent rather than treating absence as an intent to clear:
```typescript
const body = await request.json() as { username?: string }

if (body.username === undefined) {
  return NextResponse.json({ error: 'username is required' }, { status: 400 })
}

// null means "clear username", string means "set username"
const username = body.username
```
If clearing the username is genuinely a supported operation, add an explicit `clearUsername: true` flag rather than relying on key absence.

### WR-03: "Save Changes" button in Profile Information section has no submit handler

**File:** `web/src/app/(app)/settings/SettingsForm.tsx:243-245`
**Issue:** The `Save Changes` button at line 243 renders inside a `<div>` (not a `<form>`) and has no `onClick` handler. Clicking it does nothing. The Display Name field at line 224-229 uses `defaultValue` (uncontrolled) and is never read or submitted. Users who update their display name and click "Save Changes" receive no feedback and their change is silently discarded.

**Fix:** Either wire up a submit handler that calls the `/api/profile` route with the display name value, or remove the Display Name field and "Save Changes" button until the feature is implemented. Leaving a non-functional save button is a UX bug that will confuse users:
```typescript
// Controlled version
const [displayName, setDisplayName] = useState(props.displayName)

async function handleSaveProfile() {
  const res = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ display_name: displayName }),
  })
  // handle response...
}
```

### WR-04: `username` CHECK constraint regex does not anchor properly for `citext` pattern matching

**File:** `web/supabase/migrations/00004_create_profiles_table.sql:18`
**Issue:** `username ~ '^[a-z0-9_]+$'` — while functionally correct for ASCII, `citext` uses the `~*` operator (case-insensitive regex match) for its implicit comparisons, but the explicit `~` used in the constraint is the case-sensitive operator. The mismatch between the column type semantics and the constraint operator creates a subtle inconsistency: the constraint enforces lowercase-only literally, but the column can store and retrieve any-case value that happens to already be lowercase. This is a narrower restatement of CR-01 from the constraint-operator perspective.

**Fix:** Use `~*` consistently or, better, resolve by applying CR-01's fix (cast to `lower(username::text)` before the regex test).

---

## Info

### IN-01: Credits Remaining is hardcoded to 250

**File:** `web/src/app/(app)/dashboard/page.tsx:142`
**Issue:** `value="250"` is a magic literal. This will show 250 for all users regardless of actual credit balance, which could mislead users who have consumed credits.

**Fix:** Until a credits system is implemented, label the field "Credits" and render a placeholder like `"--"` or fetch from a credits table. Add a `// TODO: wire to credits table` comment to flag this as intentionally incomplete.

### IN-02: `handle_new_user` trigger function uses `SECURITY DEFINER` without a `search_path`

**File:** `web/supabase/migrations/00004_create_profiles_table.sql:24-31`
**Issue:** `SECURITY DEFINER` functions run with the privileges of the defining role. Without an explicit `SET search_path = public` (or the relevant schema), a malicious user who can create objects in a schema earlier in the search path could shadow `public.profiles` and intercept the insert. This is a PostgreSQL security best practice.

**Fix:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### IN-03: `username/check` route returns `500` internal server error body on DB error but error is silently swallowed by the client

**File:** `web/src/app/(app)/settings/SettingsForm.tsx:96-98` / `web/src/app/api/username/check/route.ts:68-70`
**Issue:** When the check route's DB query throws, the client `catch` block at line 96 sets `availability` to `null` and clears `checking`. The UI shows no feedback to the user — the availability indicator simply disappears. For a transient network or DB error this leaves the Save button in a potentially-enabled state (if `availability` was previously `available: true`) or disabled (if it was null before). The button's disabled logic at line 207-213 does not distinguish between "never checked" and "check failed".

**Fix:** Introduce a distinct `error` state for the availability check so the UI can render "Could not verify username — try again" rather than silently resetting:
```typescript
const [availabilityError, setAvailabilityError] = useState(false)

// in catch block:
setAvailabilityError(true)
setAvailability(null)
```

---

_Reviewed: 2026-04-11T18:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
