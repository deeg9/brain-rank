# Phase 37: Arousal/Valence Display & Network Legend - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Arousal and valence composite metrics are displayed on the results page as styled metric cards and a circumplex chart. The 9-network legend replaces the current 4-region toggle buttons with a comprehensive, color-coded legend that works with both heatmap and region views.

</domain>

<decisions>
## Implementation Decisions

### Arousal/Valence Cards
- Display as two metric cards alongside the brain viewer or timeline
- Arousal = (attention + emotional_processing) / 2 (already computed in pipeline)
- Valence = (reward + social_cognition) / 2 (already computed in pipeline)
- Style to match existing card patterns (bg-surface-container, rounded-xl)
- Show as descriptive metrics, NOT predictive scores — frame carefully

### Circumplex Chart
- 2D scatter: arousal on Y-axis, valence on X-axis
- Quadrant labels: Excited (high arousal, high valence), Tense (high arousal, low valence), Calm (low arousal, high valence), Bored (low arousal, low valence)
- Plot current segment's arousal/valence as a dot
- Use Recharts ScatterChart or simple SVG
- Style: dark background matching design system

### Network Legend
- All 9 networks displayed as toggle buttons below the brain viewer
- Compact layout — the current 4-region buttons already work but need to fit 9
- Each button shows: color dot, network name, score (when active)
- In heatmap mode: toggles don't affect the heatmap (vertex-level, not region-level)
- In regions mode: toggles show/hide region meshes (existing behavior extended to 9)

### Claude's Discretion
- Exact layout positioning of arousal/valence cards
- Circumplex chart size and detail level
- Whether to use a grid or flex wrap for 9 network buttons

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/components/results/BrainViewer.tsx` — already has region toggle buttons
- `web/src/components/results/SegmentTable.tsx` — SegmentData has arousal/valence fields
- Recharts already installed for timeline charts

### Integration Points
- Results page layout (page.tsx) — add arousal/valence cards
- BrainViewer — update region toggles for 9 networks

</code_context>

<specifics>
## Specific Ideas

- Keep arousal/valence framing descriptive ("Current emotional state") not predictive
- The user rejected virality/hook/retention scores as unreliable — arousal/valence should not feel like another score

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
