---
phase: 47-privacy-controls-sharing
plan: 01
subsystem: api, ui
tags: [next.js, supabase, privacy, sharing, clipboard-api]

requires:
  - phase: 44-user-profiles-schema
    provides: is_public column on jobs table, profiles table with usernames
provides:
  - PATCH /api/jobs/[id] accepts is_public boolean for visibility toggle
  - GET /api/jobs/[id] returns public jobs without auth, 404 for private to non-owners
  - Results page visibility toggle with copy link button
  - Dashboard VisibilityToggle client component with globe/lock icons
affects: [48-discovery-feed, 49-social-features]

tech-stack:
  added: []
  patterns: [optimistic-update-with-revert, public-access-bypass-auth]

key-files:
  created:
    - web/src/app/(app)/dashboard/VisibilityToggle.tsx
  modified:
    - web/src/app/api/jobs/[id]/route.ts
    - web/src/app/(app)/results/[id]/page.tsx
    - web/src/app/(app)/dashboard/page.tsx

key-decisions:
  - "Public GET returns job as-is without RunPod polling to avoid exposing internal infra to non-owners"
  - "Private jobs return 404 (not 403) to non-owners to prevent existence leaking"
  - "Shareable link format is /analysis/{id} for future public route"

patterns-established:
  - "Optimistic toggle pattern: update UI immediately, PATCH API, revert on failure"
  - "Public access pattern: fetch resource first, check is_public before requiring auth"

requirements-completed: [PRIV-01, PRIV-03]

duration: 2min
completed: 2026-04-11
---

# Phase 47 Plan 01: Privacy Controls & Sharing Summary

**Public/private visibility toggle on results page and dashboard with PATCH API persistence, clipboard copy link, and unauthenticated public job access**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-11T00:36:22Z
- **Completed:** 2026-04-11T00:38:32Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Extended PATCH API to accept is_public boolean with ownership-scoped updates
- GET API now serves public jobs without authentication while returning 404 for private jobs to non-owners
- Results page has inline Toggle component with optimistic update, status feedback, and Copy Link button
- Dashboard cards show globe/lock icon with "Public" badge via new VisibilityToggle client component

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend PATCH API and add GET public access** - `f7dbaba` (feat)
2. **Task 2: Add visibility toggle and copy link to results page** - `3ab170f` (feat)
3. **Task 3: Add visibility toggle and public badge to dashboard cards** - `4c21ef5` (feat)

## Files Created/Modified
- `web/src/app/api/jobs/[id]/route.ts` - Extended PATCH with is_public, GET with public access bypass
- `web/src/app/(app)/results/[id]/page.tsx` - Toggle switch, copy link button, status feedback
- `web/src/app/(app)/dashboard/VisibilityToggle.tsx` - New client component for dashboard card visibility toggle
- `web/src/app/(app)/dashboard/page.tsx` - Imported and placed VisibilityToggle next to StatusBadge

## Decisions Made
- Public GET returns job as-is without RunPod polling to avoid exposing internal infrastructure details to non-owners
- Private jobs return 404 (not 403) to non-owners to prevent leaking job existence (T-47-02 mitigation)
- Shareable link format uses /analysis/{id} path for future public route implementation
- Owner viewing their own public job still gets full RunPod polling behavior

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Visibility toggle and public access in place for discovery feed (Phase 48)
- /analysis/{id} public route referenced in copy link but not yet created -- Phase 48 will implement the public view page
- Pre-existing TypeScript errors in upload/actions.ts and retry/route.ts are unrelated database typing issues

## Self-Check: PASSED

All 4 files verified present. All 3 commit hashes verified in git log.

---
*Phase: 47-privacy-controls-sharing*
*Completed: 2026-04-11*
