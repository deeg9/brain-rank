# Feature Research: Social Discovery Platform

**Domain:** Social content sharing + discovery/leaderboard for neural video analysis
**Researched:** 2026-04-11
**Confidence:** HIGH (well-established patterns; NeuroCut-specific domain is novel but features map to known social/leaderboard patterns)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist once you add "public profiles" and "discovery." Missing these = broken social experience.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Unique usernames | Public identity requires a handle; email is private and must stay private | LOW | Add `username` column to profiles table with unique constraint. Real-time availability check on keystroke (debounced). Regex: `^[a-z0-9_]{3,20}$`. Existing users must set username before going public. |
| Public profile page (`/@username`) | Anyone sharing content needs a viewable profile | MEDIUM | New public route outside `(app)` layout group. Shows username, avatar, stats (total analyses, avg score, best score), grid of public analyses. No auth required to view. Reuses existing profile card pattern. |
| Public/private toggle on analyses | Privacy control is non-negotiable when making content shareable | LOW | Add `is_public` boolean (default `false`) to `jobs` table. Toggle on results page and dashboard list item. Update RLS: public jobs readable by anyone, private only by owner. Default private = privacy-first. |
| Discovery/browse page | Core feature of a "platform" -- users need to find public content | MEDIUM | `/discover` route. Paginated grid of public analyses. Each card: video thumbnail, title, overall neural score, username, date. Cursor-based pagination preferred but offset acceptable at this scale. |
| Sort options on discovery | Users expect to organize content by what matters to them | LOW | Three sort modes: highest neural score (default = the leaderboard), newest, most viewed. Single `order_by` query param. Default to score because the neural ranking IS the product. |
| View count on public analyses | Basic social proof; users expect to see content popularity | LOW | Add `view_count` integer to `jobs` table. Increment via Supabase RPC on page view. Approximate counts are fine -- no need for exact deduplication at this stage. |
| Avatar upload | Profile identity needs a face; initials icon is not enough for a social platform | LOW | Supabase Storage bucket for avatars. Upload on settings page. Display on profile and discovery cards. Fallback to initials/default icon (existing pattern). Crop to square, max 500KB. |
| Privacy-by-default | All content private until user explicitly chooses to share | LOW | `is_public` defaults to `false`. No pre-checked toggles. Matches privacy-first UX consensus: opt-in to sharing, not opt-out. |

### Differentiators (Competitive Advantage)

Features that make NeuroCut's social layer unique vs generic content platforms.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Neural score leaderboard | No other platform ranks content by brain activation data. The discovery page sorted by neural score IS inherently a leaderboard. This is the entire differentiator. | LOW | Not a separate feature -- it is the default sort on discovery. Add explicit "#1, #2, #3" rank indicators. Label the tab "Leaderboard." |
| Bookmarks/saves | Users want to privately save interesting analyses to revisit later | LOW | New `bookmarks` junction table (user_id, job_id, created_at). Bookmark toggle icon on analysis cards in discovery. Section on dashboard or profile to view saved items. |
| Per-region leaderboards | Sort by attention, reward, emotional processing, or social cognition scores separately | MEDIUM | Requires extracting region scores from JSONB `results` into sortable columns or a generated column index. Powerful: "Top videos for emotional response" is a genuinely unique filter no other platform offers. |
| Brain activation preview on cards | Show mini brain heatmap or neural sparkline on discovery cards | HIGH | Requires generating a static preview image or compact visualization at analysis completion time. Significant work. Defer unless a lightweight sparkline approach proves quick. |
| Creator stats on public profile | Aggregate neural metrics visible on profile: avg attention score, best emotional score, total views across all public analyses | LOW | Computed from existing job data via aggregate queries. Makes profiles interesting to visit and compare. |
| Trending/rising content | Surface recently-posted analyses gaining views quickly | MEDIUM | "Most viewed in last 7 days" query approximates trending without complex velocity tracking. More interesting than pure all-time leaderboard after content volume grows. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Likes/upvotes | Standard social pattern, seems obvious | Creates subjective popularity metric that COMPETES with the neural score. The neural score is the objective quality signal -- adding likes dilutes it and introduces popularity bias. The whole point is brain data replaces human voting. | Bookmarks (private saves) only. Neural score IS the public quality signal. |
| Comments on analyses | Social engagement, discussion | Moderation burden at any scale. Spam risk. Comments on a brain activation chart add minimal analytical value. Premature community feature. | Defer entirely. If needed v5+, start with creator-only annotations on their own analyses. |
| Follow/follower system | Standard social graph | Requires notification infrastructure, feed generation, graph queries, follower counts. Creates "influencer" dynamics that distract from the data-first mission. Massive scope for a v4.0. | Bookmarks serve "save for later." Follow is v5+ at earliest, if ever. |
| Real-time activity feed | "See what others are analyzing now" | Privacy concern: users may not want analysis activity broadcast. Requires Supabase Realtime channels. Near-zero value at small user base. | Discovery page with "newest" sort serves this without privacy risk. |
| Share-to-social buttons | Drive virality | Generic share buttons have near-zero click-through. Better to invest in making the public URL itself shareable with rich previews. | OG meta tags (title, neural score, preview image) on public analysis pages. The URL is the share mechanism. |
| Gamification (badges, streaks, points) | Increase engagement loops | Over-engineered for a data platform. "Uploaded 10 videos" badges do not align with the analytical value prop. Creates busy-work incentives. | The leaderboard rank IS the gamification. Your position on the neural leaderboard is your badge. |
| User-customizable profile themes | Self-expression | Scope creep. Design system is already established (Neural Architect theme). Custom themes create visual inconsistency and double frontend work. | Consistent profile layout. Avatar + bio is sufficient self-expression for a data platform. |

## Feature Dependencies

```
[Profiles table + username]
    |
    +--requires--> [Supabase migration: create profiles table]
    |
    +--enables--> [Username setup flow for existing users]
    |                  |
    |                  +--gates--> [Public/private toggle] (can't go public without username)
    |
    +--enables--> [Public profile page /@username]
    |                  |
    |                  +--enhanced-by--> [Avatar upload]
    |                  |
    |                  +--enhanced-by--> [Creator stats]
    |
    +--enables--> [Discovery page]
                      |
                      +--requires--> [Public/private toggle] (need public content to discover)
                      |
                      +--requires--> [RLS policy update for anonymous reads]
                      |
                      +--includes--> [Sort by score/date/views]
                      |
                      +--requires--> [View count tracking]
                      |
                      +--enhanced-by--> [Bookmarks]
                      |
                      +--enhanced-by--> [Search/filter]
                      |
                      +--enhanced-by--> [Per-region leaderboards]
```

### Dependency Notes

- **Everything requires the profiles table:** Currently no `profiles` table exists. Auth uses `auth.users` with `user_metadata`. A proper `public.profiles` table with `id` (FK to auth.users), `username`, `avatar_url`, `bio`, `created_at` is the absolute foundation. Without it, nothing else works.
- **Public toggle requires RLS update:** Current RLS on `jobs` only allows owner access (`auth.uid() = user_id`). Must add: `SELECT` where `is_public = true` for anon/any user. This is a one-line policy addition but is a hard requirement for discovery.
- **Discovery page requires public content to exist:** The toggle must be built and some analyses must be made public before discovery is useful. Consider seeding with the developer's own analyses.
- **Username gates public features:** Existing users who signed up with email only must complete a username setup before they can toggle any analysis to public. This prevents anonymous public content.
- **Per-region leaderboards require indexed scores:** Currently region scores are buried in JSONB `results` column. Need to extract `overall_score`, `attention_score`, `reward_score`, `emotional_score`, `social_score` into indexable columns (generated columns or a materialized view) for efficient sorting.

## MVP Definition

### Launch With (v4.0)

Minimum to call this a "social discovery platform":

- [ ] Profiles table + unique username registration -- the foundation for public identity
- [ ] Username setup flow for existing users -- gate: must have username to go public
- [ ] `is_public` toggle on analyses -- privacy control, default false
- [ ] RLS policy update for public reads -- anonymous users can view public analyses
- [ ] Public profile page at `/@username` -- viewable without auth, shows public analyses
- [ ] Discovery page with paginated grid -- the core browse experience
- [ ] Sort by neural score / newest / most viewed -- three sort modes, score is default
- [ ] View count tracking on public analyses -- increment on page view
- [ ] Bookmarks -- save public analyses to personal collection
- [ ] Avatar upload -- complete the profile identity

### Add After Validation (v4.x)

Features to add once users are actively sharing and browsing:

- [ ] Search on discovery page -- add when content volume makes scrolling insufficient
- [ ] Per-region leaderboards (sort by attention, emotion, etc.) -- add when users ask for it
- [ ] Trending/rising tab -- add when daily content volume justifies it
- [ ] Creator aggregate stats on public profile -- add when profiles get repeat visitors
- [ ] OG meta tags on public analysis URLs -- add when users start sharing externally

### Future Consideration (v5+)

- [ ] Follow system -- only if platform reaches hundreds of active creators
- [ ] Comments/annotations -- only if analytical discussion emerges as a user need
- [ ] Brain activation preview thumbnails on cards -- high effort, defer until visualization pipeline supports static export
- [ ] API access to leaderboard data -- if B2B interest emerges

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Profiles table + usernames | HIGH | LOW | P1 |
| Username setup flow | HIGH | LOW | P1 |
| Public/private toggle | HIGH | LOW | P1 |
| RLS policy for public reads | HIGH | LOW | P1 |
| Public profile page | HIGH | MEDIUM | P1 |
| Discovery page | HIGH | MEDIUM | P1 |
| Sort by score/date/views | HIGH | LOW | P1 |
| View count tracking | MEDIUM | LOW | P1 |
| Bookmarks | MEDIUM | LOW | P1 |
| Avatar upload | MEDIUM | LOW | P1 |
| Search on discovery | MEDIUM | MEDIUM | P2 |
| Per-region leaderboards | MEDIUM | MEDIUM | P2 |
| OG meta tags | MEDIUM | LOW | P2 |
| Trending tab | LOW | MEDIUM | P2 |
| Creator aggregate stats | LOW | LOW | P2 |
| Brain preview thumbnails | MEDIUM | HIGH | P3 |
| Follow system | LOW | HIGH | P3 |
| Comments | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v4.0 launch
- P2: Should have, add in v4.x when validated
- P3: Future consideration, v5+

## Competitor Feature Analysis

| Feature | Product Hunt | YouTube Analytics | VidIQ/Tubics | NeuroCut Approach |
|---------|--------------|-------------------|--------------|-------------------|
| Public profiles | Maker profiles with shipped products | Channel pages | Creator dashboards (private) | `/@username` with neural stats and public analyses grid |
| Leaderboard | Daily/weekly top products by upvotes | Trending (algorithmic) | N/A | Neural score leaderboard -- objective brain data, not votes |
| Content discovery | Browse by category, sort by votes | Algorithm-driven recommendations | N/A | Browse public analyses, sort by neural activation |
| Privacy controls | Public by default | Public/unlisted/private | Private by default | Private by default, explicit opt-in to public (privacy-first) |
| Quality signal | Upvotes (subjective, gameable) | Views + algorithm (opaque) | Engagement metrics (CTR, watch time) | Neural activation score (objective, brain-data-derived) |
| Engagement | Upvotes + comments | Views + likes + comments | N/A | View counts + bookmarks only. No subjective voting. |
| Search | Full-text by product name | Full-text + semantic | N/A | Title search for v4.0, expand later |

**Key strategic insight:** NeuroCut's differentiator is that quality ranking comes from objective brain data, not subjective votes or opaque algorithms. Do NOT add likes/upvotes -- they would undermine the core value proposition. The neural score IS the vote. Lean into this distinction hard.

## Database Schema Implications

New tables and columns needed (builds on existing `jobs` table and Supabase Auth):

**New table: `profiles`**
- `id` uuid PK, FK to `auth.users(id)` ON DELETE CASCADE
- `username` text UNIQUE NOT NULL, CHECK (`username ~ '^[a-z0-9_]{3,20}$'`)
- `avatar_url` text nullable
- `bio` text nullable, CHECK (char_length(bio) <= 160)
- `created_at` timestamptz DEFAULT now()
- `updated_at` timestamptz DEFAULT now()
- Index on `username` for fast lookups
- RLS: anyone can SELECT, only owner can INSERT/UPDATE

**Alter table: `jobs`**
- ADD `is_public` boolean DEFAULT false
- ADD `view_count` integer DEFAULT 0
- ADD `slug` text nullable (for clean URLs: `/@user/my-analysis-slug`)
- Index on `(is_public, created_at)` for discovery queries
- Index on `(is_public, view_count)` for popular sort
- Update RLS: add SELECT policy where `is_public = true` (no auth required)

**New table: `bookmarks`**
- `id` uuid PK DEFAULT gen_random_uuid()
- `user_id` uuid FK to `auth.users(id)` ON DELETE CASCADE
- `job_id` uuid FK to `jobs(id)` ON DELETE CASCADE
- `created_at` timestamptz DEFAULT now()
- UNIQUE constraint on `(user_id, job_id)`
- RLS: only owner can CRUD

**Trigger: auto-create profile on signup**
- After INSERT on `auth.users`, create a row in `profiles` with `id = new.id`, `username = NULL`
- Username NULL = profile incomplete, gates public features

## Sources

- [SocialLeaderBoard - Creator Discovery Platform](https://socialleaderboard.com/) -- competitor pattern for creator ranking
- [Privacy-First UX Design Systems](https://medium.com/@harsh.mudgal_27075/privacy-first-ux-design-systems-for-trust-9f727f69a050) -- toggle and privacy control patterns
- [UX for Privacy & Consent in 2025](https://medium.com/design-bootcamp/ux-for-privacy-consent-in-2025-designing-trust-in-a-digital-world-0e41906298e3) -- default-off sharing, opt-in principle
- [Leaderboard Page Design Examples (Nicelydone)](https://nicelydone.club/pages/leaderboards) -- SaaS leaderboard UI patterns
- [Leaderboard Design Strategies](https://www.numberanalytics.com/blog/leaderboard-design-strategies) -- filtering, sorting, user segmentation
- [UI Patterns: What's in a Username (SitePoint)](https://www.sitepoint.com/ui-patterns-whats-username/) -- username UX patterns
- [Bookmarking Case Study (Medium)](https://medium.com/design-bootcamp/bookmarking-but-its-actually-useful-12a65c49034a) -- bookmark UX patterns
- Existing codebase: `web/supabase/migrations/00001-00003`, `web/src/lib/database.types.ts`, `web/src/app/(app)/profile/page.tsx`

---
*Feature research for: NeuroCut Social Discovery Platform (v4.0)*
*Researched: 2026-04-11*
