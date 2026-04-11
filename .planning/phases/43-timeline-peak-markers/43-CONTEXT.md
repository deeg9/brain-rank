# Phase 43: Timeline Peak Markers - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The neural timeline visually marks the moments of highest brain activation so creators can instantly see their video's peak engagement points. Adds peak detection logic and visual markers to the existing NeuralTimeline component.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Key parameters from success criteria:
- Identify top 3-5 activation peaks automatically from segment data
- Each peak marker shows timestamp and relative activation intensity on hover/tap
- Peak markers must not interfere with existing timeline interactions (playhead scrubbing, click-to-seek)
- Use the activation threshold (0.3) from Phase 41 to define what qualifies as a peak

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/components/results/NeuralTimeline.tsx` — existing multi-track neural timeline with Recharts AreaCharts
- `web/src/components/results/brain-utils.ts` — segment lookup utilities, getAdjacentSegments
- `web/src/lib/colormap.ts` — THRESHOLD constant (0.3) for activation threshold

### Established Patterns
- Recharts AreaChart with synchronized crosshair
- Click-to-seek on timeline tracks
- Dark theme with neural/scientific aesthetic

### Integration Points
- NeuralTimeline receives segments data with per-segment region scores
- Results page manages video playback and timeline sync
- Peak markers overlay on existing timeline tracks

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
