# Phase 48: Public Analysis View - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Public analysis page at /analysis/{id} showing brain viewer, neural timeline, and metrics without authentication. No video playback. Shows creator username linked to profile.

</domain>

<decisions>
## Implementation Decisions

### Page Structure
- Route at `web/src/app/analysis/[id]/page.tsx` — outside (app) layout, no auth required
- Reuse existing results components (BrainViewer, NeuralTimeline, CircumplexChart, MetricInfo) where possible
- No video player — scores-only view per v4.0 scope
- Show creator username (linked to /u/username) and metadata (date, video title)

### Data Access
- Query job by ID using Supabase anon client
- Only serve if `is_public = true` — return 404 for private jobs (RLS handles this)
- Query creator profile for username display
- SEO metadata: dynamic title/description from analysis data

### Claude's Discretion
- Component composition and layout decisions for the public view
- How to handle the brain viewer without video sync (static or first-frame display)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BrainViewer`, `BrainViewerCanvas`, `BrainGlowMesh` — 3D brain visualization
- `NeuralTimeline` — multi-track activation timeline
- `CircumplexChart` — arousal/valence display
- `MetricInfo` — metric cards
- `ExportButton` — export functionality
- Results page at `results/[id]/page.tsx` — reference implementation

### Integration Points
- New route: `web/src/app/analysis/[id]/page.tsx`
- Links from public profile (Phase 46) analysis cards → this page
- Links from discovery feed (Phase 49) → this page

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow results page patterns.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
