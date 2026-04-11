# Pitfalls Research

**Domain:** Adding social discovery features (profiles, public/private content, leaderboards, bookmarks) to an existing private analysis tool
**Researched:** 2026-04-11
**Confidence:** HIGH (based on existing codebase analysis + Supabase docs + established database patterns)

## Critical Pitfalls

### Pitfall 1: RLS Policy Gap When Adding Public Read Access

**What goes wrong:**
The existing `jobs` table has three RLS policies, ALL scoped to `auth.uid() = user_id` (owner-only SELECT, INSERT, UPDATE). When adding a public/private toggle (`is_public boolean`), teams either: (a) forget to add a public SELECT policy so the leaderboard returns empty results, or (b) add an overly broad policy (`using (true)`) that exposes ALL analyses including private ones. In Supabase, RLS policies for the same operation are OR'd together -- so a single permissive policy overrides all restrictive ones.

**Why it happens:**
The current schema was designed as a single-user private tool. Every query assumes `auth.uid() = user_id`. Adding public access is the first time "other people read your data" exists in the system. Developers unfamiliar with RLS policy composition don't realize policies combine with OR, not AND.

**How to avoid:**
- Replace the existing owner-only SELECT policy with a single combined policy: `CREATE POLICY "Public or own analyses" ON jobs FOR SELECT USING (is_public = true OR auth.uid() = user_id)`. This handles both cases in one policy.
- Keep INSERT/UPDATE/DELETE policies strictly owner-only. Never add public write access.
- Default `is_public` to `false` in the column definition so ALL existing analyses remain private after migration.
- Write explicit test queries: (1) anonymous user reads public job = success, (2) anonymous user reads private job = empty, (3) owner reads own private job = success, (4) other authenticated user reads someone's private job = empty.

**Warning signs:**
- Leaderboard page shows zero results despite public analyses existing
- Or worse: leaderboard shows ALL analyses including ones never marked public
- Users report seeing other users' private analyses

**Phase to address:**
Phase 1 (User Profiles + Privacy Controls) -- must be airtight before any public-facing features launch.

---

### Pitfall 2: Video URL Exposure When Analyses Go Public

**What goes wrong:**
The `jobs` table stores `video_url text not null`. When an analysis becomes public, that URL becomes readable by anyone querying the row. If videos are uploaded to Supabase Storage in a private bucket, the stored path/URL may be a signed URL (expires in 1 hour by default) or a raw storage path that requires authentication. Public leaderboard visitors either see broken video players (expired URLs) or get unauthorized access to private storage (if using a public bucket).

**Why it happens:**
The current schema treats video URL as internal data -- only the owner ever reads it. Nobody considers that `video_url` has its own access control separate from the database row's visibility. The public/private toggle is on the analysis, not the underlying video asset.

**How to avoid:**
- Decide before building: do public analyses show the video, or just neural scores? For MVP, showing scores only (no video playback on public view) is simpler and avoids the entire problem.
- If videos must be viewable on public analyses: use a private Supabase Storage bucket, and generate short-lived signed URLs on-demand via an API route when a user views a public analysis. Never store signed URLs in the database.
- Never expose raw storage paths in client-facing API responses.
- Add a `thumbnail_url` column pointing to a public-bucket thumbnail image for leaderboard cards, separate from the full video.

**Warning signs:**
- Broken video players on leaderboard cards (403 errors in console)
- Signed URLs expiring mid-session (videos work on first load but fail on revisit)
- Users discovering their "private" video is accessible via the URL even after toggling analysis to private

**Phase to address:**
Phase 1 (Privacy Controls) -- must define the video access model before building the discovery page.

---

### Pitfall 3: Username Uniqueness Without Case Normalization

**What goes wrong:**
Users register "NeuroCutter" and "neurocutter" as separate accounts. Profile URLs `/u/NeuroCutter` and `/u/neurocutter` resolve to different people. This enables impersonation, confuses search results, and creates support headaches.

**Why it happens:**
PostgreSQL `text` columns are case-sensitive by default. A `UNIQUE` constraint on `text` allows "Foo" and "foo" as distinct values. App-level `.toLowerCase()` catches the common case but misses edge cases (direct API calls, race conditions between concurrent signups, mobile keyboard auto-capitalization).

**How to avoid:**
- Use PostgreSQL's `citext` extension: `CREATE EXTENSION IF NOT EXISTS citext;` then `username citext UNIQUE NOT NULL`. This enforces case-insensitive uniqueness at the database level with zero application code needed.
- Add a CHECK constraint for character validation: `CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$')` to prevent Unicode lookalikes, spaces, emoji, and special characters.
- Maintain a blocklist of reserved usernames: "admin", "support", "neurocut", "api", "settings", "profile", "discover", "leaderboard", "null", "undefined". Check at insert time via a trigger or app-level validation.
- Store the display version (user's chosen casing) separately from the lookup key if desired, but `citext` preserves the original casing while enforcing uniqueness case-insensitively.

**Warning signs:**
- Users reporting "username taken" when they can't find that profile
- Profile URL 404s due to case mismatch between stored value and URL routing
- Support tickets about impersonation

**Phase to address:**
Phase 1 (User Profiles) -- get this right on the first migration. Deduplicating usernames after the fact requires user communication and is disruptive.

---

### Pitfall 4: Leaderboard Query Performance Degrades Silently

**What goes wrong:**
Leaderboard sorts analyses by neural score. The current `results` column is JSONB. Sorting by a JSONB field access (`results->>'peak_activation'`) prevents B-tree index usage, forcing a sequential scan and in-memory sort on every leaderboard page load. Combined with OFFSET-based pagination (the default tutorial pattern), page 10 requires scanning and discarding 200 rows before returning 20. This compounds: at 500+ public analyses, the leaderboard takes 1-2 seconds to load. At 2000+, it may timeout.

**Why it happens:**
Developers build the leaderboard with 5-10 test analyses and it's instant. JSONB field access "just works" in WHERE and ORDER BY clauses -- Postgres handles it transparently. The performance cliff is invisible until real data accumulates.

**How to avoid:**
- At job completion (when RunPod returns results), extract key sortable metrics into dedicated indexed columns: `peak_activation numeric`, `avg_activation numeric`, `segment_count integer`. This is a one-time write cost that saves on every read.
- Use keyset/cursor pagination from the start: `WHERE (peak_activation, id) < ($last_score, $last_id) ORDER BY peak_activation DESC, id DESC LIMIT 20`. This is O(1) regardless of page depth, unlike OFFSET which is O(N).
- Create a partial composite index: `CREATE INDEX idx_public_leaderboard ON jobs(peak_activation DESC, id DESC) WHERE is_public = true`. Partial index only covers public rows, staying small and fast.
- Avoid `COUNT(*)` for total result counts on the leaderboard. Use "Load More" UX instead of "Page 3 of 47" to avoid the expensive count query.

**Warning signs:**
- Leaderboard load time creeping up as more analyses are published
- `pg_stat_statements` showing sequential scans on `jobs` table for leaderboard queries
- Database CPU spikes correlated with leaderboard page traffic

**Phase to address:**
Phase 2 (Discovery/Leaderboard) -- must use cursor pagination and indexed columns from day one. Changing pagination style later is a breaking API change for any consumers.

---

### Pitfall 5: Toggling Public/Private Breaks Cross-User References

**What goes wrong:**
User publishes an analysis, it accumulates 50 views and 12 bookmarks, then toggles it private. Now: bookmarks in other users' lists point to an inaccessible analysis, view counts are orphaned, and the leaderboard has a stale entry until the next query. Teams ship the toggle as a simple boolean flip without defining cascade behavior, leading to broken bookmark pages and confused users.

**Why it happens:**
The toggle appears trivially simple -- it's one column update. But social features create cross-user references (bookmarks, view history) that span ownership boundaries. The database schema connects the data; the toggle behavior needs to be designed explicitly.

**How to avoid:**
- Define the privacy contract BEFORE building social features:
  - Toggle to private: analysis disappears from leaderboard (handled automatically by RLS if the leaderboard query uses anon/user context). Existing bookmarks show "This analysis is no longer public" as a graceful placeholder, not a 404 or error card. View count is preserved but hidden from public.
  - Toggle back to public: previous bookmarks reactivate, view count resumes from where it was. Don't delete social data on toggle.
- In the bookmarks query, use a LEFT JOIN to the jobs table with the RLS-filtered view. If the job is private, the LEFT JOIN returns NULL for job columns -- render the placeholder.
- Add a `published_at` timestamp to track when an analysis was last made public. This enables "recently published" sorting and distinguishes republished content from newly created content.

**Warning signs:**
- Bookmark lists showing blank/broken cards
- Users toggling public/private rapidly to game view counts or leaderboard position
- Error logs from bookmark queries failing on missing job references

**Phase to address:**
Phase 1 (Privacy Controls) for toggle behavior definition; Phase 3 (Social Features) for bookmark/view cascade implementation.

---

### Pitfall 6: No Profile Backfill for Existing Users

**What goes wrong:**
The profiles table is created with a foreign key to `auth.users`, and a database trigger is added to create a profile row `AFTER INSERT ON auth.users`. But users who signed up BEFORE the migration have no profile row. They log in, and every query that JOINs on profiles returns NULL or errors out. The app crashes or shows blank data for the most important users -- your existing ones.

**Why it happens:**
Developers test the new flow end-to-end with fresh signups and everything works. Nobody tests with an existing account because the dev environment was recently seeded. The trigger only fires on NEW signups, not existing rows.

**How to avoid:**
- In the same migration that creates the `profiles` table and trigger, include a backfill statement: `INSERT INTO profiles (user_id, username) SELECT id, 'user_' || substr(id::text, 1, 8) FROM auth.users WHERE id NOT IN (SELECT user_id FROM profiles)`. This gives every existing user a placeholder username they can change.
- Test the migration against a database snapshot with existing users before deploying.
- Add a "complete your profile" interstitial that shows for users with placeholder usernames.
- Make the profiles table JOIN safe: use LEFT JOIN in all queries so a missing profile degrades gracefully instead of erroring.

**Warning signs:**
- Existing users seeing error pages after the social update deploys
- Profile-related database constraint violations
- Empty username displays on analysis cards

**Phase to address:**
Phase 1 (User Profiles) -- must be part of the initial migration, not an afterthought.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing sort scores in JSONB `results` instead of dedicated columns | No schema change needed | Every leaderboard query does JSONB extraction, can't use B-tree index, O(N) sort per page load | Never for fields used in ORDER BY |
| OFFSET pagination for leaderboard | Simple implementation, familiar pattern | O(N) scan for deep pages, inconsistent results under concurrent writes | Only if total public analyses will never exceed ~100 |
| Skipping username blocklist | Ship profiles faster | Impersonation risk, squatting "admin"/"support"/"neurocut", costly to reclaim later | Never |
| Single `jobs` table for both private and public data | No new tables, simpler schema | RLS policy complexity grows, every query carries public/private filter overhead | Acceptable for MVP with a partial index on `is_public = true` |
| Client-side view count increment via read-modify-write | No server function needed | Race conditions lose increments, trivially gameable by refresh | Never |
| Default `is_public = true` on new analyses | Content appears on leaderboard immediately | Privacy violation -- users may not expect their analysis to be public | Never. Default must be `false`. |

## Integration Gotchas

Common mistakes when connecting to existing NeuroCut systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth -> Profiles | Assuming `auth.users` table has a corresponding profile. Works for new users (trigger creates it) but breaks for pre-existing users. | Run a backfill migration for existing users AND add a database trigger for new signups. Both are required. |
| Supabase Storage (videos) | Using a public bucket for all videos, then trying to restrict access when analysis is toggled private. Public bucket = anyone with the URL can access, forever. | Use a private bucket for all videos. Generate short-lived signed URLs server-side for public analysis video playback. |
| RunPod results -> Leaderboard scores | Querying JSONB `results` field in ORDER BY for leaderboard sorting. Works but prevents index usage. | At job completion, extract `peak_activation` and `avg_activation` into dedicated numeric columns. One-time write cost, saves every read. |
| Supabase RLS + Anonymous leaderboard access | Using service role key in the leaderboard API route to "bypass RLS and just show public stuff." Defeats the entire purpose of RLS. | Use the anon key for leaderboard queries. Write RLS policies that explicitly allow anonymous reads on public rows. Let the database enforce access. |
| Next.js API routes + Supabase auth | Using client-side Supabase client in API routes. The client-side client doesn't carry the user's session in server context. | Use `createServerClient` from `@supabase/ssr` in API routes and middleware. Pass cookies for session context. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full table scan for leaderboard sorting on JSONB field | Slow page loads, high DB CPU, sequential scan in EXPLAIN | Dedicated indexed columns for sort fields + partial index on `is_public = true` | 500+ public analyses |
| OFFSET pagination on deep pages | Page 10+ takes 1-2s, page 50+ times out | Cursor/keyset pagination: `WHERE (score, id) < ($last, $last_id)` | 200+ total public results |
| COUNT(*) for "page X of Y" display | Extra full-table scan on every page load | Skip total count. Use "Load More" button instead of page numbers. | 1000+ public rows |
| N+1 queries on leaderboard (profile per analysis) | 20 leaderboard items = 21 database queries | JOIN profiles in the leaderboard query or use a Postgres view | Always -- even 20 items = 20 extra round-trips |
| Unbounded bookmark list fetch | User with 200+ bookmarks causes slow load | Paginate bookmark lists (20 per page), use cursor pagination | 50+ bookmarks per user |
| Real-time subscriptions on the leaderboard | Supabase Realtime channel per leaderboard visitor, broadcast on every analysis publish | Don't use Realtime for leaderboards. Serve from cache/static query. Refresh on user action (pull-to-refresh, navigation). | 10+ concurrent leaderboard viewers |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing `user_id` (UUID) in public API responses | User enumeration, cross-referencing with other services, potential for targeted attacks | Use username as the public identifier. Strip `user_id` from all leaderboard/discovery responses. |
| No rate limit on analysis publication toggle | User spams public/private to game "recently published" ranking or inflate view counts | Debounce toggle (max 1 change per minute). Rate-limit the UPDATE endpoint. |
| Bookmark/view data revealing user behavior | Privacy leak -- if bookmark lists or view history are public, others learn what content a user consumes | Bookmarks and view history are private to the owning user by default. No public "User X bookmarked this" display. |
| Allowing username changes without cooldown | Username squatting, impersonation, confusion when previous URLs break | 30-day cooldown between username changes. Optionally keep a previous_usernames log for redirect. |
| Using `user_metadata` from JWT in RLS policies | Users can modify their own `user_metadata` via Supabase client. An RLS policy that trusts metadata can be bypassed. | Only use `auth.uid()` in RLS policies. Never trust claims from `raw_user_meta_data`. |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No confirmation before making analysis public | Users accidentally publish incomplete or embarrassing analyses | Confirmation dialog: "This analysis will appear on the public leaderboard. Continue?" with a preview of what others will see. |
| Leaderboard only shows all-time top scores | New analyses never surface because established content dominates the top | Time-based tabs: "Recent", "This Week", "All Time". Default to "Recent" so new content gets visibility. |
| Empty leaderboard state shows nothing | First users see a blank page, feel the product is broken or abandoned | Show a CTA: "Be the first to share a neural analysis" with explanation of how publishing works. |
| Requiring username at signup | Adds friction to onboarding, users who just want to analyze their own videos don't need a public identity | Allow signup without username. Prompt for username only when they first try to publish (just-in-time identity). |
| No visual distinction between public and private on own analysis list | Users forget which analyses are public and may not realize something is visible to others | Clear badge or icon on each analysis card (lock icon for private, globe icon for public). |
| Bookmark button with no feedback | User clicks bookmark, nothing visible happens, they click again (unbookmarking), confused | Optimistic UI: immediate visual toggle (filled/unfilled icon) with toast notification. Revert on network failure. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **User Profiles:** Often missing reserved username blocklist -- verify "admin", "support", "neurocut", "api", "settings" are rejected
- [ ] **User Profiles:** Often missing backfill for existing users -- verify pre-v4.0 users have profile rows and can log in without errors
- [ ] **Public Toggle:** Often missing cascade definition -- verify that toggling private makes bookmarks show placeholder (not error/blank) and leaderboard updates promptly
- [ ] **Leaderboard:** Often missing anonymous access -- verify unauthenticated visitors can browse without signing in (RLS allows anon reads on public rows)
- [ ] **Leaderboard:** Often missing the N+1 fix -- verify the leaderboard query JOINs profiles in a single query, not per-card
- [ ] **View Counts:** Often missing deduplication -- verify same user refreshing doesn't inflate count indefinitely
- [ ] **Bookmarks:** Often missing the unbookmark flow -- verify removal works and bookmark count decrements correctly
- [ ] **Discovery Page:** Often missing Open Graph metadata -- verify shared links show title, neural score, and thumbnail in social media previews
- [ ] **RLS Policies:** Often missing the combined public+owner policy -- verify the new policy replaces (not supplements) the old owner-only SELECT policy to avoid unintended OR behavior
- [ ] **Video Access:** Often missing access control on the video asset itself -- verify private analysis videos are not accessible via direct URL

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Private analyses exposed via broken RLS | HIGH | Fix policy immediately. Audit Supabase logs for unauthorized reads. Notify affected users. Data exposure cannot be undone. |
| Case-sensitive username duplicates | MEDIUM | Enable `citext` extension, identify conflicts, email affected users to choose new usernames, run deduplication migration with conflict resolution. |
| OFFSET pagination causing slow leaderboard | MEDIUM | Implement cursor pagination (breaking change for any API consumers), add composite index, deploy new endpoint. Old clients need update. |
| View counts inaccurate from race conditions | LOW | Create atomic RPC function. If a views log table exists, recalculate from it. If not, accept current counts and prevent future drift. |
| Leaderboard sorting on JSONB column | MEDIUM | Add dedicated numeric columns, backfill from JSONB, create index, update queries. No downtime needed but slow queries persist until migration completes. |
| Missing profiles for existing users | LOW | Run backfill INSERT. Add "complete your profile" prompt. Fix any JOIN queries that fail on NULL profile. |
| Video URLs leaked for private analyses | HIGH | Rotate storage bucket to private if it was public. Regenerate signed URLs. Cannot revoke knowledge of previously exposed URLs. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| RLS policy gap for public access | Phase 1 (Profiles + Privacy) | Test: anon reads public = OK, anon reads private = empty, owner reads own private = OK |
| Video URL exposure | Phase 1 (Privacy Controls) | Test: private analysis video URL returns 403 for non-owner |
| Username case sensitivity | Phase 1 (User Profiles) | Test: creating "Foo" after "foo" exists returns unique constraint error |
| Profile backfill for existing users | Phase 1 (User Profiles) | Test: every row in `auth.users` has a matching `profiles` row after migration |
| Leaderboard query performance | Phase 2 (Discovery/Leaderboard) | Test: EXPLAIN ANALYZE shows index scan (not seq scan) on leaderboard query with 1000+ rows |
| Cursor pagination | Phase 2 (Discovery/Leaderboard) | Test: page 50 loads in same time as page 1 |
| N+1 queries on leaderboard | Phase 2 (Discovery/Leaderboard) | Test: single database query for leaderboard page (check Supabase query logs) |
| Public/private toggle cascade | Phase 3 (Social Features) | Test: bookmark list shows placeholder for toggled-private analysis, no errors |
| View count atomicity | Phase 3 (Social Features) | Test: 10 concurrent increment requests result in count = 10 |
| View count deduplication | Phase 3 (Social Features) | Test: same user viewing same analysis 5 times counts as 1 unique view |

## Sources

- NeuroCut codebase analysis: `web/supabase/migrations/00001_create_jobs_table.sql` through `00003` -- current RLS policies and schema
- NeuroCut codebase analysis: `web/src/lib/database.types.ts` -- current TypeScript types showing JSONB results column
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RLS Best Practices (Makerkit)](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Case-insensitive usernames with Postgres citext](https://paulhoffer.com/2019/04/16/case-insensitive-emails-and-usernames-with-postgres.html)
- [The Perils of Uniqueness Validations (Thoughtbot)](https://thoughtbot.com/blog/the-perils-of-uniqueness-validations)
- [Five Ways to Paginate in Postgres (CitusData)](https://www.citusdata.com/blog/2016/03/30/five-ways-to-paginate/)
- [Optimizing SQL Pagination in Postgres (Readyset)](https://readyset.io/blog/optimizing-sql-pagination-in-postgres)
- [Supabase RPC for Atomic Increments](https://medium.com/geekculture/using-stored-procedures-rpc-in-supabase-to-increment-a-like-counter-9c5b2293a65b)
- [GitLab Pagination Performance Guidelines](https://docs.gitlab.com/ee/development/database/pagination_performance_guidelines.html)
- [Supabase Signed URLs Discussion](https://github.com/orgs/supabase/discussions/6458)

---
*Pitfalls research for: NeuroCut v4.0 Social Discovery Platform*
*Researched: 2026-04-11*
