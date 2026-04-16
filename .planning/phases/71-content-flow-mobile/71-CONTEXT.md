# Phase 71: Content Flow Mobile — Context

**Gathered:** 2026-04-16
**Status:** Ready for planning
**Mode:** Auto-generated

<domain>
## Phase Boundary

End-to-end creator conversion path (Upload → Processing → Results → Analysis detail + public /analysis/[id]) + BrainViewer touch + timeline/tables/panels + comparison modal all fit iPhone 15.
</domain>

<decisions>
### Strategy
- Replace hardcoded `grid-cols-12 col-span-N` spans with `grid-cols-1 md:grid-cols-12` + `md:col-span-N` across both results pages
- Upload cost panel: `flex items-center gap-10` → `flex flex-col md:flex-row md:items-center gap-4 md:gap-10`, vertical dividers hidden on mobile
- Processing stepper: add `overflow-x-auto` and `justify-start md:justify-center` to allow sideways scroll rather than overflow
- BrainViewer canvas container: add `touch-none` so one- and two-finger gestures don't hijack page scroll
- PublicAnalysisClient: video+brain split `grid-cols-2` → `grid-cols-1 md:grid-cols-2`
- ComparisonModal: full-screen on mobile (`rounded-none md:rounded-2xl`, `h-full md:h-auto`), all internal `grid-cols-2` → `grid-cols-1 md:grid-cols-2`
</decisions>

<code_context>
### Files touched
- `web/src/app/(app)/results/page.tsx` — grid + loading skeleton grid responsive
- `web/src/app/(app)/results/[id]/page.tsx` — loading skeleton grid responsive
- `web/src/app/(app)/upload/page.tsx` — h2 size, all 3 cost panels, vertical dividers hidden on mobile
- `web/src/app/(app)/processing/page.tsx` — hero size, panel padding, stepper overflow-x-auto
- `web/src/app/analysis/[id]/PublicAnalysisClient.tsx` — video+brain grid responsive
- `web/src/components/results/BrainViewer.tsx` — touch-none on canvas container
- `web/src/components/compare/ComparisonModal.tsx` — full-screen mobile + 3× grid-cols-2 responsive + header padding
</code_context>

<specifics>
- ActivationTimeline, SegmentTable, InsightsPanel, NeuralTimeline not audited in depth — existing responsive behavior is trusted; Phase 73 QA sweep will verify. If any overflow, fix there.
</specifics>

<deferred>
- Full focus-trap behaviour in ComparisonModal — minimal implementation accepted
- BrainViewer-internal touch pinch/zoom behaviour — OrbitControls or equivalent assumed correct (dependency on `@react-three/drei`). If audit surfaces issues, fix in Phase 73.
</deferred>
