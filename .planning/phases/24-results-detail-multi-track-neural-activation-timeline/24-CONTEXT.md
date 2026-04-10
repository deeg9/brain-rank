# Phase 24: Results Detail Multi-Track Neural Activation Timeline - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a Recharts-based multi-track brain activation timeline to the Results Detail page, replacing the existing single-bar ActivationTimeline. Four stacked area charts (Attention, Reward, Emotional Processing, Social Cognition) showing per-segment neural activation over video duration. Also add a video player placeholder section.

</domain>

<decisions>
## Implementation Decisions

### Charting Library
- **D-01:** Use Recharts for the multi-track timeline. Install `recharts` as a dependency in web/.
- **D-02:** Build 4 separate `<AreaChart>` components stacked vertically (NOT a single stacked area chart) — each track needs its own y-axis and independent visual weight.

### Track Colors (from design spec)
- **D-03:** Attention: `#60a5fa` (blue), Reward: `#a78bfa` (purple), Emotional Processing: `#f472b6` (pink/rose), Social Cognition: `#fbbf24` (amber)
- **D-04:** Each area chart uses a gradient fill that fades to transparent at the bottom (SVG linearGradient with stop-opacity)

### Data Source
- **D-05:** Use existing `SegmentData.regions` object which already contains `attention`, `reward`, `emotional_processing`, `social_cognition` scores per segment. No new API/data fetching needed — data is already available on the Results Detail page.
- **D-06:** X-axis maps to segment time ranges (`start` to `end` seconds). Shared time domain across all 4 tracks.

### Component Architecture
- **D-07:** Create a new `NeuralTimeline` component at `web/src/components/results/NeuralTimeline.tsx` that replaces the existing `ActivationTimeline` on the detail page.
- **D-08:** Keep the existing `ActivationTimeline` component intact (used on Results Overview page) — NeuralTimeline is the detailed version for the [id] page.

### Interactivity
- **D-09:** Hover tooltip showing all 4 region values + timestamp at the cursor position. Use a custom Recharts tooltip component styled with the design system (surface-bright glassmorphism).
- **D-10:** Vertical crosshair line spanning all 4 tracks on hover. Claude's discretion on implementation approach (shared state vs CSS).

### Video Player Placeholder
- **D-11:** Add a 16:9 dark placeholder area (surface-container-lowest) above the timeline with centered play button icon and video duration display. No real video playback — just the visual placeholder.

### Page Layout Changes
- **D-12:** Results Detail page layout order (top to bottom): Back nav + filename + export → Video Player Placeholder → Neural Timeline → Metric Cards row → Region Breakdown + Segment Table columns

### Claude's Discretion
- Chart height per track (~80px suggested, can adjust for visual balance)
- Tooltip positioning and animation
- Whether to add a shared time axis label or per-track labels
- Responsive behavior at smaller viewports
- Any Recharts performance optimizations needed

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Spec
- `.planning/quick/260409-s0u-generate-stitch-design-screens-for-top-a/260409-s0u-SUMMARY.md` — Full design spec for the multi-track timeline layout, colors, and component structure

### Existing Components
- `web/src/components/results/ActivationTimeline.tsx` — Current single-bar timeline (being replaced on detail page)
- `web/src/components/results/RegionBreakdown.tsx` — Region color config and score types
- `web/src/components/results/SegmentTable.tsx` — SegmentData and SegmentRegionScores type definitions
- `web/src/app/(app)/results/[id]/page.tsx` — Current Results Detail page to modify

### Data Types
- `web/src/components/results/SegmentTable.tsx` — `SegmentRegionScores` interface (attention, reward, emotional_processing, social_cognition)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SegmentData` type already has `regions: SegmentRegionScores` with all 4 brain region scores per segment
- `RegionBreakdown` component defines `REGION_CONFIG` with colors and labels for all 4 regions
- `Card` component for wrapping the timeline section
- `Skeleton` component for loading states
- `formatTimestamp` utility in `@/lib/results`

### Established Patterns
- Results components are client components ('use client')
- Data fetching via `useEffect` + `fetch('/api/jobs/${id}')` in the parent page
- Design system: surface-container for cards, rounded-xl, no borders (tonal layering)
- Font: headline for titles (Space Grotesk), body for text (Inter), mono for timestamps

### Integration Points
- `web/src/app/(app)/results/[id]/page.tsx` — Import NeuralTimeline, add to render tree between video placeholder and metric cards
- `web/src/components/results/` — New NeuralTimeline.tsx file alongside existing results components
- `web/package.json` — Add `recharts` dependency

</code_context>

<specifics>
## Specific Ideas

- The multi-track timeline is the defining visualization of NeuroCut — it should feel premium and "neural"
- Gradient fills fading to transparent match the "Neural Editorial" design system aesthetic
- The 4-track layout lets creators see which brain regions were most activated at which moment in their video
- Design spec reference: `.planning/quick/260409-s0u-generate-stitch-design-screens-for-top-a/260409-s0u-SUMMARY.md` section "C. Multi-Track Neural Activation Timeline"

</specifics>

<deferred>
## Deferred Ideas

- Video-timeline sync (scrubbing video seeks timeline and vice versa) — requires real video player
- Segment click-to-seek on timeline — requires real video player
- Timeline zoom/pan for long videos
- Comparison mode overlaying two videos' timelines

</deferred>

---

*Phase: 24-results-detail-multi-track-neural-activation-timeline*
*Context gathered: 2026-04-10*
