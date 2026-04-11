# Phase 44: Social Schema & Identity Foundation - Research

**Researched:** 2026-04-11
**Domain:** Supabase PostgreSQL schema design, Next.js API routes, React form UX
**Confidence:** HIGH

## Summary

This phase creates the foundational database schema for social features (profiles table, is_public on jobs) and the username claiming UX in settings. The technical domain is well-understood: Supabase PostgreSQL with RLS, citext extension for case-insensitive uniqueness, a database trigger for auto-creating profile rows, and a Next.js API route for username availability checking.

The codebase already has established patterns for Supabase auth, RLS policies, API routes, and the settings page structure. This phase extends those patterns directly -- no new libraries or unfamiliar technology required.

**Primary recommendation:** Follow existing migration and API route patterns exactly. The citext extension and trigger-based profile creation are the only PostgreSQL features not yet used in this codebase.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Username claiming happens on the settings page (add field to existing SettingsForm)
- Availability checking uses debounced real-time API calls (500ms debounce, `/api/username/check` route)
- Existing users without usernames see a soft prompt banner on dashboard linking to settings
- Validation feedback shown inline below the username input field
- Allowed characters: lowercase alphanumeric + underscores `[a-z0-9_]`, auto-lowercase input
- Reserve ~20 common names (admin, api, settings, help, support, discover, profile, etc.) via static blocklist
- Usernames can be changed after claiming (unlimited changes for v4.0)
- Length: 3-20 characters
- Profile row auto-created via database trigger on auth.users insert (guarantees 1:1 relationship)
- Use citext extension for case-insensitive username uniqueness
- Username availability check API route requires authentication (prevents bot enumeration)
- is_public column added to jobs table via separate migration file (00004_add_is_public_to_jobs.sql)

### Claude's Discretion
None -- all decisions captured above.

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROF-01 | User can claim a unique username (case-insensitive, citext) | Profiles table with citext username, RLS policies, availability check API, SettingsForm username field, dashboard banner prompt |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.103.0 | Database client | Already in project [VERIFIED: package.json] |
| @supabase/ssr | ^0.10.2 | Server-side Supabase | Already in project [VERIFIED: package.json] |
| next | 16.2.3 | Framework / API routes | Already in project [VERIFIED: package.json] |
| react | 19.2.4 | UI | Already in project [VERIFIED: package.json] |

### Supporting
No new libraries needed. All functionality is covered by existing dependencies.

**Installation:**
```bash
# No new packages required
```

## Architecture Patterns

### Migration File Structure
```
web/supabase/migrations/
  00001_create_jobs_table.sql        # existing
  00002_add_runpod_id_to_jobs.sql    # existing
  00003_add_title_to_jobs.sql        # existing
  00004_create_profiles_table.sql    # NEW - profiles table + trigger
  00005_add_is_public_to_jobs.sql    # NEW - is_public column on jobs
```

### Pattern 1: Profiles Table with citext and Auto-Creation Trigger
**What:** A profiles table linked 1:1 to auth.users, with citext username for case-insensitive uniqueness, auto-created via trigger on user signup.
**When to use:** When every authenticated user needs a profile row guaranteed to exist.
**Example:**
```sql
-- Source: Supabase docs + existing project patterns [VERIFIED: codebase]
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username citext UNIQUE,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT username_format CHECK (
    username IS NULL OR (
      length(username) BETWEEN 3 AND 20
      AND username ~ '^[a-z0-9_]+$'
    )
  )
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Key details on citext:**
- citext is a PostgreSQL extension that stores text case-preservingly but compares case-insensitively [VERIFIED: PostgreSQL docs]
- `CREATE EXTENSION IF NOT EXISTS citext` must run before creating the table
- The UNIQUE constraint on a citext column automatically prevents "Diego" and "diego" from coexisting
- No need for LOWER() in queries -- citext handles it transparently
- Supabase supports citext out of the box; it just needs to be enabled [ASSUMED]

### Pattern 2: RLS Policies for Profiles
**What:** Allow anyone to read profiles (needed for public profile pages in future phases) but only owners can update.
**Example:**
```sql
-- Source: existing RLS pattern in 00001_create_jobs_table.sql [VERIFIED: codebase]
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read any profile
CREATE POLICY "Anyone can view profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- No direct insert policy -- trigger handles creation
-- No delete policy -- profiles are deleted via CASCADE from auth.users
```

### Pattern 3: is_public on Jobs with Public Read RLS
**What:** Add is_public boolean to jobs table with a new RLS policy allowing unauthenticated read of public jobs.
**Example:**
```sql
-- Source: existing jobs table pattern [VERIFIED: codebase]
ALTER TABLE public.jobs ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Allow anyone to read public jobs (no auth required)
CREATE POLICY "Anyone can view public jobs"
  ON public.jobs
  FOR SELECT
  USING (is_public = true);
```

**Important:** This new policy coexists with the existing "Users can view own jobs" policy. PostgreSQL RLS uses OR logic across policies -- a row is visible if ANY policy grants access. So owners see all their jobs (via existing policy) and anyone sees public jobs (via new policy). [VERIFIED: PostgreSQL RLS docs]

### Pattern 4: Username Availability Check API Route
**What:** Authenticated API route that checks if a username is available, returning status and reason.
**Example:**
```typescript
// Source: existing API route pattern in web/src/app/api/jobs/route.ts [VERIFIED: codebase]
// web/src/app/api/username/check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RESERVED_USERNAMES = new Set([
  'admin', 'api', 'settings', 'help', 'support', 'discover',
  'profile', 'login', 'signup', 'dashboard', 'upload', 'results',
  'about', 'terms', 'privacy', 'billing', 'account', 'user',
  'users', 'public'
])

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const username = request.nextUrl.searchParams.get('username')?.toLowerCase()
  if (!username) {
    return NextResponse.json({ available: false, reason: 'Username required' })
  }

  // Validate format
  if (username.length < 3 || username.length > 20) {
    return NextResponse.json({ available: false, reason: 'Must be 3-20 characters' })
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false, reason: 'Only lowercase letters, numbers, and underscores' })
  }

  // Check reserved
  if (RESERVED_USERNAMES.has(username)) {
    return NextResponse.json({ available: false, reason: 'This username is reserved' })
  }

  // Check database (citext handles case-insensitivity)
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)  // Exclude current user (re-claiming own username)
    .maybeSingle()

  return NextResponse.json({
    available: !data,
    reason: data ? 'Username is already taken' : null
  })
}
```

### Pattern 5: Debounced Username Input in SettingsForm
**What:** Client-side username field with 500ms debounce for availability checking.
**Example:**
```typescript
// Key pattern -- debounce with useEffect cleanup
const [username, setUsername] = useState('')
const [checking, setChecking] = useState(false)
const [availability, setAvailability] = useState<{available: boolean, reason: string | null} | null>(null)

useEffect(() => {
  if (username.length < 3) {
    setAvailability(null)
    return
  }
  setChecking(true)
  const timer = setTimeout(async () => {
    const res = await fetch(`/api/username/check?username=${encodeURIComponent(username)}`)
    const data = await res.json()
    setAvailability(data)
    setChecking(false)
  }, 500)
  return () => { clearTimeout(timer); setChecking(false) }
}, [username])
```

### Anti-Patterns to Avoid
- **Using LOWER() instead of citext:** Do not use `WHERE LOWER(username) = LOWER($1)`. This prevents index usage and is error-prone. citext handles it at the type level. [CITED: PostgreSQL citext docs]
- **Client-only validation:** The CHECK constraint on the profiles table must mirror client-side rules. Never rely solely on frontend validation.
- **Separate profile creation flow:** Do NOT require users to "create" a profile manually. The trigger ensures the row exists from signup. The username field is just an UPDATE.
- **Forgetting SECURITY DEFINER on trigger function:** The handle_new_user trigger runs during auth signup -- it needs SECURITY DEFINER to write to the profiles table since the user doesn't have direct INSERT permission.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Case-insensitive uniqueness | Custom LOWER() indexes and checks | PostgreSQL citext extension | Handles comparison, indexing, and constraints transparently |
| Debounce logic | Custom debounce utility function | setTimeout + useEffect cleanup pattern | React idiom, no library needed for a single use case |
| Profile creation flow | Manual "create profile" step | Database trigger on auth.users INSERT | Guarantees 1:1 relationship, no orphan states |

## Common Pitfalls

### Pitfall 1: citext Extension Not Enabled
**What goes wrong:** CREATE TABLE fails because citext type is unknown.
**Why it happens:** citext is an extension that must be explicitly enabled in each database.
**How to avoid:** `CREATE EXTENSION IF NOT EXISTS citext;` as the first line of the migration.
**Warning signs:** Error message mentioning "type citext does not exist".

### Pitfall 2: Trigger Function Missing SECURITY DEFINER
**What goes wrong:** New user signups fail silently or the profile row is not created.
**Why it happens:** The trigger fires in the context of the auth schema, which may not have INSERT permission on public.profiles.
**How to avoid:** Add `SECURITY DEFINER` to the trigger function definition.
**Warning signs:** Users exist in auth.users but have no row in profiles.

### Pitfall 3: RLS Policy OR-Logic Confusion
**What goes wrong:** Adding "Anyone can view public jobs" policy accidentally exposes private job data, or developer thinks policies are AND-combined.
**Why it happens:** PostgreSQL evaluates all RLS policies with OR logic -- if ANY policy grants access, the row is visible.
**How to avoid:** The public read policy (`USING (is_public = true)`) is safe because it only grants access to rows where is_public is true. Private rows remain protected. Verify by testing: can an unauthenticated user see a job with is_public=false?
**Warning signs:** None expected if implemented correctly, but always test.

### Pitfall 4: Existing Users Without Profile Rows
**What goes wrong:** The trigger only fires for NEW signups. Existing users in auth.users won't have profile rows.
**Why it happens:** Trigger is AFTER INSERT -- it doesn't backfill.
**How to avoid:** Add a backfill statement at the end of the migration:
```sql
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;
```
**Warning signs:** Supabase queries for profile data return null for existing users.

### Pitfall 5: Race Condition on Username Claim
**What goes wrong:** Two users check the same username simultaneously, both get "available", both try to claim.
**Why it happens:** Check-then-act is inherently racy.
**How to avoid:** The UNIQUE constraint on profiles.username ensures only one succeeds. The loser gets a database error. Handle this in the update API by catching the unique violation and returning a user-friendly message.
**Warning signs:** Unhandled 500 errors on profile update.

## Code Examples

### Username Save Handler (API Route)
```typescript
// web/src/app/api/profile/route.ts
// Source: existing API patterns [VERIFIED: codebase]
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { username } = body as { username?: string }

  // Server-side validation (mirrors client + CHECK constraint)
  if (username !== undefined && username !== null) {
    const lower = username.toLowerCase()
    if (lower.length < 3 || lower.length > 20 || !/^[a-z0-9_]+$/.test(lower)) {
      return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ username: username?.toLowerCase() ?? null })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

### Database Types Update
```typescript
// Addition to web/src/lib/database.types.ts
export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual testing via browser + Supabase dashboard |
| Config file | none |
| Quick run command | `cd web && npm run build` (type-check + build) |
| Full suite command | `cd web && npm run build` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01a | Profiles table exists with correct columns | manual | Verify in Supabase dashboard SQL editor | N/A |
| PROF-01b | Username uniqueness is case-insensitive | manual | Test via SQL: INSERT two rows with 'Test' and 'test' | N/A |
| PROF-01c | Availability check API returns correct results | manual | `curl` the API endpoint with auth token | N/A |
| PROF-01d | Username input with debounced checking works in UI | manual | Browser test on /settings page | N/A |
| PROF-01e | RLS allows read any profile, update only own | manual | Test via Supabase client with different users | N/A |
| PROF-01f | is_public column exists on jobs, default false | manual | Check via SQL after migration | N/A |
| PROF-01g | Public jobs readable by anyone | manual | Test RLS with anon key | N/A |

### Sampling Rate
- **Per task commit:** `cd web && npm run build` (catches TypeScript errors)
- **Per wave merge:** Build + manual browser verification
- **Phase gate:** All manual test cases verified

### Wave 0 Gaps
- No automated test framework is set up in the project currently
- All validation is manual (build checks + browser testing + SQL verification)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase auth (existing) -- API routes check auth.getUser() |
| V3 Session Management | no | Handled by Supabase SSR (existing) |
| V4 Access Control | yes | RLS policies on profiles and jobs tables |
| V5 Input Validation | yes | CHECK constraint + server-side regex + client-side validation |
| V6 Cryptography | no | No crypto operations in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Username enumeration via availability check | Information Disclosure | Require authentication for /api/username/check |
| Mass username squatting | Denial of Service | Rate limiting (not in v4.0 scope, but auth requirement reduces risk) |
| SQL injection via username | Tampering | Parameterized queries via Supabase client + CHECK constraint |
| IDOR on profile update | Elevation of Privilege | RLS policy: `auth.uid() = id` on UPDATE |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase supports citext extension out of the box | Architecture Patterns | LOW -- citext is a core PostgreSQL extension, unlikely to be disabled. Can verify by running CREATE EXTENSION in SQL editor |
| A2 | PostgreSQL error code 23505 is returned for unique constraint violations via Supabase client | Code Examples | LOW -- this is standard PostgreSQL. If Supabase wraps it differently, the error.code field may differ |

## Open Questions (RESOLVED)

1. **Existing user backfill** — RESOLVED: Backfill INSERT included in migration (`INSERT INTO profiles (id) SELECT id FROM auth.users ON CONFLICT (id) DO NOTHING`). Safe regardless of user count.

2. **Anonymous access to public jobs** — RESOLVED: RLS policy `USING (is_public = true)` does not reference `auth.uid()`, so it works for anon-key queries. Manual verification after migration is recommended but not blocking.

## Sources

### Primary (HIGH confidence)
- Project codebase -- existing migration patterns (00001_create_jobs_table.sql), API route patterns (jobs/route.ts), SettingsForm component, database types
- PostgreSQL documentation -- citext extension behavior, RLS OR-logic for multiple policies

### Secondary (MEDIUM confidence)
- Supabase documentation patterns -- trigger-based profile creation is a well-documented Supabase pattern

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing dependencies
- Architecture: HIGH -- well-established Supabase patterns, codebase has clear precedents
- Pitfalls: HIGH -- PostgreSQL behavior is well-documented

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable domain, no fast-moving dependencies)
