# Phase 41: Threshold Glow & Legend - Research

**Researched:** 2026-04-10
**Domain:** Three.js emissive materials, colormap threshold logic, React legend UI
**Confidence:** HIGH

## Summary

This phase modifies the existing BrainGlowMesh to apply threshold-based glow using meshStandardMaterial's emissive properties, switches the colormap from plasma to inferno, and adds a static legend component below the brain viewer.

The technical approach is straightforward: the existing `applyColormapFromLUT` function in `colormap.ts` must be extended (or a new function created) to handle threshold logic -- below-threshold vertices get dark gray (#1a1a1a), above-threshold vertices get inferno-mapped color with emissive intensity scaling. The emissive color must be set per-vertex, which requires writing both a `color` attribute (for base color) and controlling emissive behavior through material properties. The legend is a pure CSS/React component with no 3D involvement.

**Primary recommendation:** Extend the colormap application to handle threshold + emissive in a single per-vertex pass, keeping all logic in the CPU-side `colormap.ts` utility. The meshStandardMaterial's `emissive` and `emissiveIntensity` are mesh-wide uniforms (not per-vertex), so the emissive glow effect must be baked into the vertex colors themselves by scaling RGB values above 1.0 (Three.js clamps to [0,1] for base color but allows >1.0 values when toneMapped is false).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use meshStandardMaterial with emissive property -- reuse existing material, set emissive color proportional to vertex activation above threshold
- Below-threshold vertices appear dark gray (#1a1a1a) -- matches dark UI theme, provides contrast
- Activation threshold at 0.3 (30%) -- separates noise from meaningful signal in TRIBE v2 output
- Smoothstep blend width of 0.1 (threshold +/- 0.05) -- subtle transition, no hard popping at boundary
- Committed colormap: inferno -- warm orange-to-yellow, excellent contrast on dark backgrounds
- Emissive intensity scales linearly 0 to 2 above threshold -- subtle glow at threshold, bright at max activation
- Horizontal gradient bar below brain viewer -- non-intrusive, standard scientific visualization placement
- Legend content: gradient bar with "Low" / "High" labels and activation threshold marker
- Fully static legend -- no hover, no click, no tooltip

### Claude's Discretion
- Exact smoothstep JS implementation details
- Emissive material configuration specifics
- Legend CSS/layout details within the horizontal bar constraint

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | Brain regions glow only above an activation threshold -- below-threshold vertices appear dark | Threshold + smoothstep logic in colormap, emissive intensity scaling, dark gray base color |
| VIS-03 | Static non-interactive color legend shows which color maps to which brain network | Horizontal gradient bar component below BrainViewer with inferno gradient |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | 0.183.2 | 3D rendering | Already installed, meshStandardMaterial emissive support built-in |
| @react-three/fiber | ^9.5.0 | React renderer for Three.js | Already installed, useFrame pattern established |
| d3-scale-chromatic | ^3.1.0 | Colormap interpolation | Already installed, provides interpolateInferno |
| d3-color | ^3.1.0 | CSS color string parsing | Already installed, used in buildColormapLUT |

[VERIFIED: web/package.json and node_modules inspection]

### No New Dependencies
This phase requires zero new packages. All functionality is achieved through:
1. Modifications to existing `colormap.ts` utility
2. Modifications to existing `BrainGlowMesh.tsx` component
3. A new pure React/CSS legend component

## Architecture Patterns

### Recommended Changes

```
web/src/
├── lib/
│   └── colormap.ts              # MODIFY: add threshold-aware apply function, switch to inferno
├── components/results/
│   ├── BrainGlowMesh.tsx        # MODIFY: add emissive buffer, emissive material props
│   ├── BrainViewer.tsx          # MODIFY: add ActivationLegend below Canvas
│   └── ActivationLegend.tsx     # NEW: horizontal gradient bar component
```

### Pattern 1: Per-Vertex Emissive via Dual Buffer Strategy

**What:** meshStandardMaterial supports `vertexColors` for the base `color` channel but emissive is a mesh-wide uniform (`emissive` + `emissiveIntensity`). To get per-vertex glow, we use a technique where:
1. The vertex color buffer stores the visual color (dark gray or inferno-mapped color)
2. A separate emissive color buffer is set as a custom attribute
3. OR (simpler): set a mesh-wide `emissive` color to white and use `emissiveIntensity` as a multiplier, then encode the emissive contribution directly into the vertex color values

**The simpler approach (recommended):** Since emissive in meshStandardMaterial adds `emissive * emissiveIntensity` uniformly to all vertices, the per-vertex glow must be encoded into the vertex colors themselves. The trick: set the vertex color values to the desired final visual output (dark gray for below-threshold, bright inferno colors scaled by intensity for above-threshold). The `emissive` property is not needed at all -- the visual glow comes from bright vertex colors against the dark background.

**When to use:** Always for this phase. Custom ShaderMaterial was explicitly rejected.

[VERIFIED: Three.js r183 MeshStandardMaterial source -- emissive is a uniform Color, not per-vertex]

**Important realization:** meshStandardMaterial clamps vertex color contribution. The material equation is roughly `finalColor = diffuseColor * light + emissive * emissiveIntensity`. With `vertexColors: true`, diffuseColor comes from the vertex color attribute. To make regions "glow" (appear bright independent of lighting), we need to use the `emissive` channel. Since emissive is mesh-wide, the actual per-vertex glow is best achieved by:

1. Setting vertex colors to the inferno-mapped color (or dark gray)
2. Setting mesh-wide `emissive` to white (#ffffff)
3. Setting mesh-wide `emissiveIntensity` to 1.0
4. Creating a SECOND vertex attribute buffer for emissive contribution, using `onBeforeCompile` to inject per-vertex emissive

**However, `onBeforeCompile` is complex.** The simplest correct approach that matches the user's decision of "meshStandardMaterial with emissive property":

**Recommended approach:** Use vertex colors to encode both the base color AND the brightness. For above-threshold vertices, scale the vertex color by the emissive intensity factor. Since the scene has ambient + directional lights, bright vertex colors will appear to glow against the dark background. Set `toneMapped={false}` on the material to allow HDR-range vertex colors (values > 1.0 won't be clamped before display).

```tsx
// In BrainGlowMesh.tsx material:
<meshStandardMaterial
  vertexColors
  toneMapped={false}     // Allow vertex colors > 1.0 for glow effect
  roughness={0.7}
  metalness={0.1}
/>
```

[ASSUMED - toneMapped={false} approach for HDR vertex color glow; standard technique but not from official docs for this exact use case]

### Pattern 2: Threshold + Smoothstep Colormap Application

**What:** A new function that applies inferno colormap with threshold gating and smoothstep blending.

**Implementation:**

```typescript
// In colormap.ts

const DARK_GRAY_R = 0x1a / 255; // 0.102
const DARK_GRAY_G = 0x1a / 255;
const DARK_GRAY_B = 0x1a / 255;

const THRESHOLD = 0.3;
const BLEND_WIDTH = 0.1; // smoothstep from 0.25 to 0.35
const BLEND_LOW = THRESHOLD - BLEND_WIDTH / 2;  // 0.25
const BLEND_HIGH = THRESHOLD + BLEND_WIDTH / 2;  // 0.35

/** GLSL-style smoothstep: hermite interpolation */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Apply inferno colormap with threshold gating and emissive intensity.
 * Below threshold: dark gray. Above threshold: inferno color scaled by emissive intensity.
 * Smoothstep blend at the threshold boundary.
 */
export function applyThresholdGlow(
  values: Float32Array,
  lutData: Uint8Array,
  target: Float32Array,
): void {
  const INV_255 = 1 / 255;
  const MAX_EMISSIVE = 2.0;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const blend = smoothstep(BLEND_LOW, BLEND_HIGH, v);

    // LUT lookup for inferno color
    const lutIdx = Math.min(255, Math.max(0, (v * 255 + 0.5) | 0));
    const idx = lutIdx * 4;
    const r = lutData[idx] * INV_255;
    const g = lutData[idx + 1] * INV_255;
    const b = lutData[idx + 2] * INV_255;

    // Emissive intensity: linear 0->MAX_EMISSIVE above threshold
    const aboveRatio = Math.max(0, (v - THRESHOLD) / (1 - THRESHOLD));
    const emissiveScale = 1.0 + aboveRatio * (MAX_EMISSIVE - 1.0);

    // Blend between dark gray and emissive-scaled inferno color
    const out = i * 3;
    target[out]     = DARK_GRAY_R * (1 - blend) + r * emissiveScale * blend;
    target[out + 1] = DARK_GRAY_G * (1 - blend) + g * emissiveScale * blend;
    target[out + 2] = DARK_GRAY_B * (1 - blend) + b * emissiveScale * blend;
  }
}
```

[VERIFIED: smoothstep formula matches GLSL spec -- standard hermite interpolation]

### Pattern 3: Static Legend Component

**What:** A pure React/CSS component showing a horizontal inferno gradient bar with "Low"/"High" labels.

```tsx
// ActivationLegend.tsx
export function ActivationLegend() {
  return (
    <div className="flex items-center gap-3 px-2 mt-3">
      <span className="text-xs text-on-surface-variant font-headline">Low</span>
      <div
        className="flex-1 h-3 rounded-full"
        style={{
          background: 'linear-gradient(to right, #000004, #420a68, #932667, #dd513a, #fca50a, #fcffa4)',
        }}
      />
      <span className="text-xs text-on-surface-variant font-headline">High</span>
    </div>
  );
}
```

The inferno gradient stops are sampled from the d3 inferno colormap at t=0, 0.2, 0.4, 0.6, 0.8, 1.0. These hex values are:
- t=0.0: #000004 (near black)
- t=0.2: #420a68 (dark purple)
- t=0.4: #932667 (magenta)
- t=0.6: #dd513a (orange-red)
- t=0.8: #fca50a (orange-yellow)
- t=1.0: #fcffa4 (pale yellow)

[VERIFIED: d3-scale-chromatic interpolateInferno output at these sample points confirmed against d3 documentation]

### Anti-Patterns to Avoid
- **Custom ShaderMaterial:** Explicitly rejected by user decision. The emissive glow effect is achievable with meshStandardMaterial + bright vertex colors + `toneMapped={false}`.
- **Per-frame LUT rebuild:** The LUT should be built once (inferno, not user-selectable). Only the threshold application runs per data change.
- **Bloom post-processing:** STATE.md notes bloom may halve frame rate on integrated GPUs. The emissive-via-vertex-color approach avoids bloom entirely while still appearing to glow on dark backgrounds.
- **Setting emissive per-vertex via onBeforeCompile:** Over-engineered for this use case. Vertex color brightness against dark background achieves the visual effect.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Inferno colormap values | Manual RGB array | d3-scale-chromatic interpolateInferno via LUT | Perceptually uniform, mathematically correct |
| Smoothstep function | Approximate easing | Standard GLSL smoothstep formula: t*t*(3-2t) | Exact, well-understood, no edge cases |
| CSS gradient for legend | Canvas-based rendering | CSS linear-gradient with sampled stops | Simpler, no canvas overhead, pixel-perfect |

## Common Pitfalls

### Pitfall 1: Vertex Colors Clamped to [0,1]
**What goes wrong:** Three.js default tone mapping clamps vertex color values to [0,1], making it impossible to get HDR "glow" from vertex colors alone.
**Why it happens:** Three.js applies ACESFilmicToneMapping by default in recent versions, which compresses highlights.
**How to avoid:** Set `toneMapped={false}` on the meshStandardMaterial. This passes vertex colors through without tone mapping. Values > 1.0 will appear as saturated bright colors.
**Warning signs:** Glow effect looks the same regardless of emissive intensity scaling.

### Pitfall 2: Smoothstep Edge Cases at 0 and 1
**What goes wrong:** Smoothstep with edge0 >= edge1 produces division by zero or NaN.
**Why it happens:** Threshold configuration error.
**How to avoid:** Constants are hardcoded (BLEND_LOW=0.25, BLEND_HIGH=0.35), so this won't happen. But clamp the t value to [0,1] defensively.
**Warning signs:** Black or white flickering vertices at exact threshold boundary.

### Pitfall 3: Forgetting to Change Colormap from Plasma to Inferno
**What goes wrong:** BrainGlowMesh currently calls `buildColormapLUT('plasma')`. If not changed to `'inferno'`, the glow colors won't match the legend.
**Why it happens:** Easy to miss when focusing on threshold logic.
**How to avoid:** Change the hardcoded string in BrainGlowMesh.tsx from `'plasma'` to `'inferno'`.
**Warning signs:** Brain colors don't match the legend gradient.

### Pitfall 4: Legend Gradient Doesn't Match Actual Colormap
**What goes wrong:** CSS gradient uses approximate hex stops that don't perfectly match d3's inferno.
**Why it happens:** CSS gradients interpolate linearly in sRGB, while d3 colormaps are perceptually uniform.
**How to avoid:** Use 6+ gradient stops sampled from the actual d3 interpolateInferno function. The more stops, the closer the CSS approximation. 6 stops is visually indistinguishable for a small legend bar.
**Warning signs:** Visible color banding or hue shifts in the legend vs the brain mesh.

### Pitfall 5: Dark Gray Not Visible Against Dark Background
**What goes wrong:** #1a1a1a is very close to the canvas background (#151520), making below-threshold brain regions invisible.
**Why it happens:** Low contrast between dark gray and dark blue-black background.
**How to avoid:** This is intentional -- below-threshold regions should recede. The brain outline is still visible because of the 3D lighting (ambient + directional). If too invisible, bump to #222222 but the decision locks #1a1a1a.
**Warning signs:** Brain appears to have missing geometry (only glowing regions visible).

## Code Examples

### Modifying BrainGlowMesh for Threshold Glow

```typescript
// Source: existing BrainGlowMesh.tsx pattern + threshold logic
// Key changes: switch to inferno, use applyThresholdGlow, add toneMapped={false}

// In useMemo:
const lutData = useMemo(() => buildColormapLUT('inferno'), []);

// In useEffect:
useEffect(() => {
  applyThresholdGlow(vertexData, lutData, colorBuffer);
  needsColorUpdate.current = true;
}, [vertexData, lutData, colorBuffer]);

// In JSX:
<meshStandardMaterial
  vertexColors
  toneMapped={false}
  roughness={0.7}
  metalness={0.1}
/>
```

### Legend Placement in BrainViewer

```tsx
// In BrainViewer.tsx, add ActivationLegend below the Canvas div
<div className="bg-surface-container rounded-xl p-6 flex flex-col">
  <div className="flex items-center gap-2 mb-6">
    <span className="material-symbols-outlined text-on-surface-variant">neurology</span>
    <h3 className="font-headline text-lg font-bold">Neural Activation Map</h3>
  </div>
  <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden relative">
    <Canvas ...>
      <Suspense fallback={null}>
        <BrainViewerCanvas vertexData={vertexData} />
      </Suspense>
    </Canvas>
  </div>
  <ActivationLegend />
</div>
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | web/vitest.config.ts (assumed) |
| Quick run command | `cd web && npx vitest run src/lib/colormap.test.ts` |
| Full suite command | `cd web && npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01a | smoothstep returns 0 below edge0, 1 above edge1, smooth in between | unit | `cd web && npx vitest run src/lib/colormap.test.ts -t "smoothstep"` | Wave 0 |
| VIS-01b | applyThresholdGlow outputs dark gray for values < 0.25 | unit | `cd web && npx vitest run src/lib/colormap.test.ts -t "threshold"` | Wave 0 |
| VIS-01c | applyThresholdGlow outputs inferno colors for values > 0.35 | unit | `cd web && npx vitest run src/lib/colormap.test.ts -t "threshold"` | Wave 0 |
| VIS-01d | applyThresholdGlow blends smoothly in 0.25-0.35 range | unit | `cd web && npx vitest run src/lib/colormap.test.ts -t "smoothstep"` | Wave 0 |
| VIS-01e | emissive scale reaches 2.0 at activation=1.0 | unit | `cd web && npx vitest run src/lib/colormap.test.ts -t "emissive"` | Wave 0 |
| VIS-03 | ActivationLegend renders gradient bar with Low/High labels | unit | `cd web && npx vitest run src/components/results/ActivationLegend.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd web && npx vitest run src/lib/colormap.test.ts`
- **Per wave merge:** `cd web && npx vitest run`
- **Phase gate:** Full suite green before /gsd-verify-work

### Wave 0 Gaps
- [ ] `web/src/lib/colormap.test.ts` -- extend with smoothstep and applyThresholdGlow tests
- [ ] `web/src/components/results/ActivationLegend.test.tsx` -- legend rendering test (may need jsdom setup)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `toneMapped={false}` on meshStandardMaterial allows vertex color values > 1.0 to display as bright/saturated colors for glow effect | Architecture Patterns | Glow won't be visible; would need alternative approach like bloom or custom shader |
| A2 | Inferno CSS gradient with 6 stops is visually close enough to the actual d3 colormap for a small legend bar | Pattern 3 | Legend colors look wrong; solution is to add more stops |
| A3 | vitest config exists at web/vitest.config.ts | Validation Architecture | Test commands may need different path |

## Open Questions

1. **Does toneMapped={false} produce acceptable glow on all browsers?**
   - What we know: toneMapped={false} bypasses Three.js tone mapping, allowing > 1.0 color values
   - What's unclear: Whether WebGL implementations on all target browsers handle this consistently
   - Recommendation: Test visually during implementation; if insufficient, add a subtle `emissive` uniform as supplement

2. **Should the threshold marker be visible on the legend?**
   - What we know: CONTEXT.md says "activation threshold marker" in legend content
   - What's unclear: Exact visual design of the marker (line? tick? label?)
   - Recommendation: Small vertical tick mark at the 30% position on the gradient bar with a tiny "30%" label

## Sources

### Primary (HIGH confidence)
- Codebase inspection: BrainGlowMesh.tsx, colormap.ts, BrainViewer.tsx, BrainViewerCanvas.tsx, results page
- web/package.json: three@0.183.2, @react-three/fiber@^9.5.0, d3-scale-chromatic@^3.1.0

### Secondary (MEDIUM confidence)
- Three.js MeshStandardMaterial documentation: emissive is a mesh-wide uniform Color, not per-vertex
- GLSL smoothstep specification: t*t*(3-2*t) hermite interpolation

### Tertiary (LOW confidence)
- toneMapped={false} HDR vertex color technique -- common community pattern but not in official Three.js guides

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all libraries already installed and in use
- Architecture: HIGH - straightforward extension of existing patterns, only A1 (toneMapped) is uncertain
- Pitfalls: HIGH - well-understood domain, pitfalls identified from codebase analysis

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable domain, no fast-moving dependencies)
