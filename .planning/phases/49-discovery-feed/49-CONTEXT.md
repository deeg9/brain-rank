# Phase 49: Discovery Feed - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Browsable /discover page showing all public analyses with thumbnails, usernames, and neural scores, ranked by score.

</domain>

<decisions>
## Implementation Decisions

### Page Design
- Route at `web/src/app/discover/page.tsx` — public, outside (app) layout, no auth required
- Grid of analysis cards showing: video thumbnail (or placeholder), title, creator username (linked to /u/username), neural score badge, date
- Default sort: highest neural score first
- Pagination: load more button (not infinite scroll) — simple for v4.0
- Empty state: "No public analyses yet" message

### Data Access
- Query public jobs (`is_public = true`, `status = completed`) with creator profile join
- Supabase anon client — no auth required
- Limit initial load to 20 items, load 20 more on "Load More"

### Claude's Discretion
- Card layout and visual design
- How to extract/compute the "neural score" for ranking (average of segment scores)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Public profile page pattern from Phase 46
- Analysis card pattern from public profile's analysis list
- PublicAvatarDisplay component for creator avatar

### Integration Points
- New route: `web/src/app/discover/page.tsx`
- Cards link to `/analysis/{id}` (Phase 48)
- Creator username links to `/u/{username}` (Phase 46)

</code_context>

<specifics>
## Specific Ideas

No specific requirements.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
