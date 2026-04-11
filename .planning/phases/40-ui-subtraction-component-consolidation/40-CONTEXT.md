# Phase 40: UI Subtraction & Component Consolidation - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The brain viewer has zero interactive controls — no toggles, no dropdowns, no preset view buttons — and the component tree is simplified from two mesh components to one. This is a subtraction/refactor phase: remove UI clutter and merge BrainHeatmapMesh + BrainNetworkMesh into a single BrainGlowMesh component.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure/refactor phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/components/results/BrainViewer.tsx` — main viewer with mode toggle, colormap dropdown, network filters
- `web/src/components/results/BrainViewerCanvas.tsx` — Three.js canvas with OrbitControls and preset view buttons
- `web/src/components/results/BrainHeatmapMesh.tsx` — per-vertex heatmap (now with LUT + DynamicDrawUsage + useFrame from Phase 39)
- `web/src/components/results/BrainNetworkMesh.tsx` — region-based network mesh with glow effects

### Established Patterns
- meshStandardMaterial with vertexColors
- Float32Array colorBuffer mutated in place, DynamicDrawUsage
- useFrame for GPU-synced buffer updates (Phase 39)
- Geometry cloned once from GLB

### Integration Points
- Results page passes vertexData, regionScores, currentTimeRef to BrainViewer
- BrainViewer manages viewMode, colormap, activeNetworks state internally
- BrainViewerCanvas renders either BrainHeatmapMesh or BrainNetworkMesh based on viewMode

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
