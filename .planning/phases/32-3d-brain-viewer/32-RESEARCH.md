# Phase 32: 3D Brain Viewer - Research

**Researched:** 2026-04-10
**Domain:** 3D visualization (react-three-fiber), brain mesh conversion (nilearn/trimesh), postprocessing (bloom/glow)
**Confidence:** HIGH

## Summary

This phase adds an interactive 3D brain visualization to the results page. The core work spans two domains: (1) a Python conversion script that exports the fsaverage5 cortical mesh from nilearn into a GLB file with four named mesh groups matching NeuroCut's regions, and (2) a React component using react-three-fiber that loads the GLB, colors each region based on per-segment activation scores synced to `currentTime`, and applies bloom postprocessing for the "lighting up" effect.

The react-three-fiber ecosystem (R3F + drei + postprocessing) is the standard for 3D in React and has first-class React 19 support. The fsaverage5 mesh is ~20K vertices total -- trivially small for WebGL. The GLB will be under 1MB. The main complexity is the mesh conversion pipeline (mapping Destrieux atlas parcels to four mesh groups) and wiring the activation scores to emissive material properties with smooth interpolation.

**Primary recommendation:** Use `@react-three/fiber` 9.x + `@react-three/drei` 10.x + `@react-three/postprocessing` 3.x. Build the conversion script with nilearn + trimesh + pygltflib. Dynamic-import the BrainViewer with `ssr: false` following existing project patterns.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Stylized/abstract aesthetic -- smooth geometry, geometric feel, "tech product" look. NOT clinical/anatomical with realistic wrinkles.
- **D-02:** Separate section on the results page. Does NOT replace RegionBreakdown bar charts.
- **D-03:** Full OrbitControls -- users can freely rotate and zoom the brain. No locked camera angles.
- **D-04:** Use actual fsaverage5 mesh (~20K vertices, scientifically accurate). Python conversion pipeline (nilearn + trimesh) to export fsaverage5 -> GLB with 4 named region groups mapped from `src/region_mapping/atlas.py`.
- **D-05:** Four regions independently colored/glowing: attention, reward, emotional_processing, social_cognition.
- **D-06:** Brain region colors update in real-time as user scrubs video timeline. Uses same `currentTime` + `segments` data.

### Claude's Discretion
- Color palette for region glow (align with NeuroCut theme -- purple, cyan, green)
- Bloom/postprocessing intensity levels
- Region labels: overlaid on 3D model vs. legend
- Camera default position and zoom limits
- Loading state while GLB mesh loads

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RSLT-03 | Interactive visualization of brain activation data on results page | R3F ecosystem provides GLB loading, OrbitControls, bloom postprocessing. fsaverage5 mesh exported via Python script. Timeline sync via existing `currentTime`/`segments` props. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | 0.183.2 | 3D rendering engine | Latest stable. Required peer dep for R3F ecosystem. [VERIFIED: npm registry] |
| @react-three/fiber | 9.5.0 | React renderer for Three.js | Standard React 3D library. Supports React 19. [VERIFIED: npm registry, peerDeps confirm react >=19 <19.3] |
| @react-three/drei | 10.7.7 | R3F helper components | Provides useGLTF, OrbitControls, Html, Center, etc. Requires R3F ^9.0.0. [VERIFIED: npm registry] |
| @react-three/postprocessing | 3.0.4 | Bloom/glow effects | Wraps postprocessing library for R3F. Provides EffectComposer + Bloom. [VERIFIED: npm registry] |

### Python Conversion (one-time script, not deployed)
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| nilearn | 0.12.1 | Load fsaverage5 mesh + Destrieux atlas | Already installed. Used by existing atlas.py. [VERIFIED: pip3 show] |
| trimesh | latest | Mesh manipulation + GLB export | Standard mesh processing library. Export submeshes as named nodes in GLB. [ASSUMED] |
| numpy | (existing) | Array operations for vertex masking | Already a project dependency. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GLB file | Inline geometry from JSON vertex data | GLB is standard, compressed, and drei's useGLTF handles it with caching. JSON would require manual BufferGeometry construction. |
| @react-three/postprocessing | Custom ShaderMaterial emissive | Postprocessing bloom is more visually striking and easier to tune. Custom shaders are harder to maintain. |
| trimesh for GLB export | pygltflib directly | trimesh is higher-level and handles mesh → GLB pipeline more cleanly. |

**Installation:**
```bash
# Web dependencies
cd web && npm install three @react-three/fiber @react-three/drei @react-three/postprocessing

# Python conversion script (one-time)
pip install trimesh
```

## Architecture Patterns

### Recommended Project Structure
```
web/src/components/results/
  BrainViewer.tsx          # Main wrapper (dynamic imported, ssr: false)
  BrainViewerCanvas.tsx    # Canvas + scene setup (EffectComposer, OrbitControls)
  BrainRegionMesh.tsx      # Individual region mesh with emissive material
  brain-utils.ts           # getRegionsAtTime helper (reuse from RegionValuesBar pattern)

web/public/models/
  brain-fsaverage5.glb     # Converted mesh with 4 named region groups

scripts/
  export_brain_glb.py      # One-time conversion: fsaverage5 → GLB
```

### Pattern 1: Dynamic Import with SSR Disabled
**What:** Three.js cannot run server-side. Use next/dynamic with `ssr: false`.
**When to use:** Always for any R3F component.
**Example:**
```typescript
// Source: Existing project pattern (NeuralTimeline, VideoPlayer)
const BrainViewer = dynamic(
  () => import("@/components/results/BrainViewer").then(m => m.BrainViewer),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-[400px]" /> }
);
```

### Pattern 2: GLB Loading with useGLTF
**What:** Load the brain mesh from a GLB file. drei's `useGLTF` handles caching automatically.
**When to use:** For loading the pre-converted brain mesh.
**Example:**
```typescript
// Source: @react-three/drei useGLTF pattern [ASSUMED - standard drei API]
import { useGLTF } from '@react-three/drei';

function BrainModel({ regionScores }: { regionScores: Record<string, number> }) {
  const { nodes } = useGLTF('/models/brain-fsaverage5.glb');
  // nodes.attention, nodes.reward, nodes.emotional_processing, nodes.social_cognition
  return (
    <group>
      {Object.entries(nodes).map(([name, mesh]) => (
        <BrainRegionMesh key={name} geometry={mesh.geometry} score={regionScores[name] ?? 0} />
      ))}
    </group>
  );
}
```

### Pattern 3: Emissive Material for Glow Effect
**What:** Use MeshStandardMaterial with `emissive` and `emissiveIntensity` driven by activation score. Combined with bloom postprocessing, this creates the "brain lighting up" effect.
**When to use:** For each region mesh.
**Example:**
```typescript
// Source: Three.js MeshStandardMaterial + R3F postprocessing pattern [ASSUMED]
function BrainRegionMesh({ geometry, score, color }: Props) {
  const emissiveIntensity = score * 2.5; // Scale 0-1 score to visible glow
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#1a1a2e"
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        roughness={0.6}
        metalness={0.3}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}
```

### Pattern 4: Bloom Postprocessing
**What:** EffectComposer with Bloom creates the glow halo around emissive regions.
**Example:**
```typescript
// Source: @react-three/postprocessing Bloom pattern [ASSUMED]
import { EffectComposer, Bloom } from '@react-three/postprocessing';

<Canvas>
  <BrainModel regionScores={scores} />
  <EffectComposer>
    <Bloom
      luminanceThreshold={0.2}
      luminanceSmoothing={0.9}
      intensity={1.5}
      mipmapBlur
    />
  </EffectComposer>
</Canvas>
```

### Pattern 5: Region Score Interpolation (reuse existing)
**What:** The `getRegionsAtTime` function in `RegionValuesBar.tsx` already solves the problem of mapping `currentTime` + `segments` to region scores. Extract or duplicate this utility.
**Example:**
```typescript
// Source: web/src/components/results/RegionValuesBar.tsx (lines 13-30) [VERIFIED: codebase]
function getRegionsAtTime(segments: SegmentData[], time: number): SegmentRegionScores | null {
  // finds segment containing time, or closest segment
  // Returns { attention, reward, emotional_processing, social_cognition }
}
```

### Anti-Patterns to Avoid
- **Re-creating Canvas per render:** The `<Canvas>` component should be stable. Never conditionally mount/unmount it -- use visibility or opacity instead.
- **Loading GLB inside useEffect:** Use `useGLTF` (drei) which integrates with React Suspense, not manual loading.
- **Animating with setState on every frame:** Use `useFrame` hook from R3F for per-frame updates (material properties, camera). React state re-renders are too expensive for 60fps.
- **Forgetting to preload GLB:** Call `useGLTF.preload('/models/brain-fsaverage5.glb')` at module level to start loading before component mounts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GLB loading + caching | Manual fetch + BufferGeometry | `useGLTF` from drei | Handles caching, Suspense, typed nodes |
| Orbit camera controls | Manual mouse event handlers | `OrbitControls` from drei | Touch support, damping, zoom limits built in |
| Bloom/glow effect | Custom fragment shaders | `EffectComposer` + `Bloom` from @react-three/postprocessing | Physically-based bloom with mipmapBlur, tunable parameters |
| Mesh conversion | Manual vertex buffer construction | trimesh + nilearn in Python | Handle normals, face winding, GLB binary format correctly |

**Key insight:** The R3F ecosystem has solved all the plumbing problems. The actual work is (a) the mesh conversion script and (b) wiring activation scores to material properties.

## Common Pitfalls

### Pitfall 1: SSR Crash with Three.js
**What goes wrong:** Next.js tries to render Three.js on server, crashes because `window`/`document` don't exist.
**Why it happens:** Three.js accesses DOM APIs at import time.
**How to avoid:** Dynamic import with `ssr: false`. Already an established pattern in this project.
**Warning signs:** "window is not defined" error during build.

### Pitfall 2: GLB Named Nodes Not Found
**What goes wrong:** `useGLTF` returns `nodes` object but region names don't match expected keys.
**Why it happens:** GLB export didn't name meshes correctly, or trimesh uses different naming conventions.
**How to avoid:** In the conversion script, explicitly set mesh names. After export, verify with `npx gltf-transform inspect brain-fsaverage5.glb` or load in https://gltf-viewer.donmccurdy.com/.
**Warning signs:** `nodes.attention` is undefined.

### Pitfall 3: Bloom Affecting Entire Scene
**What goes wrong:** Bloom makes everything glow, not just the brain regions.
**Why it happens:** Bloom applies to all luminous pixels above threshold.
**How to avoid:** Set `luminanceThreshold` high enough that only emissive regions trigger bloom. Keep background/base material dark (low luminance). Alternatively, use selective bloom with layers.
**Warning signs:** Ambient light or background bleeds through bloom.

### Pitfall 4: Performance on Low-End Devices
**What goes wrong:** Postprocessing with bloom causes frame drops.
**Why it happens:** Bloom requires multiple render passes with mipmapBlur.
**How to avoid:** The brain mesh is only ~20K vertices -- geometry is not the issue. Keep bloom resolution reasonable. Use `mipmapBlur` (more efficient than Kawase). Consider `dpr={[1, 1.5]}` on Canvas to limit pixel ratio.
**Warning signs:** FPS < 30 on integrated GPUs.

### Pitfall 5: Vertex Winding / Normals in Conversion
**What goes wrong:** Mesh appears inside-out or has dark patches.
**Why it happens:** nilearn surface meshes may have inconsistent face winding. trimesh can fix this.
**How to avoid:** In the conversion script, call `trimesh.repair.fix_normals(mesh)` and `trimesh.repair.fix_winding(mesh)` before export.
**Warning signs:** Brain looks like a black silhouette or has visual artifacts.

### Pitfall 6: Region Color Jumping Between Segments
**What goes wrong:** Brain color snaps abruptly when crossing segment boundaries.
**Why it happens:** `getRegionsAtTime` returns the nearest segment's scores -- no interpolation between segments.
**How to avoid:** Add linear interpolation (lerp) between adjacent segments' scores when currentTime is near a boundary. Use `useFrame` to smoothly transition material emissive values.
**Warning signs:** Visual "popping" during playback.

## Code Examples

### Python Conversion Script Pattern
```python
# Source: nilearn fetch_surf_fsaverage + trimesh GLB export [ASSUMED pattern]
import numpy as np
import trimesh
from nilearn.datasets import fetch_surf_fsaverage
from region_mapping.atlas import build_region_masks

# Load fsaverage5 mesh
fsaverage = fetch_surf_fsaverage(mesh='fsaverage5')
coords_left, faces_left = nibabel.load(fsaverage['pial_left']).darrays  # or similar
coords_right, faces_right = nibabel.load(fsaverage['pial_right']).darrays

# Combine hemispheres
coords = np.vstack([coords_left, coords_right])
faces_right_offset = faces_right + len(coords_left)
faces = np.vstack([faces_left, faces_right_offset])

# Build region masks
masks = build_region_masks()  # from existing atlas.py

# Create submeshes per region
scene = trimesh.Scene()
for region_name, mask in masks.items():
    # Extract faces where all 3 vertices are in the region
    region_face_mask = mask[faces].all(axis=1)
    region_faces = faces[region_face_mask]
    # Re-index vertices
    submesh = trimesh.Trimesh(vertices=coords, faces=region_faces)
    submesh.remove_unreferenced_vertices()
    trimesh.repair.fix_normals(submesh)
    scene.add_geometry(submesh, node_name=region_name)

# Also add "base" mesh (vertices not in any region) for the rest of the brain
all_region_mask = np.any(list(masks.values()), axis=0)
base_mask = ~all_region_mask
# ... similar extraction for base mesh ...

scene.export('web/public/models/brain-fsaverage5.glb')
```

### BrainViewer Component Pattern
```typescript
// Source: R3F + drei + postprocessing standard pattern [ASSUMED]
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { type SegmentData, type SegmentRegionScores } from '@/components/results/SegmentTable';

const REGION_COLORS: Record<keyof SegmentRegionScores, string> = {
  attention: '#60a5fa',       // blue
  reward: '#a78bfa',          // purple
  emotional_processing: '#f472b6',  // pink
  social_cognition: '#fbbf24',      // amber
};

interface BrainViewerProps {
  segments: SegmentData[];
  currentTime: number;
}

export function BrainViewer({ segments, currentTime }: BrainViewerProps) {
  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden glass-surface ghost-border">
      <Canvas camera={{ position: [0, 0, 200], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.1} />
        <directionalLight position={[5, 5, 5]} intensity={0.3} />
        <Center>
          <BrainModel segments={segments} currentTime={currentTime} />
        </Center>
        <OrbitControls
          enablePan={false}
          minDistance={120}
          maxDistance={350}
          autoRotate
          autoRotateSpeed={0.5}
        />
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} intensity={1.5} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/brain-fsaverage5.glb');
```

### Region Color Mapping (recommended palette)
```typescript
// Align with existing RegionValuesBar colors [VERIFIED: web/src/components/results/RegionValuesBar.tsx]
const REGION_DISPLAY = {
  attention:             { label: 'Attention',   color: '#60a5fa' },  // blue
  reward:                { label: 'Reward',      color: '#a78bfa' },  // purple (NeuroCut primary)
  emotional_processing:  { label: 'Emotional',   color: '#f472b6' },  // pink
  social_cognition:      { label: 'Social',      color: '#fbbf24' },  // amber
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-three-fiber v8 | v9.x (React 19 support) | Late 2024 | v9 required for React 19. Project uses React 19.2.4. |
| pmndrs/postprocessing v2 | v3.x | 2025 | New API for selective bloom, better perf |
| drei v9 | v10.x | 2025 | Paired with R3F v9, new hooks |

**Deprecated/outdated:**
- `extend()` from R3F is no longer needed in v9 -- Three.js elements auto-registered.
- drei's old `useGLTF` with `draco` option -- DracoLoader now auto-detected. [ASSUMED]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | trimesh can export GLB with named mesh nodes that drei's `useGLTF` reads as `nodes.{name}` | Architecture Patterns | HIGH -- if names don't round-trip, need pygltflib or gltf-transform to rename nodes |
| A2 | fsaverage5 pial surface can be loaded via nilearn's `fetch_surf_fsaverage('fsaverage5')` and combined into a single mesh | Code Examples | MEDIUM -- exact API for loading surface coords/faces may differ; nibabel may be needed |
| A3 | Bloom `luminanceThreshold` can isolate region glow without affecting the base brain mesh | Pitfalls | LOW -- worst case, use selective bloom with Three.js layers |
| A4 | @react-three/postprocessing v3 API uses same `<EffectComposer><Bloom>` pattern as v2 | Code Examples | LOW -- major API changes would be documented |

## Open Questions

1. **Exact nilearn API for surface mesh coordinates**
   - What we know: `fetch_surf_fsaverage` returns paths to surface files. `atlas.py` uses `fetch_atlas_surf_destrieux` for labels.
   - What's unclear: Whether to use nibabel or nilearn's `load_surf_mesh` to get vertex coordinates and face indices.
   - Recommendation: The conversion script implementer should test both approaches. nilearn's `load_surf_mesh` is the simpler path.

2. **"Base" brain mesh (non-region vertices)**
   - What we know: The 4 regions cover a subset of the ~20K vertices. The rest of the cortex needs a subtle base mesh.
   - What's unclear: Whether to include ALL vertices as a transparent base mesh, or only region vertices.
   - Recommendation: Include the full brain as a dark, low-opacity base mesh with a separate "base" node in the GLB. This gives anatomical context without distracting from region glow.

3. **Region label display strategy**
   - What we know: User left this to Claude's discretion.
   - Recommendation: Use a small legend below the 3D canvas (not overlaid on the model). Overlaid labels via drei's `<Html>` component would occlude the brain during rotation. A simple legend with colored dots matches the RegionValuesBar pattern already in use.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| nilearn | Mesh conversion script | Yes | 0.12.1 | -- |
| trimesh | Mesh conversion script | No | -- | Install via `pip install trimesh` |
| Node.js | Web development | Yes | (project already running) | -- |
| npm | Package install | Yes | (project already running) | -- |

**Missing dependencies with no fallback:**
- None (trimesh is easily installable)

**Missing dependencies with fallback:**
- trimesh: Not installed but `pip install trimesh` is straightforward. Only needed for the one-time conversion script.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | `web/vitest.config.ts` |
| Quick run command | `cd web && npx vitest run --reporter=verbose` |
| Full suite command | `cd web && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RSLT-03a | BrainViewer renders without crashing (smoke) | unit | `cd web && npx vitest run src/components/results/__tests__/BrainViewer.test.ts -x` | No -- Wave 0 |
| RSLT-03b | getRegionsAtTime returns correct scores for given time | unit | `cd web && npx vitest run src/components/results/__tests__/brain-utils.test.ts -x` | No -- Wave 0 |
| RSLT-03c | Region score interpolation handles edge cases (empty segments, boundary times) | unit | Same as above | No -- Wave 0 |
| RSLT-03d | GLB conversion produces valid file with 4+ named nodes | manual-only | Run script + inspect output | -- |
| RSLT-03e | Bloom postprocessing renders visually | manual-only | Visual inspection in browser | -- |

### Sampling Rate
- **Per task commit:** `cd web && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd web && npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `web/src/components/results/__tests__/brain-utils.test.ts` -- covers RSLT-03b, RSLT-03c (region score lookup utility)
- [ ] Three.js components are difficult to unit test -- R3F render tests require `@react-three/test-renderer` or jsdom with WebGL mocking. Recommend focusing unit tests on the data/utility layer, not the 3D rendering.

## Security Domain

No security concerns for this phase. It is a purely client-side visualization component:
- No user input beyond mouse interaction (orbit controls)
- GLB is a static asset served from `/public`
- No API calls, no authentication, no data mutation
- Region scores come from already-authenticated results page data

## Sources

### Primary (HIGH confidence)
- npm registry -- verified versions: three@0.183.2, @react-three/fiber@9.5.0, @react-three/drei@10.7.7, @react-three/postprocessing@3.0.4
- npm registry -- verified peer dependencies: R3F requires React >=19 <19.3, three >=0.156
- Project codebase -- RegionValuesBar.tsx (data pattern), globals.css (design tokens), results page (integration point), atlas.py (region mapping)
- pip3 show nilearn -- version 0.12.1 installed

### Secondary (MEDIUM confidence)
- R3F ecosystem API patterns (useGLTF, OrbitControls, EffectComposer, Bloom) -- based on established documentation patterns

### Tertiary (LOW confidence)
- trimesh GLB export with named nodes -- needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- versions verified against npm registry, peer deps confirmed compatible with React 19
- Architecture: HIGH -- follows existing project patterns (dynamic import, props drilling), R3F ecosystem is well-established
- Pitfalls: HIGH -- common Three.js/R3F pitfalls are well-documented in community
- Mesh conversion: MEDIUM -- exact nilearn/trimesh API for fsaverage5 surface loading needs testing

**Research date:** 2026-04-10
**Valid until:** 2026-05-10 (stable ecosystem, no breaking changes expected)
