---
phase: 32-3d-brain-viewer
verified: 2026-04-10T16:06:00Z
status: human_needed
score: 4/4
overrides_applied: 0
human_verification:
  - test: "Verify 3D brain renders with glowing regions on the results page"
    expected: "Brain mesh visible with 4 colored regions glowing based on activation scores, bloom effect visible in Regions mode"
    why_human: "WebGL rendering and visual quality cannot be verified programmatically"
  - test: "Verify OrbitControls allow free rotation and zoom"
    expected: "Mouse drag rotates the brain, scroll zooms in/out, pan is disabled"
    why_human: "Interactive 3D controls require manual interaction to verify"
  - test: "Verify brain region colors update when scrubbing video timeline"
    expected: "Moving the video timeline changes region glow intensities in real-time"
    why_human: "Real-time sync between video and 3D visualization requires visual confirmation"
---

# Phase 32: 3D Brain Viewer Verification Report

**Phase Goal:** Interactive 3D brain visualization using react-three-fiber showing brain regions lighting up based on TRIBE v2 activation scores, synced to the video timeline on the results page
**Verified:** 2026-04-10T16:06:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A 3D brain model renders on the results page using react-three-fiber with the fsaverage5 mesh | VERIFIED | BrainViewer dynamically imported with ssr:false in page.tsx (line 28-31), Canvas from @react-three/fiber in BrainViewer.tsx (line 127), useGLTF loads brain-fsaverage5.glb in BrainViewerCanvas.tsx (line 37) |
| 2 | Four brain regions glow independently based on per-segment activation scores | VERIFIED | BrainViewerCanvas iterates REGION_NAMES (attention, reward, emotional_processing, social_cognition) rendering BrainRegionMesh per region (lines 85-98), each receives individual score from regionScores; BrainRegionMesh lerps emissiveIntensity via useFrame (lines 19-25) |
| 3 | The brain visualization syncs with the video timeline -- scrubbing the video updates region colors in real-time | VERIFIED | BrainViewer receives currentTime prop from page state (line 317), calls getRegionsAtTime(segments, currentTime) (line 34), page.tsx wires currentTime from video handleTimeUpdate callback (lines 98-101) |
| 4 | Bloom/glow postprocessing creates a visually striking "lighting up" effect matching the NeuroCut dark theme | VERIFIED | EffectComposer with Bloom rendered in BrainViewerCanvas (lines 123-130), luminanceThreshold=0.2, intensity=1.5, mipmapBlur enabled. Active in regions view mode. Dark theme maintained with background '#151520' and dark emissive materials (#1a1a2e base, #2a2a3e for base mesh) |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/export_brain_glb.py` | Python conversion script: fsaverage5 to GLB | VERIFIED | 5875 bytes, imports build_region_masks from region_mapping.atlas, uses nilearn fetch_surf_fsaverage + load_surf_mesh, trimesh.repair.fix_normals |
| `web/public/models/brain-fsaverage5.glb` | Pre-converted brain mesh for WebGL rendering | VERIFIED | 702KB (under 2MB budget), contains 5 named mesh nodes |
| `web/src/components/results/brain-utils.ts` | getRegionsAtTime helper and REGION_COLORS | VERIFIED | Exports getRegionsAtTime function (line 9), REGION_COLORS with 9 region keys (line 54), imports SegmentData and SegmentRegionScores from SegmentTable |
| `web/src/components/results/__tests__/brain-utils.test.ts` | Unit tests for region score lookup | VERIFIED | 6 tests, all passing (empty array, exact match, gap lookup, before-all, after-all, color constants) |
| `web/src/components/results/BrainViewer.tsx` | Wrapper component with Canvas and legend | VERIFIED | 184 lines, exports BrainViewer, renders Canvas with Suspense, region legend, view mode toggle, colormap selector |
| `web/src/components/results/BrainViewerCanvas.tsx` | R3F Canvas with OrbitControls, lighting, Bloom | VERIFIED | 139 lines, exports BrainViewerCanvas, useGLTF loads GLB, OrbitControls with enablePan=false, EffectComposer with Bloom, preset camera views via imperative handle |
| `web/src/components/results/BrainRegionMesh.tsx` | Individual region mesh with emissive glow | VERIFIED | 58 lines, exports BrainRegionMesh, useFrame lerps emissiveIntensity toward score*2.5, isBase variant with reduced opacity |
| `web/src/app/(app)/results/[id]/page.tsx` | Results page with BrainViewer integration | VERIFIED | Dynamic import with ssr:false (line 28-31), renders `<BrainViewer segments={segments} currentTime={currentTime} />` (line 317) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| results page (page.tsx) | BrainViewer.tsx | dynamic import with ssr:false | WIRED | Line 28-31: `const BrainViewer = dynamic(() => import("@/components/results/BrainViewer").then(m => m.BrainViewer), { ssr: false })` |
| BrainViewerCanvas.tsx | brain-fsaverage5.glb | useGLTF from drei | WIRED | Line 37: `useGLTF('/models/brain-fsaverage5.glb')`, preloaded at line 138 |
| BrainViewer.tsx | brain-utils.ts | imports getRegionsAtTime and REGION_COLORS | WIRED | Line 7: `import { getRegionsAtTime, getVertexDataAtTime, REGION_COLORS } from './brain-utils'` |
| brain-utils.ts | SegmentTable.tsx | imports SegmentData and SegmentRegionScores types | WIRED | Line 1: `import type { SegmentData, SegmentRegionScores } from '@/components/results/SegmentTable'` |
| export_brain_glb.py | atlas.py | imports build_region_masks | WIRED | Line 25: `from region_mapping.atlas import build_region_masks` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| BrainViewer.tsx | regionScores | getRegionsAtTime(segments, currentTime) | Yes -- segments from API fetch in page.tsx (line 119-137) | FLOWING |
| BrainViewerCanvas.tsx | nodes (GLB meshes) | useGLTF('/models/brain-fsaverage5.glb') | Yes -- 702KB GLB file with real fsaverage5 geometry | FLOWING |
| BrainRegionMesh.tsx | score prop | regionScores[regionName] from parent | Yes -- flows from segments data | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| brain-utils tests pass | `npx vitest run brain-utils.test.ts` | 6/6 tests passing | PASS |
| R3F dependencies installed | grep package.json | three, @react-three/fiber, @react-three/drei, @react-three/postprocessing all present | PASS |
| GLB file exists and under budget | ls -la brain-fsaverage5.glb | 702KB, well under 2MB | PASS |
| TypeScript compiles without errors | npx tsc --noEmit (filtered to brain files) | No errors | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| RSLT-03 | 32-01, 32-02 | 3D brain visualization on results page | SATISFIED | Full BrainViewer component with R3F rendering, region glow, timeline sync, bloom postprocessing |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | No TODO, FIXME, placeholder, or stub patterns found in any brain component files |

### Human Verification Required

### 1. Visual 3D Brain Rendering

**Test:** Start dev server (`cd web && npm run dev`), navigate to a completed analysis result page
**Expected:** 3D brain mesh visible with dark theme, 4 colored regions glowing based on activation scores. In "Regions" mode, bloom postprocessing creates visible halo around bright regions.
**Why human:** WebGL rendering quality and visual aesthetics cannot be verified programmatically

### 2. OrbitControls Interaction

**Test:** Click and drag on the brain to rotate, scroll to zoom
**Expected:** Free rotation on all axes, zoom between min/max distance limits (100-400), no panning, smooth damping. Preset view buttons (Front, Top, Left, Right) snap to correct angles.
**Why human:** Interactive 3D controls require manual interaction

### 3. Timeline Sync

**Test:** Play the video or scrub the timeline while watching the brain
**Expected:** Region glow intensities change in real-time as currentTime updates, smooth lerp transitions between intensity levels
**Why human:** Real-time synchronization between video and 3D visualization requires visual confirmation

### Gaps Summary

No automated verification gaps found. All 4 roadmap success criteria are satisfied at the code level. Three items require human visual verification of the 3D rendering, interaction controls, and timeline synchronization.

**Note on RegionBreakdown/RegionValuesBar:** The Plan 02 acceptance criteria expected these components to remain on the results page. They have been removed by later phases (33-37) in favor of the BrainViewer's built-in region legend with toggle buttons and live scores. This is an intentional design evolution, not a gap.

---

_Verified: 2026-04-10T16:06:00Z_
_Verifier: Claude (gsd-verifier)_
