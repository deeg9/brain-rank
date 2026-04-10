# Phase 20: Results Display - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Build the Results Overview and Results Detail screens. Overview shows summary metrics + timeline. Detail shows per-region breakdown, segment explorer, and JSON export. Both fetch job data from Supabase and display the neural activation results.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Match Stitch HTML reference.

Stitch reference:
- /Users/deeg/Downloads/stitch_neurocut_ui_brief2/results_overview/code.html
- /Users/deeg/Downloads/stitch_neurocut_ui_brief2/results_detail/code.html

Key data: Job results from Supabase contain per-segment scores with activation, arousal, valence, and region breakdown (attention, reward, emotional_processing, social_cognition).

</decisions>

<code_context>
## Existing Code Insights

- web/src/app/(app)/results/page.tsx — stub exists (results overview)
- web/src/app/(app)/results/[id]/page.tsx — may need creation (results detail)
- web/src/lib/database.types.ts — Job type with results field
- web/src/lib/jobs.ts — job fetcher utility
- API route GET /api/jobs/[id] returns job with results

</code_context>

<specifics>
## Specific Ideas

- Neural activation timeline as SVG bar chart with color coding (tertiary=high, secondary=medium, error=low)
- Summary metrics: Overall Score, Hook Score, Retention, Peak Moment
- Per-region breakdown with progress bars
- JSON export via download button

</specifics>

<deferred>
## Deferred Ideas

- Interactive timeline scrubbing
- Video player sync with timeline
- Heatmap overlays

</deferred>
