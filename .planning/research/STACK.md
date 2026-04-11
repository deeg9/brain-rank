# Stack Research: Social Discovery Platform

**Domain:** User profiles, public/private content, discovery/leaderboard, social interactions
**Researched:** 2026-04-11
**Confidence:** HIGH

## Core Finding

This milestone requires zero new npm dependencies. The social discovery features are built entirely with Supabase Postgres (new tables, RLS policies, RPC functions, indexes) and Next.js App Router (new routes, Server Components). The work is database schema design and frontend pages, not library additions.

## Recommended Stack Additions

### New NPM Dependencies: NONE

Every feature in this milestone is achievable with the existing `package.json`. Here is why each tempting addition is unnecessary:

| You Might Think You Need | Why You Do Not |
|--------------------------|----------------|
| Username validation library | A Postgres `CHECK` constraint (`~ '^[a-zA-Z0-9_]{3,20}$'`) plus a `UNIQUE` index enforces validity and uniqueness at the database level. Client-side regex for UX feedback is 1 line. |
| Search library (Algolia, Meilisearch) | Postgres full-text search with `to_tsvector` + GIN index handles searching titles and usernames across hundreds-to-thousands of analyses. Zero cost, zero infrastructure. |
| State management (Zustand, Jotai) | Bookmarks and view counts are server state fetched via Supabase. Sort/filter toggles on discovery page are trivial `useState`. No global client state needed. |
| Infinite scroll library | `limit` + `offset` pagination from Supabase with a "Load more" button. If intersection observer needed later, it is 10 lines without a library. |
| ORM (Prisma, Drizzle) | Supabase JS client is already the query layer. An ORM conflicts with RLS (bypasses policies unless configured carefully) and creates two data access patterns. |
| React Query / SWR | Server Components handle initial data fetching for discovery/profile pages. Client mutations (bookmark toggle, view increment) are single Supabase calls with optimistic `useState` updates. Not enough client-side data fetching to justify a caching library. |
| NextAuth / Auth.js | Supabase Auth with `@supabase/ssr` is already integrated. Adding another auth layer creates confusion and conflicts. |
| Redis for view counts | Premature. Postgres atomic increment via RPC handles this scale. Redis adds infrastructure for no measurable gain at hundreds of concurrent users. |
| Slug/URL library | Usernames ARE the URL slugs. No transformation needed. Route: `/u/[username]`. |

### Database Layer (Supabase Postgres -- already installed, @supabase/supabase-js@^2.103.0)

This is where the actual "stack" for this milestone lives. All additions are SQL migrations.

#### New Table: `profiles`

```sql
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null
    check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  display_name text,
  avatar_url text,
  bio text check (char_length(bio) <= 280),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create unique index idx_profiles_username on public.profiles(username);
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();
```

**Why a separate table instead of Supabase Auth user_metadata:** Auth metadata has no uniqueness constraints, no indexes, and no RLS. You cannot enforce unique usernames in `user_metadata`. A `profiles` table with a `UNIQUE` constraint is the standard Supabase pattern for public user identity.

#### New Columns on `jobs` Table

```sql
alter table public.jobs add column is_public boolean default false not null;
alter table public.jobs add column view_count integer default 0 not null;
alter table public.jobs add column bookmark_count integer default 0 not null;

-- Partial indexes: only index public jobs. Private jobs never appear in discovery queries.
create index idx_jobs_public_created on public.jobs(created_at desc) where is_public = true;
create index idx_jobs_public_views on public.jobs(view_count desc) where is_public = true;
create index idx_jobs_public_bookmarks on public.jobs(bookmark_count desc) where is_public = true;
```

**Why partial indexes:** Discovery page only queries `WHERE is_public = true`. Partial indexes are smaller and faster because they exclude private jobs entirely.

#### New Table: `bookmarks`

```sql
create table public.bookmarks (
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, job_id)
);

create index idx_bookmarks_job on public.bookmarks(job_id);
```

**Why a junction table instead of a JSONB array:** Junction tables support `COUNT()` aggregation for bookmark_count, allow RLS per-user, and enable efficient lookups in both directions (user's bookmarks, job's bookmarkers).

#### RLS Policies

```sql
-- PROFILES: publicly readable, owner-editable
alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- JOBS: update existing RLS to handle public visibility
-- Drop the old select policy, replace with public-aware version
drop policy if exists "Users can view own jobs" on public.jobs;

create policy "Users can view own or public jobs"
  on public.jobs for select
  using (auth.uid() = user_id or is_public = true);

-- BOOKMARKS: users manage their own
alter table public.bookmarks enable row level security;

create policy "Users can read own bookmarks"
  on public.bookmarks for select using (auth.uid() = user_id);

create policy "Users can create bookmarks"
  on public.bookmarks for insert with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete using (auth.uid() = user_id);
```

#### Atomic View Counter (RPC Function)

```sql
create or replace function public.increment_view_count(target_job_id uuid)
returns void as $$
  update public.jobs
  set view_count = view_count + 1
  where id = target_job_id and is_public = true;
$$ language sql volatile security definer;
```

**Why RPC instead of client-side update:** A client-side `update` requires read-then-write, creating a race condition where two simultaneous viewers both read `view_count = 5` and both write `6`. The RPC function runs `view_count = view_count + 1` atomically in Postgres. `security definer` lets it bypass RLS (users should not have UPDATE on other users' jobs).

#### Bookmark Toggle with Counter Sync (RPC Function)

```sql
create or replace function public.toggle_bookmark(target_job_id uuid)
returns boolean as $$
declare
  existing boolean;
begin
  select exists(
    select 1 from public.bookmarks
    where user_id = auth.uid() and job_id = target_job_id
  ) into existing;

  if existing then
    delete from public.bookmarks
    where user_id = auth.uid() and job_id = target_job_id;
    update public.jobs set bookmark_count = bookmark_count - 1
    where id = target_job_id;
    return false;
  else
    insert into public.bookmarks (user_id, job_id)
    values (auth.uid(), target_job_id);
    update public.jobs set bookmark_count = bookmark_count + 1
    where id = target_job_id;
    return true;
  end if;
end;
$$ language plpgsql volatile security definer;
```

**Why a single RPC for bookmark toggle:** Keeps the bookmarks table and the denormalized `bookmark_count` on jobs in sync within a single transaction. No possibility of count drift.

#### Full-Text Search (Optional, for discovery page)

```sql
-- Add search vector column to jobs
alter table public.jobs add column search_vector tsvector
  generated always as (to_tsvector('english', coalesce(title, ''))) stored;

create index idx_jobs_search on public.jobs using gin(search_vector) where is_public = true;
```

**Why `GENERATED ALWAYS AS STORED`:** Automatically maintained by Postgres on insert/update. No triggers needed. Zero application code for keeping the search index current.

### Frontend Routes (Next.js 16 -- already installed)

| Route | Type | Purpose |
|-------|------|---------|
| `app/(app)/discover/page.tsx` | Server Component | Leaderboard/discovery with sorting, search, pagination |
| `app/(app)/u/[username]/page.tsx` | Server Component | Public profile page showing user's public analyses |
| `app/(app)/u/[username]/layout.tsx` | Layout | Profile layout with header, avatar, bio |
| `app/api/views/route.ts` | API Route | POST to increment view count via RPC |

**Next.js 16 note:** Dynamic route params are `Promise<{ username: string }>` -- must be awaited in `generateMetadata` and page components. This is already the pattern in the existing `results/[id]/page.tsx`.

### Supabase Type Generation

```bash
npx supabase gen types typescript --project-id <project-id> > web/src/types/supabase.ts
```

Run after each migration to get typed queries for the new tables. This gives autocomplete for `supabase.from('profiles').select('username, display_name')` without an ORM.

## Integration Points with Existing Code

| Existing Feature | How It Connects to Social Features |
|-----------------|-------------------------------------|
| Jobs table + existing RLS | Add `is_public`, `view_count`, `bookmark_count` columns. Replace select policy. Existing private jobs default to `is_public = false`. |
| Auth signup flow | After email verification, redirect to username selection page. Create `profiles` row via insert. |
| Results page (`/results/[id]`) | Add public/private toggle switch. When public, show shareable URL (`/u/{username}`). Show view count badge. |
| Dashboard (`/dashboard`) | Show bookmark counts on analyses. Add "Bookmarked" tab to filter saved public analyses. |
| Settings page (`/settings`) | Add username field (with real-time uniqueness check via Supabase), display name, bio. |
| Profile page (`/profile`) | Redirect to public profile at `/u/{username}` or repurpose as profile editor. |

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Postgres full-text search | Algolia | Algolia costs money, requires syncing data to external service, and is massive overkill for searching hundreds of video titles. Postgres FTS is free and built into Supabase. |
| Denormalized `bookmark_count` on jobs | `COUNT(*)` from bookmarks table | `COUNT(*)` requires a join or subquery on every discovery page load. A denormalized counter with atomic RPC updates is O(1) to read and correct at this scale. |
| `profiles` table | Supabase Auth `user_metadata` | Cannot enforce uniqueness on usernames in metadata. No indexes. No RLS. Not queryable from other users. |
| Partial indexes on `is_public` | Full composite indexes | Partial indexes are smaller because they exclude private jobs. Discovery queries only hit public data. |
| Server Components for discovery | Client-side fetching | Discovery/leaderboard data is not user-specific on initial load. Server Components stream the data with zero client JS bundle cost. Sort/filter changes use client-side navigation with search params. |

## Version Compatibility

| Existing Package | Compatible With Social Features | Notes |
|-----------------|--------------------------------|-------|
| `@supabase/supabase-js@^2.103.0` | All new tables, RLS, `.rpc()` calls | Full support for new schema. `.rpc('toggle_bookmark')` and `.rpc('increment_view_count')` work out of the box. |
| `@supabase/ssr@^0.10.2` | Server-side queries in discovery/profile pages | Middleware auth checks for bookmark mutations. Server Component data fetching for public pages. |
| `next@16.2.3` | Dynamic `[username]` routes, `generateMetadata` | Params are `Promise<{ username: string }>`. `generateMetadata` for SEO on public profiles. |
| `react@19.2.4` | Server Components for discovery page | Full RSC support for streaming leaderboard data. |
| `framer-motion@^12.38.0` | Page transitions, bookmark animation | Already installed. Use for bookmark heart animation and discovery card entrance animations. |

## Installation

```bash
# No npm installs needed. Run database migrations only.
# See migration SQL above for the schema changes.
```

## Sources

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) -- public/private content pattern (HIGH confidence)
- [Supabase RPC functions](https://supabase.com/docs/reference/javascript/v1/rpc) -- atomic increment pattern (HIGH confidence)
- [Supabase Full Text Search](https://supabase.com/docs/guides/database/full-text-search) -- Postgres FTS without external service (HIGH confidence)
- [Next.js 16 Dynamic Routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) -- `[username]` slug pattern (HIGH confidence)
- [Next.js 16 generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) -- SEO for public profile pages (HIGH confidence)
- Existing codebase: `web/package.json`, `web/supabase/migrations/`, `web/src/app/` routes -- verified current state

---
*Stack research for: NeuroCut v4.0 Social Discovery Platform*
*Researched: 2026-04-11*
