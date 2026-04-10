# Phase 32: 3D Brain Viewer - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Build an interactive 3D brain visualization component for the results page that shows brain regions glowing based on TRIBE v2 activation scores, synced to the video timeline. This is a new section on the results page — it does not replace existing components.

</domain>

<decisions>
## Implementation Decisions

### Visual Style
- **D-01:** Stylized/abstract aesthetic — smooth geometry, geometric feel, "tech product" look. NOT clinical/anatomical with realistic wrinkles. The brain should feel like it belongs in a dark-themed tech dashboard, not a medical textbook.

### Placement
- **D-02:** Separate section on the results page. Does NOT replace the existing RegionBreakdown bar charts — sits as its own dedicated section alongside existing visualizations.

### Interaction
- **D-03:** Full OrbitControls — users can freely rotate and zoom the brain. No locked camera angles.

### Brain Mesh
- **D-04:** Use the actual fsaverage5 mesh from the TRIBE v2 pipeline (~20K vertices, scientifically accurate). Need a conversion pipeline (Python script using nilearn + trimesh) to export fsaverage5 → GLB with 4 named region groups mapped from existing `src/region_mapping/atlas.py`.

### Region Mapping
- **D-05:** Four regions independently colored/glowing based on activation scores:
  - Attention (prefrontal/parietal cortex)
  - Reward (ventral striatum / nucleus accumbens)
  - Emotional processing (amygdala / insula)
  - Social cognition (temporal-parietal junction / medial prefrontal)

### Timeline Sync
- **D-06:** Brain region colors update in real-time as the user scrubs the video timeline. Uses the same `currentTime` + `segments` data already wired through the results page.

### Claude's Discretion
- Color palette for region glow (should align with existing NeuroCut theme — purple, cyan, green)
- Bloom/postprocessing intensity levels
- Whether to show region labels overlaid on the 3D model or as a legend
- Camera default position and zoom limits
- Loading state while GLB mesh loads

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Brain Mesh & Region Mapping
- `src/region_mapping/atlas.py` — Existing vertex-to-region mapping for fsaverage5 (attention, reward, emotional_processing, social_cognition)
- `tribev2/plotting/` — TRIBE v2's Python brain plotting module (reference for mesh loading patterns)

### Results Page (integration point)
- `web/src/app/(app)/results/[id]/page.tsx` — Results page where BrainViewer will be added
- `web/src/components/results/RegionBreakdown.tsx` — Existing region bar charts (NOT being replaced)
- `web/src/components/results/RegionValuesBar.tsx` — Real-time region values bar (data pattern to follow)

### Design System
- `web/src/app/globals.css` — NeuroCut design tokens, colors, glow effects

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RegionValuesBar` component: Already interpolates region scores from segments + currentTime — same data pattern needed for BrainViewer
- `segments` array with per-segment `regions.attention`, `regions.reward`, `regions.emotional_processing`, `regions.social_cognition` scores
- Video sync infrastructure: `currentTime`, `handleSeek`, `videoRef` already wired in results page
- Design tokens: `neural-gradient`, `glow-primary`, surface colors all available

### Established Patterns
- Dynamic imports with `ssr: false` for heavy client components (NeuralTimeline, VideoPlayer already do this)
- Results page passes data via props from parent state
- Recharts and other heavy libs loaded via next/dynamic

### Integration Points
- New `<BrainViewer>` component added as a section in results/[id]/page.tsx
- Props: `segments`, `currentTime` (same as RegionValuesBar)
- Dynamic import with `ssr: false` (Three.js doesn't work server-side)

</code_context>

<specifics>
## Specific Ideas

- User wants the fsaverage5 mesh but with a stylized/smooth rendering — so the geometry is scientifically accurate but the material/shading should be abstract and techy
- Glow/bloom postprocessing to create the "brain lighting up" effect
- react-three-fiber + @react-three/drei + @react-three/postprocessing stack
- Python conversion script (nilearn + trimesh) to export fsaverage5 → GLB with 4 region mesh groups
- Research found: fsaverage5 is ~20K vertices, under 1MB as GLB — no performance concerns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 32-3d-brain-viewer*
*Context gathered: 2026-04-10*
