# Phase 41: Threshold Glow & Legend - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Brain regions glow dynamically above an activation threshold while below-threshold vertices stay dark, and a static legend explains the color mapping. Uses the simplified BrainGlowMesh from Phase 40 with inferno colormap and emissive glow.

</domain>

<decisions>
## Implementation Decisions

### Glow Effect
- Use meshStandardMaterial with emissive property — reuse existing material, set emissive color proportional to vertex activation above threshold
- Below-threshold vertices appear dark gray (#1a1a1a) — matches dark UI theme, provides contrast
- Activation threshold at 0.3 (30%) — separates noise from meaningful signal in TRIBE v2 output
- Smoothstep blend width of 0.1 (threshold ± 0.05) — subtle transition, no hard popping at boundary

### Colormap
- Committed colormap: inferno — warm orange-to-yellow, excellent contrast on dark backgrounds, matches Meta's TRIBE v2 demo aesthetic
- Emissive intensity scales linearly 0→2 above threshold — subtle glow at threshold, bright at max activation

### Legend
- Horizontal gradient bar below brain viewer — non-intrusive, standard scientific visualization placement
- Content: gradient bar with "Low" / "High" labels and activation threshold marker
- Fully static — no hover, no click, no tooltip (per success criteria)

### Claude's Discretion
- Exact smoothstep GLSL/JS implementation details
- Emissive material configuration specifics
- Legend CSS/layout details within the horizontal bar constraint

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/components/results/BrainGlowMesh.tsx` — unified mesh from Phase 40 with LUT colormap, DynamicDrawUsage, useFrame
- `web/src/lib/colormap.ts` — buildColormapLUT and applyColormapFromLUT (currently hardcoded to plasma)
- `web/src/components/results/BrainViewer.tsx` — clean wrapper with no controls (Phase 40)
- `web/src/components/results/BrainViewerCanvas.tsx` — simplified canvas with OrbitControls

### Established Patterns
- Float32Array colorBuffer with DynamicDrawUsage
- useFrame dirty-flag pattern for GPU sync
- meshStandardMaterial with vertexColors

### Integration Points
- BrainGlowMesh receives vertexData (Float32Array) as prop
- BrainViewer sits inside the results page layout
- Legend component would be a sibling below BrainViewer in the results page

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the accepted grey area decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
