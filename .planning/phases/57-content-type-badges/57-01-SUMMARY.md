---
phase: 57-content-type-badges
plan: "01"
status: complete
started: 2026-04-12
completed: 2026-04-12
---

# Plan 57-01: Content Type Badges — Summary

## What Was Built

Created a ContentTypeBadge component and added it across the app. Video jobs show a blue "Video" badge. Image jobs show purple "Image" + amber "Exploratory". Text jobs show emerald "Text" + amber "Exploratory". Badges appear on dashboard job cards, results page header, and discovery feed cards.

## Key Files

### Created
- `web/src/components/ui/ContentTypeBadge.tsx` — Badge component with type-specific colors and Exploratory label

### Modified
- `web/src/app/(app)/dashboard/page.tsx` — Added ContentTypeBadge next to StatusBadge
- `web/src/app/(app)/results/[id]/page.tsx` — Added ContentTypeBadge next to title
- `web/src/app/(app)/discover/DiscoverCard.tsx` — Added input_type to interface, show badge for non-video
