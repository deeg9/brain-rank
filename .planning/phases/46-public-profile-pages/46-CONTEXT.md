# Phase 46: Public Profile Pages - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Anyone can view a user's public profile at /u/username showing their avatar, bio, public analyses, and aggregate stats. No authentication required.

</domain>

<decisions>
## Implementation Decisions

### Public Profile Page Design
- Layout matches private profile: avatar + username + bio at top, stats row, grid of public analysis cards
- Analysis cards show thumbnail + title + neural score + date, link to public analysis view (Phase 48)
- Dynamic route at `web/src/app/u/[username]/page.tsx` — outside the `(app)` layout group, no auth required
- Missing users trigger Next.js `notFound()` for built-in 404 page

### Data Access & Privacy
- Use Supabase anon client (no auth) — RLS allows public read on profiles table
- Show only jobs where `is_public = true` — RLS from Phase 44 handles filtering
- Stats (total public analyses, avg neural score) computed server-side at render time from public jobs

### Claude's Discretion
None — all decisions captured above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AvatarDisplay.tsx` — initials fallback component from Phase 45
- `getInitials()`, `getInitialsColor()` from `avatar.ts`
- Private `profile/page.tsx` — layout reference (hero card, stats, job grid)
- `VideoThumb` component for analysis thumbnails
- `StatusBadge` for job status display

### Established Patterns
- Supabase server client via `createClient()` from `@/lib/supabase/server`
- Job type from `database.types.ts`
- Profile type with username, avatar_url, bio

### Integration Points
- New route: `web/src/app/u/[username]/page.tsx` (public, outside (app) group)
- Queries profiles table by username (citext match)
- Queries jobs table filtered by user_id + is_public=true

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow existing profile page patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
