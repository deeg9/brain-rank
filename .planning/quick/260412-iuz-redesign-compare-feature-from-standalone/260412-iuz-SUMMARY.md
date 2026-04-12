---
quick_id: 260412-iuz
status: complete
started: 2026-04-12
completed: 2026-04-12
---

# Quick Task 260412-iuz: Redesign Compare Feature — Summary

## What Was Built

Replaced the standalone /compare page with an integrated comparison tray + modal pattern on the discover page:

1. **ComparisonTray** — Sticky bottom bar that appears when users select analyses. Shows Analysis A and B slots with titles, a "Compare" button, and remove buttons.

2. **ComparisonModal** — Full overlay with:
   - Side-by-side media previews (video thumbnails, images, or text content)
   - Brain activation maps (two BrainViewer instances)
   - Hook Strength / Retention / Peak Moment metric cards
   - Comparison table with Overall, Hook, Retention, Peak scores + green/red deltas
   - Neural activation timelines side by side
   - Cross-type disclaimer when comparing different content types (deltas show N/A)
   - Close Modal + Export Comparison buttons

3. **DiscoverCard** — Added compare select button (compare_arrows icon) on each card. Selected cards get a black ring highlight.

4. **Removed** /compare page and Compare nav link from TopBar.

## Key Files

### Created
- `web/src/components/compare/ComparisonTray.tsx`
- `web/src/components/compare/ComparisonModal.tsx`

### Modified
- `web/src/app/(app)/discover/page.tsx` — Added comparison state, tray, and modal
- `web/src/app/(app)/discover/DiscoverCard.tsx` — Added compare button and selection ring
- `web/src/components/layout/TopBar.tsx` — Removed Compare nav link

### Deleted
- `web/src/app/(app)/compare/page.tsx`
