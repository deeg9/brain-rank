---
phase: 51-social-engagement
plan: 01
subsystem: database, api, ui
tags: [supabase, rls, rpc, react, bookmarks, view-count, social]

requires:
  - phase: 44-user-profiles
    provides: profiles table, is_public flag on jobs
provides:
  - view_count column on jobs with atomic RPC increment
  - bookmarks table with RLS policies
  - API routes for view increment and bookmark CRUD
  - ViewCount and BookmarkButton reusable components
  - Sort-by-views on discover page
affects: [52-social-sharing, discover, analysis]

tech-stack:
  added: []
  patterns: [security-definer RPC for anonymous writes, optimistic UI toggle, StrictMode-safe useEffect with ref guard]

key-files:
  created:
    - web/supabase/migrations/00007_add_view_count_and_bookmarks.sql
    - web/src/app/api/views/[id]/route.ts
    - web/src/app/api/bookmarks/[id]/route.ts
    - web/src/app/api/bookmarks/route.ts
    - web/src/components/social/ViewCount.tsx
    - web/src/components/social/BookmarkButton.tsx
  modified:
    - web/src/lib/database.types.ts
    - web/src/app/analysis/[id]/page.tsx
    - web/src/app/analysis/[id]/PublicAnalysisClient.tsx
    - web/src/app/discover/DiscoverCard.tsx
    - web/src/app/discover/page.tsx

key-decisions:
  - "Used security definer RPC for view count increment -- bypasses RLS safely, only increments public jobs"
  - "Composite primary key (user_id, job_id) on bookmarks -- no surrogate ID needed"
  - "Optimistic UI for bookmark toggle with revert on error"

patterns-established:
  - "Security definer RPC for anonymous atomic writes on RLS-protected tables"
  - "useRef guard pattern to prevent double useEffect fire in React StrictMode"
  - "Social component pattern: ViewCount and BookmarkButton as reusable components in components/social/"

requirements-completed: [SOC-01, SOC-02]

duration: 3min
completed: 2026-04-12
---

# Phase 51 Plan 01: View Counts & Bookmarks Summary

**Atomic view count increment via security-definer RPC + bookmark toggle with optimistic UI on public analysis and discover pages**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-12T01:11:38Z
- **Completed:** 2026-04-12T01:15:01Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Database schema with view_count column, bookmarks table, RLS policies, and increment_view_count RPC function
- Three API routes: view increment (public), bookmark toggle (auth-required), bookmark listing (auth-required)
- ViewCount and BookmarkButton reusable client components with proper event handling
- Public analysis page increments view count on load and displays bookmark button
- Discovery cards show view counts and bookmark buttons, with "Most Views" sort option

## Task Commits

Each task was committed atomically:

1. **Task 1: Database schema + API routes** - `4a2dab5` (feat)
2. **Task 2: View count and bookmark UI components** - `c638789` (feat)

## Files Created/Modified
- `web/supabase/migrations/00007_add_view_count_and_bookmarks.sql` - Migration with bookmarks table, view_count column, RLS, RPC
- `web/src/lib/database.types.ts` - Added Bookmark interface, view_count to Job, bookmarks to Database type
- `web/src/app/api/views/[id]/route.ts` - POST endpoint calling increment_view_count RPC
- `web/src/app/api/bookmarks/[id]/route.ts` - GET/POST/DELETE for bookmark check and toggle
- `web/src/app/api/bookmarks/route.ts` - GET all bookmarks for authenticated user
- `web/src/components/social/ViewCount.tsx` - View count display with visibility icon
- `web/src/components/social/BookmarkButton.tsx` - Optimistic toggle with filled/unfilled bookmark icon
- `web/src/app/analysis/[id]/page.tsx` - Added ViewCount + BookmarkButton to top bar
- `web/src/app/analysis/[id]/PublicAnalysisClient.tsx` - Added view increment on mount with StrictMode guard
- `web/src/app/discover/DiscoverCard.tsx` - Added view count in bottom row, bookmark on thumbnail
- `web/src/app/discover/page.tsx` - Selects view_count, maps to cards, adds "Most Views" sort

## Decisions Made
- Used security definer RPC for view count -- allows anonymous increment while keeping RLS on jobs table
- Composite PK on bookmarks avoids surrogate ID overhead
- Optimistic UI for bookmarks improves perceived responsiveness
- StrictMode ref guard prevents double view count increment in development

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

After deploying, run `cd web && npx supabase db push` to apply migration 00007 to the production database. This adds the view_count column, bookmarks table, RLS policies, and increment_view_count RPC function.

## Next Phase Readiness
- View count and bookmark infrastructure ready for use by future social features
- Bookmark listing API available for a "Saved" page if needed
- View counts can be used for trending/popular content algorithms

## Self-Check: PASSED

All 7 created files verified on disk. Both task commits (4a2dab5, c638789) verified in git log.

---
*Phase: 51-social-engagement*
*Completed: 2026-04-12*
