# Phase 38: Code Cleanup & Missing Wiring - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (gap closure from milestone audit)

<domain>
## Phase Boundary

Close tech debt items identified in v2.1+v2.2 milestone audit: fix 9-network regions mode rendering, add missing retry API route, remove orphaned dead code components.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — gap closure phase driven by audit findings. Use MILESTONE-AUDIT.md as the spec.

</decisions>

<code_context>
## Existing Code Insights

### Key Files
- `web/src/components/results/BrainViewerCanvas.tsx` — REGION_NAMES hardcoded to 4, needs 9
- `web/src/components/results/RegionValuesBar.tsx` — orphaned, delete
- `web/src/components/results/RegionBreakdown.tsx` — orphaned, delete
- `web/src/components/ui/AnimationDemo.tsx` — verification artifact, delete
- `web/src/app/api/jobs/[id]/retry/` — route missing, retryJob() will 404

</code_context>

<specifics>
## Specific Ideas

- The GLB mesh only has 5 named nodes (4 regions + base). For 9-network regions mode, REGION_NAMES needs to map all 9 networks to the available mesh geometry, OR accept that regions mode shows simplified groupings while heatmap mode shows full detail.

</specifics>

<deferred>
## Deferred Ideas

None — gap closure phase.

</deferred>
