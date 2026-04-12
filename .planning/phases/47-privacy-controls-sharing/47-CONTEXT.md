# Phase 47: Privacy Controls & Sharing - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can toggle analyses between public/private and share links to public ones. Private analyses return 404 to non-owners.

</domain>

<decisions>
## Implementation Decisions

### Privacy Toggle UX
- Toggle switch in results page header — "Public" label with switch, immediate PATCH on toggle
- Icon button on each dashboard job card — globe (public) or lock (private), toggle on click
- No confirmation needed — instant toggle with toast feedback "Analysis is now public/private"
- Public badge visible on dashboard cards for public analyses

### Sharing & Access Control
- Shareable link format: `/analysis/{job_id}` — public analyses accessible without auth
- "Copy Link" button next to toggle — `navigator.clipboard.writeText()` with "Copied!" toast
- Extend existing PATCH `/api/jobs/[id]` route to accept `is_public` field
- Private analysis URLs return 404 to non-owners (not 403, to avoid leaking existence)

### Claude's Discretion
None — all decisions captured above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `/api/jobs/[id]/route.ts` — existing job API route to extend
- Results page at `results/[id]/page.tsx` — add toggle to header
- Dashboard page — add visibility toggle icon + public badge to job cards
- `database.types.ts` — Job type already has `is_public` field from Phase 44

### Established Patterns
- Toast feedback pattern (not yet established — will need simple toast or inline status)
- PATCH API routes with Supabase RLS (established in profile route)
- Client-side clipboard API usage

### Integration Points
- Results page header: add toggle + copy link button
- Dashboard job cards: add visibility icon + public badge
- `/api/jobs/[id]` route: extend PATCH for is_public
- New public analysis route at `/analysis/[id]` will be created in Phase 48

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow existing API and UI patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
