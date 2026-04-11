# Architecture Patterns: Social Discovery Platform

**Domain:** Social discovery layer on top of existing private neural analysis tool
**Researched:** 2026-04-11

## Existing Architecture Snapshot

Before defining new architecture, here is what exists today:

```
web/
  src/
    app/
      (auth)/          -- login, signup, forgot-password (public)
      (app)/           -- dashboard, upload, processing, results/[id], profile, settings (auth-gated)
      api/jobs/        -- POST (create), GET/PATCH [id], status polling, retry
    components/        -- results/, layout/, ui/, upload/, hero/
    lib/
      supabase/        -- server.ts, client.ts, middleware.ts
      database.types.ts -- Job interface only
      upload.ts        -- Supabase Storage upload to 'videos' bucket
  middleware.ts        -- Auth redirect: unauthed -> /login, authed on /login -> /dashboard
```

**Current DB schema:** Single `jobs` table with `user_id`, `video_url`, `title`, `status`, `runpod_id`, `results`, `error_message`, timestamps. RLS filters by `user_id` (owner-only access).

**Key pattern:** Server components fetch data via Supabase server client. Client components fetch via `/api/jobs/[id]`. No public-facing data paths exist.

---

## Recommended Architecture

### High-Level Data Flow

```
EXISTING (private):
  User -> Auth -> Dashboard -> Upload -> Job -> Results (owner only)

NEW (public layer):
  User -> Auth -> Profile Setup (username) -> Toggle analysis public
  Anyone -> /discover -> Browse public analyses -> View /u/[username]/[id]
  Anyone -> /u/[username] -> View public profile + public analyses
```

### New Route Map

| Route | Type | Auth Required | Purpose |
|-------|------|---------------|---------|
| `/discover` | Server Component | NO | Public leaderboard/feed of public analyses |
| `/u/[username]` | Server Component | NO | Public user profile page |
| `/u/[username]/[id]` | Server Component | NO | Public analysis view (read-only results) |
| `/api/profiles/[username]` | API Route | NO (read) / YES (write) | Profile lookup + update |
| `/api/discover` | API Route | NO | Paginated public feed with sorting/filtering |
| `/api/analyses/[id]/visibility` | API Route | YES | Toggle public/private |
| `/api/analyses/[id]/bookmark` | API Route | YES | Add/remove bookmark |
| `/api/analyses/[id]/view` | API Route | NO | Increment view count (fire-and-forget) |

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `profiles` table | User identity (username, display_name, avatar_url, bio) | Referenced by jobs, bookmarks |
| `jobs` table (modified) | Add `is_public`, `view_count`, `bookmark_count` columns | Queried by discover feed, public views |
| `bookmarks` table (new) | User-analysis bookmark relationship | Queried by profile, discover sorting |
| ProfileSetup component | Onboarding flow for username selection | `/api/profiles/[username]` |
| DiscoverFeed component | Public feed with sorting, infinite scroll | `/api/discover` |
| PublicResultsView component | Read-only version of results page | Direct Supabase query (server component) |
| VisibilityToggle component | Public/private switch on analysis cards | `/api/analyses/[id]/visibility` |
| BookmarkButton component | Bookmark toggle on public analyses | `/api/analyses/[id]/bookmark` |

---

## New Database Schema

### Table: `profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enforce lowercase, alphanumeric + underscores, 3-30 chars
ALTER TABLE profiles ADD CONSTRAINT username_format
  CHECK (username ~ '^[a-z0-9_]{3,30}$');

-- Fast lookup by username
CREATE UNIQUE INDEX idx_profiles_username ON profiles(username);
```

**Why a separate table instead of auth.users metadata:** Supabase auth.users is system-managed. You cannot add unique constraints, indexes, or RLS policies to it. A `profiles` table is the standard Supabase pattern for user-facing data. Link via `id` (same UUID as auth.users).

### Columns added to `jobs` table

```sql
ALTER TABLE jobs ADD COLUMN is_public BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN bookmark_count INTEGER DEFAULT 0;

-- Index for discover feed queries
CREATE INDEX idx_jobs_public_created ON jobs(is_public, created_at DESC)
  WHERE is_public = true AND status = 'completed';

-- Index for sorting by score (stored in JSONB)
CREATE INDEX idx_jobs_public_score ON jobs(is_public, ((results->>'overall_score')::float) DESC)
  WHERE is_public = true AND status = 'completed';
```

### Table: `bookmarks`

```sql
CREATE TABLE bookmarks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id, created_at DESC);
```

### View counting approach

Use a simple RPC to increment `jobs.view_count` directly. Skip a separate `view_events` table for now -- it adds complexity without value at the current scale (<1000 users). If deduplication becomes important later, add a `view_events` append-only table with hashed IPs and aggregate via a cron function.

---

## RLS Policies

### profiles

```sql
-- Anyone can read any profile (public pages)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (one-time setup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### jobs (modified policies)

```sql
-- EXISTING: Owner can see all their own jobs
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT USING (auth.uid() = user_id);

-- NEW: Anyone can see public completed jobs
CREATE POLICY "Public completed jobs are viewable by everyone"
  ON jobs FOR SELECT USING (is_public = true AND status = 'completed');

-- EXISTING: Owner can update their own jobs
CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE USING (auth.uid() = user_id);

-- EXISTING: Owner can insert jobs
CREATE POLICY "Users can insert own jobs"
  ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Critical note on RLS OR semantics:** When multiple SELECT policies exist on the same table, Supabase evaluates them with OR. So a query returns rows where EITHER the user owns it OR it is public+completed. An unauthenticated user querying `jobs` will only see public completed ones (auth.uid() is null, so the owner policy fails, public policy succeeds). This is exactly the desired behavior.

### bookmarks

```sql
-- Users can see their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own bookmarks
CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE USING (auth.uid() = user_id);
```

---

## TypeScript Type Changes

### Updated `database.types.ts`

```typescript
export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  user_id: string
  video_url: string
  title: string | null
  status: JobStatus
  runpod_id: string | null
  results: Record<string, unknown> | null
  error_message: string | null
  is_public: boolean        // NEW
  view_count: number        // NEW
  bookmark_count: number    // NEW
  created_at: string
  updated_at: string
}

export interface Bookmark {
  user_id: string
  job_id: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      jobs: { Row: Job; Insert: ...; Update: ... }
      profiles: { Row: Profile; Insert: ...; Update: ... }
      bookmarks: { Row: Bookmark; Insert: ...; Update: ... }
    }
  }
}
```

---

## Middleware Changes

The current middleware redirects ALL unauthenticated users to `/login` except for `/login`, `/signup`, and `/welcome`. The social discovery features require public routes.

```typescript
// middleware.ts - updated route logic
const publicRoutes = ['/login', '/signup', '/forgot-password']
const publicPrefixes = ['/discover', '/u/']  // NEW: public discovery routes

const isPublicRoute = publicRoutes.some(route =>
  request.nextUrl.pathname.startsWith(route)
)
const isPublicPrefix = publicPrefixes.some(prefix =>
  request.nextUrl.pathname.startsWith(prefix)
)
const isWelcomePage = request.nextUrl.pathname === '/welcome'
const isLandingPage = request.nextUrl.pathname === '/'

// Allow unauthenticated access to public routes
if (!user && !isPublicRoute && !isPublicPrefix && !isWelcomePage && !isLandingPage) {
  // redirect to /login
}
```

---

## New Pages Architecture

### Layout Groups

Create a new `(public)` layout group alongside `(app)` and `(auth)`:

```
app/
  (public)/
    layout.tsx          -- Minimal nav (no sidebar), optional auth state
    discover/
      page.tsx          -- Server component: initial data fetch
      DiscoverFeed.tsx  -- Client component: sorting, filtering, infinite scroll
      DiscoverCard.tsx  -- Client component: analysis card with bookmark, view count
    u/
      [username]/
        page.tsx        -- Public profile page
        [id]/
          page.tsx      -- Public analysis view
  (app)/
    ...existing...
```

**Why a separate layout group:** The `(app)` layout wraps everything in `AppShell` (sidebar, auth-gated). Public pages need a different shell -- lighter nav, no sidebar, auth optional. Next.js route groups with `(parentheses)` share no URL segment, so `(public)/discover` maps to `/discover`.

### `/discover` (Discovery/Leaderboard Page)

**Data fetching pattern:**

```typescript
// discover/page.tsx (server component)
export default async function DiscoverPage() {
  const supabase = await createClient()

  const { data: analyses } = await supabase
    .from('jobs')
    .select('*, profiles!inner(username, display_name, avatar_url)')
    .eq('is_public', true)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(20)

  return <DiscoverFeed initialData={analyses} />
}
```

**Sorting options:** Most Recent, Highest Score, Most Viewed, Most Bookmarked. Client-side re-sorting for the initial page; API call for pagination/filter changes.

### `/u/[username]` (Public Profile)

```typescript
// (public)/u/[username]/page.tsx
export default async function PublicProfilePage({ params }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: publicAnalyses } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  return <PublicProfile profile={profile} analyses={publicAnalyses} />
}
```

### `/u/[username]/[id]` (Public Analysis View)

Reuses existing results visualization components in read-only mode:

```typescript
// (public)/u/[username]/[id]/page.tsx
export default async function PublicAnalysisPage({ params }) {
  const { username, id } = await params
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('*, profiles!inner(username)')
    .eq('id', id)
    .eq('is_public', true)
    .eq('status', 'completed')
    .single()

  if (!job || job.profiles.username !== username) notFound()

  // Fire view count increment (non-blocking)
  supabase.rpc('increment_view_count', { p_job_id: id })

  return <PublicResultsView job={job} username={username} />
}
```

---

## API Routes

### `/api/discover` (GET)

Supports: `?sort=recent|score|views|bookmarks&cursor=...&limit=20`

Uses cursor-based pagination (stable under concurrent inserts, performs well). The cursor is the `created_at` timestamp of the last item. Returns `{ items, nextCursor }`.

### `/api/analyses/[id]/visibility` (PATCH)

Owner-only. Toggles `is_public` boolean. Only allows toggling on completed analyses.

### `/api/analyses/[id]/bookmark` (POST/DELETE)

Auth-required. Uses RPC functions for atomic bookmark insert/delete + count update:

```sql
CREATE OR REPLACE FUNCTION add_bookmark(p_user_id UUID, p_job_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO bookmarks (user_id, job_id) VALUES (p_user_id, p_job_id)
    ON CONFLICT DO NOTHING;
  UPDATE jobs SET bookmark_count = (
    SELECT count(*) FROM bookmarks WHERE job_id = p_job_id
  ) WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION remove_bookmark(p_user_id UUID, p_job_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM bookmarks WHERE user_id = p_user_id AND job_id = p_job_id;
  UPDATE jobs SET bookmark_count = (
    SELECT count(*) FROM bookmarks WHERE job_id = p_job_id
  ) WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_view_count(p_job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE jobs SET view_count = view_count + 1
  WHERE id = p_job_id AND is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Profile Onboarding Strategy

**Auto-create profile on signup** via a database trigger:

```sql
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    'user_' || substr(NEW.id::text, 1, 8),  -- temporary username
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();
```

This guarantees every user has a profile row. The temporary `user_abc12345` username prompts them to customize it. Check for temp usernames in the `(app)` layout and show an inline banner.

**Username claim function** (atomic check + update):

```sql
CREATE OR REPLACE FUNCTION claim_username(p_user_id UUID, p_username TEXT)
RETURNS profiles AS $$
DECLARE
  result profiles;
BEGIN
  UPDATE profiles SET username = lower(p_username), updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO result;
  RETURN result;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Username already taken';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Shared Results Component Extraction

The key architectural move: extract visualization from `/results/[id]/page.tsx` into a shared component.

**Current state:** The `ResultsDetailPage` client component (489 lines) mixes:
- Job fetching + polling logic (owner-specific)
- Video-timeline sync state
- Title editing (owner-specific)
- Results visualization (BrainViewer, NeuralTimeline, metrics, circumplex)

**Target extraction:**

```
ResultsDetailPage (owner view, /results/[id])
  |-- Job fetching, polling, title editing, export, share button
  |-- <ResultsVisualization results={...} videoUrl={...} readOnly={false} />

PublicResultsView (public view, /u/[username]/[id])
  |-- Creator attribution, bookmark button, view count
  |-- <ResultsVisualization results={...} videoUrl={...} readOnly={true} />

ResultsVisualization (shared component)
  |-- VideoPlayer + BrainViewer side by side
  |-- NeuralTimeline
  |-- Insights Summary (metrics, circumplex)
  |-- Video-timeline sync state (useVideoTime hook)
```

The `ResultsVisualization` component owns all the video-timeline sync logic (refs, handlers, play state) and all the visualization components. The parent only provides the data and controls whether owner actions are shown.

---

## Patterns to Follow

### Pattern 1: Join via Foreign Keys
Add FK from `jobs.user_id` to `profiles.id` so PostgREST joins work: `jobs.select('*, profiles!inner(username)')`. The trigger ensures profiles exist before jobs are created.

### Pattern 2: Cursor-Based Pagination
For the discover feed. Cursor = `created_at` of last item. Stable under concurrent writes, efficient at any offset.

### Pattern 3: Optimistic UI for Social Actions
Bookmark toggles update UI immediately, fire API in background, revert on failure.

### Pattern 4: Denormalized Counts
`view_count` and `bookmark_count` on `jobs` directly, updated via SECURITY DEFINER RPCs. Avoids COUNT(*) aggregation on every discover feed query.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate Public and Private Results Components
**What:** Building two completely separate results page components.
**Why bad:** Massive code duplication. The visualization is identical -- only the chrome differs.
**Instead:** Extract `ResultsVisualization` shared component. Pass `readOnly` prop.

### Anti-Pattern 2: Client-Side Username Validation Only
**What:** Checking username availability only in the browser.
**Why bad:** Race condition -- two users could claim the same username simultaneously.
**Instead:** Database UNIQUE constraint is the source of truth. Client check is UX sugar.

### Anti-Pattern 3: Using Supabase Realtime for View Counts
**What:** WebSocket subscriptions for counter updates.
**Why bad:** Overkill for non-time-sensitive analytics. Wastes connection resources.
**Instead:** Fetch on page load. No live updates needed.

### Anti-Pattern 4: Making Private Job Fields Visible in Public Queries
**What:** Returning `runpod_id`, `error_message`, `user_id` in public API responses.
**Why bad:** Leaks internal implementation details.
**Instead:** Define a `PublicAnalysis` type that excludes sensitive fields. Map in API route or use a Postgres VIEW.

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Discover feed | Single query, no caching | Add cache headers, consider materialized view | Full-text search, read replica |
| View counting | Direct increment RPC | Same, dedup optional | Batch via view_events + cron |
| Bookmark counts | RPC with subquery | Same | Trigger-based counter cache |
| Profile lookups | Index on username | Same | CDN cache public profiles |
| Public results | Direct query | Same | CDN cache completed analyses |

For v4.0 at current scale, the simple approach is sufficient. Do not over-engineer.

---

## Suggested Build Order

Ordered by dependency chain:

1. **Database schema + RLS + RPCs** -- everything depends on this
2. **Middleware update** -- unblocks public routes
3. **Profile system** -- username claim, settings UI, auto-create trigger
4. **Visibility toggle** -- enables public content to exist
5. **Public layout group** -- `(public)/layout.tsx` with minimal nav
6. **ResultsVisualization extraction** -- prerequisite for public view
7. **Public analysis view** -- `/u/[username]/[id]`, view counting
8. **Public profile page** -- `/u/[username]`
9. **Discovery feed** -- `/discover` + `/api/discover`, sorting, pagination
10. **Bookmarks** -- social engagement, lowest priority

---

## File Change Summary

### New Files
| File | Purpose |
|------|---------|
| `src/app/(public)/layout.tsx` | Public page layout (no sidebar) |
| `src/app/(public)/discover/page.tsx` | Discovery/leaderboard server component |
| `src/app/(public)/discover/DiscoverFeed.tsx` | Client feed with sorting/pagination |
| `src/app/(public)/discover/DiscoverCard.tsx` | Analysis card for feed |
| `src/app/(public)/u/[username]/page.tsx` | Public profile page |
| `src/app/(public)/u/[username]/[id]/page.tsx` | Public analysis view |
| `src/app/api/discover/route.ts` | Paginated public feed API |
| `src/app/api/profiles/[username]/route.ts` | Profile lookup/update API |
| `src/app/api/analyses/[id]/visibility/route.ts` | Toggle visibility API |
| `src/app/api/analyses/[id]/bookmark/route.ts` | Bookmark toggle API |
| `src/components/social/BookmarkButton.tsx` | Bookmark toggle UI |
| `src/components/social/VisibilityToggle.tsx` | Public/private switch |
| `src/components/social/ShareButton.tsx` | Copy public URL |
| `src/components/social/ViewCount.tsx` | View count display |
| `src/components/results/ResultsVisualization.tsx` | Extracted shared results view |
| `src/components/profile/ProfileSetup.tsx` | Username onboarding banner |
| `src/components/profile/UsernameInput.tsx` | Username field with availability check |
| `supabase/migrations/XXXXXX_social_discovery.sql` | All schema changes |

### Modified Files
| File | Change |
|------|--------|
| `src/lib/database.types.ts` | Add Profile, Bookmark types; update Job with new fields |
| `web/middleware.ts` | Add public route prefixes to allowed paths |
| `src/components/layout/Sidebar.tsx` | Add Discover nav item |
| `src/app/(app)/profile/page.tsx` | Show username, link to public profile |
| `src/app/(app)/settings/SettingsForm.tsx` | Add username field |
| `src/app/(app)/dashboard/page.tsx` | Add visibility toggle to completed job cards |
| `src/app/(app)/results/[id]/page.tsx` | Extract visualization, add share button |

## Sources

- Supabase RLS documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Auth + profiles pattern: https://supabase.com/docs/guides/auth/managing-user-data
- Next.js App Router route groups: https://nextjs.org/docs/app/building-your-application/routing/route-groups
- PostgREST foreign key joins: https://postgrest.org/en/stable/references/api/resource_embedding.html
