# Phase 51: Social Engagement - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Public analyses track view counts, users can bookmark analyses, and view saved bookmarks at /bookmarks.

</domain>

<decisions>
## Implementation Decisions

### View Counts
- Increment view count on public analysis page load (Phase 48 page)
- Store in a `view_count` column on jobs table (integer, default 0)
- Display on discovery cards and public analysis page
- API route or RPC function to increment atomically
- No auth required to increment (public views)

### Bookmarks
- Bookmark button on public analysis pages and discovery cards
- Requires authentication to bookmark
- Store in a `bookmarks` junction table (user_id + job_id)
- Toggle behavior: click to bookmark/unbookmark
- Visual indicator: filled/unfilled bookmark icon

### Bookmarks Page
- Route at `web/src/app/(app)/bookmarks/page.tsx` — inside (app) layout, auth required
- Grid of bookmarked analysis cards (same DiscoverCard component)
- Empty state: "No bookmarks yet" message
- Remove bookmark from this page removes card from list

### Database
- New migration: `bookmarks` table with composite primary key (user_id, job_id)
- RLS: users can only read/write their own bookmarks
- Add `view_count` column to jobs table

### Claude's Discretion
- Exact placement of view count display
- Bookmark button styling and animation

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DiscoverCard.tsx` — extend with bookmark button and view count
- `/analysis/[id]/page.tsx` — add view increment and bookmark button
- `database.types.ts` — add Bookmark type, view_count to Job

### Integration Points
- New migration for bookmarks table + view_count column
- New API route for bookmarks (POST/DELETE toggle)
- New API route or RPC for view count increment
- New page: `/bookmarks`
- Extend discovery cards and public analysis page

</code_context>

<specifics>
## Specific Ideas

No specific requirements.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
