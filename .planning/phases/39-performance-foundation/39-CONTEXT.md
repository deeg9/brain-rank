# Phase 39: Performance Foundation - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The brain viewer renders per-vertex activation colors at 60fps using GPU-side computation instead of CPU string parsing. This phase replaces d3-color CSS string parsing with a GPU-side 256-entry DataTexture LUT, switches BufferAttributes to DynamicDrawUsage, moves the animation loop from useEffect to useFrame, and syncs video-to-brain at display refresh rate.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/components/results/BrainHeatmapMesh.tsx` — per-vertex heatmap, currently uses d3-color CSS parsing + BufferAttribute.needsUpdate
- `web/src/components/results/BrainNetworkMesh.tsx` — region-based network visualization, pre-computes hex-to-RGB
- `web/src/components/results/BrainViewerCanvas.tsx` — Three.js canvas with OrbitControls
- `web/src/components/results/brain-utils.ts` — segment lookup functions (getRegionsAtTime, getVertexDataAtTime)
- `web/src/lib/colormap.ts` — d3 colormap (Plasma/Inferno/Viridis) via interpolators → CSS string → d3-color.rgb()
- `web/src/lib/vertex-codec.ts` — base64 decode uint8→float32

### Established Patterns
- Float32Array colorBuffer pre-allocated, mutated in place, flagged via needsUpdate
- Geometry cloned once to avoid mutating cached GLB geometry
- meshStandardMaterial with vertexColors enabled
- Video sync via timeupdate event → React state → segment lookup

### Integration Points
- Results page (`web/src/app/(app)/results/[id]/page.tsx`) owns videoRef and currentTime state
- BrainHeatmapMesh receives vertexData (Float32Array) and colormap name as props
- BrainNetworkMesh receives regionScores object as props

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
