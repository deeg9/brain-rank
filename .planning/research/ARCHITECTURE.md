# Architecture: Brain Viewer UX Overhaul (Dynamic Glow)

**Domain:** 3D brain visualization simplification -- cluttered multi-mode UI to single dynamic glow
**Researched:** 2026-04-10
**Overall confidence:** HIGH (based on direct codebase analysis of existing components)

## Executive Summary

The current brain viewer has accumulated UI complexity that obscures its core value: showing which brain regions light up as a video plays. The architecture has a heatmap/regions toggle, a colormap selector dropdown, 9 network filter buttons (each togglable), and 4 view-angle buttons -- totaling 16 interactive controls in a component that should tell a story passively. The overhaul collapses this to a single visualization mode where the brain glows dynamically using the existing per-vertex heatmap data, with a static color legend replacing the interactive filter buttons. No new data pipelines are needed -- the vertex_data and region scoring infrastructure is already complete and working.

---

## Current Architecture (What Exists)

### Component Tree

```
BrainViewer.tsx (wrapper)
  |-- State: viewMode ('heatmap' | 'regions'), colormap, visibleRegions (9 booleans)
  |-- UI: mode toggle, colormap dropdown, 4 view-angle buttons, 9 region filter buttons
  |-- Canvas (R3F)
  |     |-- BrainViewerCanvas.tsx (forwardRef, imperative view controls)
  |     |     |-- IF heatmap: BrainHeatmapMesh.tsx (per-vertex coloring via Float32Array)
  |     |     |-- IF regions: BrainNetworkMesh.tsx (per-vertex coloring via region masks)
  |     |     |-- OrbitControls (user drag rotation)
  |     |     |-- IF regions: EffectComposer > Bloom
  |     |-- Suspense fallback
  |-- IF regions mode: 9 interactive filter buttons with scores
```

### Data Flow (Current)

```
segments[] + currentTime
  |
  +--> getRegionsAtTime() --> SegmentRegionScores (9 floats) --> BrainNetworkMesh
  |
  +--> getVertexDataAtTime() --> base64 string --> decodeVertexData() --> Float32Array(20484) --> BrainHeatmapMesh
```

### What Each Component Does

| Component | Lines | Role | Controls Owned |
|-----------|-------|------|----------------|
| `BrainViewer.tsx` | 184 | Outer wrapper, all state, all control UI | Mode toggle, colormap dropdown, 4 view buttons, 9 filter buttons |
| `BrainViewerCanvas.tsx` | 108 | R3F scene, lighting, camera, mode switching | Imperative view methods (front/top/left/right) |
| `BrainHeatmapMesh.tsx` | 57 | Loads unified GLB, applies colormap to vertex colors | None |
| `BrainNetworkMesh.tsx` | 134 | Loads unified GLB, colors vertices by region mask + score | None |
| `brain-utils.ts` | 64 | Time lookup, region colors constant | N/A |
| `colormap.ts` | 41 | d3 colormaps (plasma/inferno/viridis) | N/A |
| `vertex-codec.ts` | 40 | Base64 decode, uint8-to-float | N/A |

---

## Target Architecture (Dynamic Glow)

### Design Goal

The brain simply glows. As the video plays, regions that activate light up with intensity proportional to their score. Regions below threshold stay dark. No toggles, no mode switching, no colormap picker. The user watches the video and sees the brain respond. A static legend tells them what each color means.

### Visual Behavior

1. **Base state:** Dark brain mesh (#1a1a2e), barely visible -- like a dormant organ
2. **Activation:** Regions with scores above threshold (~0.15) glow in their network color, intensity scaling with score
3. **Bloom:** Post-processing bloom makes high-activation areas emanate light, creating the "glow" effect
4. **Smooth transitions:** Vertex colors lerp between segment boundaries so the brain breathes rather than snapping
5. **Auto-rotate:** Gentle slow rotation so the user sees all angles without needing view buttons

### Component Tree (New)

```
BrainViewer.tsx (simplified wrapper)
  |-- State: NONE (no user-toggleable state)
  |-- UI: Title + static NetworkLegend (non-interactive)
  |-- Canvas (R3F)
  |     |-- BrainGlowScene.tsx (replaces BrainViewerCanvas)
  |     |     |-- BrainGlowMesh.tsx (replaces both BrainHeatmapMesh AND BrainNetworkMesh)
  |     |     |-- OrbitControls (user drag, plus autoRotate)
  |     |     |-- EffectComposer > Bloom (always on)
  |     |-- Suspense fallback
  |-- NetworkLegend.tsx (static, non-interactive)
```

---

## Component Disposition

### REMOVE (delete entirely)

| Component/Element | Why Remove |
|-------------------|------------|
| `viewMode` state + toggle buttons | Single mode now -- no heatmap/regions switching |
| `colormap` state + dropdown | Fixed color scheme (network colors), no user choice |
| `visibleRegions` state + 9 filter buttons | All networks always visible, static legend instead |
| View-angle buttons (Front/Top/Left/Right) | Auto-rotate replaces preset views; OrbitControls still allows manual drag |
| `BrainViewerCanvasHandle` imperative ref | No view-angle buttons means no imperative camera control needed |
| `BrainHeatmapMesh.tsx` | Replaced by BrainGlowMesh which combines both approaches |
| `BrainNetworkMesh.tsx` | Replaced by BrainGlowMesh |
| `colormap.ts` (d3 colormaps) | No longer needed -- colors come from REGION_COLORS, not scientific colormaps |
| `COLORMAP_OPTIONS` export | Dead code after removal |

### KEEP (unchanged)

| Component/Element | Why Keep |
|-------------------|----------|
| `brain-utils.ts` -- `getRegionsAtTime()` | Still needed: maps currentTime to region scores |
| `brain-utils.ts` -- `REGION_COLORS` | Still needed: canonical colors for each network |
| `brain-utils.ts` -- `getVertexDataAtTime()` | Keep for now but may not be used in glow mode (see data flow section) |
| `vertex-codec.ts` | Keep for now, may be used if we blend vertex data with region data |
| Brain GLB assets | Both unified and region GLBs stay on disk |
| `OrbitControls` | Users can still manually rotate the brain |
| R3F `Canvas` setup | Same camera, DPR, background |

### MODIFY (significant changes)

| Component | What Changes |
|-----------|-------------|
| `BrainViewer.tsx` | Gut all state management and control UI. Becomes a thin wrapper: title + canvas + legend. Props stay the same (segments, currentTime). |
| `BrainViewerCanvas.tsx` --> rename to `BrainGlowScene.tsx` | Remove forwardRef/imperative handle. Remove mode branching. Add autoRotate to OrbitControls. Make Bloom always-on. Simplified props (just regionScores). |

### CREATE (new components)

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `BrainGlowMesh.tsx` | Single mesh that colors vertices by network region + score, using REGION_COLORS with intensity scaling. Merges the best of BrainNetworkMesh (region-aware coloring) with BrainHeatmapMesh (smooth per-vertex rendering). | Medium |
| `NetworkLegend.tsx` | Static horizontal row of colored dots + labels. Non-interactive. Shows all 9 networks. No scores, no toggles. | Low |

---

## New Data Flow

```
segments[] + currentTime
  |
  +--> getRegionsAtTime() --> SegmentRegionScores {attention: 0.72, reward: 0.45, ...}
  |
  +--> BrainGlowMesh receives regionScores
  |
  +--> Loads network-vertex-map.json (which vertices belong to which network)
  |
  +--> For each vertex:
  |      - Find which network(s) it belongs to
  |      - Get that network's score from regionScores
  |      - If score < THRESHOLD (0.15): use BASE_COLOR (dark)
  |      - If score >= THRESHOLD: use REGION_COLORS[network] * intensity(score)
  |      - For overlapping vertices: highest-scoring network wins
  |
  +--> Write to vertex color buffer attribute
  |
  +--> Bloom post-processing makes bright vertices glow
```

**Key difference from current BrainNetworkMesh:** The current implementation always shows visible networks at minimum 0.15 intensity (line 87: `Math.max(0.15, score)`). The new version uses a threshold -- below threshold the vertex is dark, above threshold it glows. This creates the "lights up when active" effect instead of "always visible but dim."

### Threshold Behavior

```
score < 0.15  -->  BASE_COLOR (#1a1a2e)     -- dark, dormant
score = 0.15  -->  network color at 15%      -- barely visible, just waking up
score = 0.50  -->  network color at 50%      -- clearly active
score = 0.80  -->  network color at 80%      -- bright, bloom catches it
score = 1.00  -->  network color at 100%     -- peak glow
```

### What Happens to vertex_data (Per-Vertex Heatmap)?

The per-vertex Float32Array(20484) from the backend is NOT used in the glow visualization. The glow mode uses region-level scores (9 floats) mapped to vertex groups via `network-vertex-map.json`. This is simpler, faster, and produces cleaner visual results because:

1. Region scores are stable (mean of thousands of vertices) -- no noisy per-vertex flickering
2. Network colors are semantically meaningful -- users see "attention is lighting up" not "vertex 12,847 is active"
3. No base64 decode overhead per frame

The `vertex_data` field and `vertex-codec.ts` should be kept in the codebase (not deleted) in case a future "expert mode" or detailed analysis view wants per-vertex resolution. But the primary glow visualization does not need it.

---

## Detailed Component Specifications

### BrainViewer.tsx (Simplified)

**Before:** 184 lines, 5 state variables, 16 interactive controls
**After:** ~50 lines, 0 state variables, 0 interactive controls

```
Props: { segments: SegmentData[], currentTime: number }

Render:
  <div className="bg-surface-container rounded-xl p-6 flex flex-col">
    <div className="flex items-center gap-2 mb-4">
      <icon>neurology</icon>
      <h3>Neural Activation Map</h3>
    </div>
    <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden">
      <Canvas ...>
        <Suspense>
          <BrainGlowScene regionScores={getRegionsAtTime(segments, currentTime)} />
        </Suspense>
      </Canvas>
    </div>
    <NetworkLegend />
  </div>
```

All state management (viewMode, colormap, visibleRegions) is deleted. The `canvasRef` imperative handle is deleted. The colormap import is deleted. The `toggleRegion` function is deleted.

### BrainGlowScene.tsx (Replaces BrainViewerCanvas)

**Props:** `{ regionScores: SegmentRegionScores | null }`

No more `visibleRegions`, `viewMode`, `colormap`, `vertexData` props. No `forwardRef`. No imperative handle.

Key differences from current BrainViewerCanvas:
- `autoRotate: true, autoRotateSpeed: 0.3` on OrbitControls (gentle rotation)
- Bloom is always on (not conditional on viewMode)
- Bloom settings tuned for glow: `luminanceThreshold: 0.15, intensity: 2.0`
- No mode branching -- always renders BrainGlowMesh
- Lighting adjusted: slightly dimmer ambient (0.15) to make glow pop against dark background

### BrainGlowMesh.tsx (New -- Replaces Both Mesh Components)

This is essentially BrainNetworkMesh with two modifications:
1. **Threshold gating:** Below-threshold vertices go fully dark instead of dim
2. **No visibleRegions filter:** All networks always participate

The implementation is nearly identical to the current `BrainNetworkMesh.tsx` -- it loads the same GLB, fetches the same `network-vertex-map.json`, uses the same per-vertex color buffer pattern. The changes are:

```diff
- const intensity = Math.max(0.15, score);  // always somewhat visible
+ const intensity = score < GLOW_THRESHOLD ? 0 : score;  // dark below threshold

- if (!visibleRegions[network]) continue;  // skip hidden networks
+ // removed -- all networks always visible
```

Plus emissive intensity should scale with max active score to enhance the glow:

```
emissiveIntensity = maxScore * 3.0  // stronger glow than current 2.0
emissive = new THREE.Color(0.05, 0.05, 0.12)  // slight blue-purple tint
```

### NetworkLegend.tsx (New)

Static, non-interactive legend. Simple flex row of colored dots with labels.

```
<div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
  {Object.entries(REGION_COLORS).map(([key, color]) => (
    <div key={key} className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-headline">
        {REGION_LABELS[key]}
      </span>
    </div>
  ))}
</div>
```

No click handlers. No score display. No active/inactive states. Just "here's what the colors mean."

---

## Smooth Transitions (Optional Enhancement)

The current implementation snaps vertex colors instantly when currentTime crosses a segment boundary. For a more cinematic feel, the glow mesh could lerp between the previous and next segment's region scores:

```typescript
// In BrainGlowMesh, instead of receiving a single regionScores:
// Receive currentTime + segments, and interpolate between adjacent segments

const t = (currentTime - currentSegment.start) / (currentSegment.end - currentSegment.start);
const blendedScore = prevScore * (1 - t) + nextScore * t;
```

**Recommendation:** Implement this as a follow-up, not in the initial overhaul. Get the simplified architecture working first, then add interpolation. The 2-second segment windows are coarse enough that snapping is noticeable but not jarring.

---

## Integration Points

### 1. Results Page (page.tsx)

The `<BrainViewer>` component call on line 294 stays exactly the same:

```tsx
<BrainViewer segments={segments} currentTime={currentTime} />
```

No props change. The simplification is entirely internal to BrainViewer and its children. This is the most important architectural property -- the overhaul is invisible to the parent.

### 2. Network Vertex Map (public/data/network-vertex-map.json)

Already exists and is loaded by BrainNetworkMesh. BrainGlowMesh uses the same file, same fetch pattern.

### 3. GLB Asset (public/models/brain-fsaverage5-unified.glb)

Already exists. BrainGlowMesh loads it same as BrainNetworkMesh does today.

### 4. brain-utils.ts

No changes needed. `getRegionsAtTime()`, `REGION_COLORS`, and `REGION_LABELS` are all reused as-is.

### 5. Imports to Clean Up

After removing BrainHeatmapMesh and BrainNetworkMesh, dead imports in the codebase:
- `vertex-codec.ts` -- no longer imported by any active component (keep file, remove imports)
- `colormap.ts` -- no longer imported (keep file or delete, no other consumers)
- `getVertexDataAtTime` from brain-utils -- no longer called from BrainViewer
- `decodeVertexData` from vertex-codec -- no longer called from BrainViewer
- `COLORMAP_OPTIONS` and `ColormapName` from colormap -- no longer imported

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Feature Flags Instead of Deletion
**What:** Keeping the old mode toggle behind a feature flag "just in case."
**Why bad:** Doubles maintenance surface. The old heatmap mode served development/debugging, not users. If vertex-level detail is needed later, build it as a separate "expert view" from scratch rather than maintaining two parallel visualization modes.
**Instead:** Delete the old code paths. Keep utility files (vertex-codec, colormap) for potential future use but remove their integration points.

### Anti-Pattern 2: Animated Auto-Rotate with Fast Speed
**What:** Setting autoRotateSpeed above 0.5.
**Why bad:** Users trying to read the visualization will fight the rotation. The brain moves too fast to correlate with video content.
**Instead:** Use 0.2-0.3 speed. The rotation should feel ambient, like the brain is slowly breathing/turning, not spinning.

### Anti-Pattern 3: Threshold Too Low
**What:** Setting GLOW_THRESHOLD near 0 so everything always glows.
**Why bad:** Defeats the purpose of "lights up when active." If every region is always lit, there is no contrast, no story.
**Instead:** Use 0.15 as threshold. Most resting-state activations are below this. Only genuinely activated regions cross it.

### Anti-Pattern 4: Per-Frame Score Interpolation Without Capping
**What:** Interpolating between segments without clamping to [0, 1].
**Why bad:** Overshoot artifacts can produce colors > 1.0, causing visual glitches with bloom.
**Instead:** Always `Math.min(1, Math.max(0, interpolatedScore))`.

---

## Suggested Build Order

### Step 1: Create NetworkLegend.tsx
- Static component, no dependencies on other changes
- Can be visually tested in isolation
- **Estimated effort:** 15 minutes

### Step 2: Create BrainGlowMesh.tsx
- Fork from BrainNetworkMesh.tsx (copy, then modify)
- Remove `visibleRegions` prop and filtering
- Change intensity calculation to threshold-gated
- Increase emissive intensity
- Test with hardcoded regionScores to verify glow effect
- **Estimated effort:** 30 minutes

### Step 3: Create BrainGlowScene.tsx
- Fork from BrainViewerCanvas.tsx (copy, then modify)
- Remove forwardRef and imperative handle
- Remove mode branching -- always render BrainGlowMesh
- Add autoRotate to OrbitControls
- Make Bloom always-on, tune settings
- Remove vertexData, visibleRegions, viewMode, colormap from props
- **Estimated effort:** 20 minutes

### Step 4: Simplify BrainViewer.tsx
- Remove all state (viewMode, colormap, visibleRegions)
- Remove all control UI (toggle, dropdown, view buttons, filter buttons)
- Remove canvasRef and imperative handle
- Wire BrainGlowScene with regionScores only
- Add NetworkLegend below canvas
- Remove dead imports (colormap, vertex-codec, etc.)
- **Estimated effort:** 20 minutes

### Step 5: Delete Old Components
- Delete BrainHeatmapMesh.tsx
- Delete BrainNetworkMesh.tsx
- Delete BrainViewerCanvas.tsx (replaced by BrainGlowScene)
- Clean up any remaining dead imports
- Verify build passes with no TypeScript errors
- **Estimated effort:** 10 minutes

### Step 6 (Optional): Add Score Interpolation
- Modify BrainViewer to pass prev/next segment scores + blend factor
- Add lerp logic in BrainGlowMesh
- **Estimated effort:** 45 minutes

**Total estimated effort for Steps 1-5:** ~1.5 hours
**Dependency chain:** Step 2 and Step 1 can be done in parallel. Steps 3-5 are sequential.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Bloom settings look bad with network colors | Medium | Low | Tune luminanceThreshold and intensity empirically. Current Bloom already works in regions mode. |
| Auto-rotate annoys users | Low | Low | Keep speed very slow (0.2). OrbitControls still allows manual override. |
| Removing colormap picker upsets power users | Very Low | Very Low | No evidence of power users. Product is for content creators, not neuroscientists. |
| Dead code left behind after deletion | Low | Low | Build step (TypeScript compilation) will catch unused imports. Run lint pass after deletion. |
| Network vertex map has incomplete coverage | Already mitigated | N/A | Vertices not in any network stay dark (BASE_COLOR). This is the desired behavior -- unmapped cortex stays dormant. |

---

## Sources

- Direct codebase analysis of all files in `web/src/components/results/Brain*.tsx`
- Direct analysis of `web/src/lib/colormap.ts` and `web/src/lib/vertex-codec.ts`
- Direct analysis of `web/src/components/results/brain-utils.ts`
- Direct analysis of `web/src/app/(app)/results/[id]/page.tsx`
- [React Three Fiber OrbitControls autoRotate](https://r3f.docs.pmnd.rs/getting-started/introduction) -- autoRotate property
- [react-three/postprocessing Bloom](https://docs.pmnd.rs/react-postprocessing/effects/bloom) -- luminance threshold tuning
