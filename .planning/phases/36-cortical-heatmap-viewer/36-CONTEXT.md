# Phase 36: Cortical Heatmap Viewer - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

The 3D brain viewer displays continuous per-vertex color gradients across all 20,484 vertices reflecting activation intensity. Users can toggle between heatmap and region-blob views, and select between colormap options.

</domain>

<decisions>
## Implementation Decisions

### Visualization
- Per-vertex coloring via Three.js BufferAttribute with vertexColors: true
- Load unified GLB (brain-fsaverage5-unified.glb) for heatmap mode
- Keep existing split-mesh GLB for region-blob mode
- Decode base64 vertex data from API using vertex-codec.ts

### Colormaps
- Support 3 colormaps: Inferno, Plasma, Viridis (from d3-scale-chromatic)
- Install d3-scale-chromatic, d3-color, d3-scale as dependencies
- Default to Plasma (good contrast on dark backgrounds)
- Colormap selector in the brain viewer header

### Dual View Mode
- Toggle button in brain viewer header: "Heatmap" / "Regions"
- Regions mode = existing BrainRegionMesh components (unchanged)
- Heatmap mode = new BrainHeatmapMesh component with vertex colors
- Disable bloom postprocessing in heatmap mode (destroys color fidelity)

### Performance
- Pre-allocate color buffer (20,484 × 3 Float32 = 245KB)
- Mutate buffer in place during useFrame, never allocate inside render loop
- Use geometry.attributes.color.needsUpdate = true to flag GPU upload

### Claude's Discretion
- Component naming and file organization within the results/ directory
- Exact UI positioning of colormap and view mode controls
- Animation/transition between view modes

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/components/results/BrainViewer.tsx` — outer wrapper with controls
- `web/src/components/results/BrainViewerCanvas.tsx` — R3F canvas with OrbitControls
- `web/src/components/results/BrainRegionMesh.tsx` — existing region-blob renderer
- `web/src/lib/vertex-codec.ts` — base64 decoder from Phase 34
- `web/public/models/brain-fsaverage5-unified.glb` — unified mesh from Phase 35

### Established Patterns
- Dynamic imports with loading skeletons for R3F components
- useFrame for per-frame updates with lerp damping
- forwardRef with useImperativeHandle for parent control

### Integration Points
- BrainViewer.tsx needs view mode toggle and colormap selector
- BrainViewerCanvas.tsx needs to conditionally render heatmap vs region meshes
- Results page passes segments data which now includes vertex_data base64 strings

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond what was discussed.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
