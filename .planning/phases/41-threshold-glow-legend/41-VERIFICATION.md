---
phase: 41-threshold-glow-legend
verified: 2026-04-11T00:48:30Z
status: human_needed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Brain regions glow visually above threshold"
    expected: "High-activation areas show warm inferno colors with visible glow brightness above neutral gray; low-activation areas appear as dark gray (#1a1a1a) with no visible color"
    why_human: "Glow appearance requires rendering the 3D scene with actual vertex data — cannot verify visual output programmatically"
  - test: "Smoothstep blend is smooth (no hard-edge popping)"
    expected: "At the threshold boundary (~30% activation), the transition from dark gray to colored glow is a smooth gradient with no visible sharp line or flickering artifact"
    why_human: "Requires visual inspection of the rendered brain mesh during playback to confirm hermite blending prevents step artifacts"
  - test: "ActivationLegend renders below the brain viewer"
    expected: "A horizontal inferno gradient bar appears below the 3D canvas with 'Low' label on the left, 'High' on the right, and a white vertical line marker labeled '30%' at the 30% position"
    why_human: "CSS linear-gradient and absolute-positioned DOM elements require browser rendering to confirm layout and visual output"
  - test: "Legend is completely non-interactive"
    expected: "Hovering, clicking, or tapping anywhere on the legend produces no visual response, tooltip, or state change"
    why_human: "Confirming absence of interactivity requires manual browser testing"
---

# Phase 41: Threshold Glow & Legend Verification Report

**Phase Goal:** Brain regions glow dynamically above an activation threshold while below-threshold vertices stay dark, and a static legend explains the color mapping
**Verified:** 2026-04-11T00:48:30Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Vertices with activation >= 0.35 display inferno-mapped colors with emissive intensity scaling up to 2x | VERIFIED | `applyThresholdGlow` in `colormap.ts` lines 118-139: blend=1.0 above BLEND_HIGH (0.35), emissiveScale reaches 2.0 at value=1.0. Test at line 171 confirms HDR output >1.0 at value=1.0. 18/18 tests pass. |
| 2 | Vertices with activation <= 0.25 display dark gray (#1a1a1a) | VERIFIED | `smoothstep(0.25, 0.35, x)` returns 0 for x<=0.25; output is `DARK_GRAY` (0x1a/255 = ~0.102). Tests at lines 139-157 confirm values 0.0 and 0.2 both produce DARK_GRAY. |
| 3 | Vertices in the 0.25-0.35 range smoothly blend between dark gray and inferno color | VERIFIED | `smoothstep` hermite curve t*t*(3-2*t) is applied. Test at line 181 confirms value 0.30 (midpoint) differs from pure dark gray by >0.01. |
| 4 | The brain mesh uses inferno colormap, not plasma | VERIFIED | `BrainGlowMesh.tsx` line 20: `buildColormapLUT('inferno')`. `applyColormapFromLUT` not present in the file (confirmed by grep). |
| 5 | Glow effect is visible via toneMapped={false} allowing HDR vertex colors | VERIFIED | `BrainGlowMesh.tsx` line 67: `toneMapped={false}` on meshStandardMaterial. |
| 6 | A horizontal gradient bar showing the inferno colormap appears below the brain viewer | VERIFIED* | `ActivationLegend.tsx` line 10: `linear-gradient(to right, #000004 0%, #420a68 20%, #932667 40%, #dd513a 60%, #fca50a 80%, #fcffa4 100%)`. Wired into `BrainViewer.tsx` line 46: `<ActivationLegend />`. *Requires human for visual confirmation. |
| 7 | The legend has 'Low' and 'High' text labels at the left and right ends | VERIFIED | `ActivationLegend.tsx` lines 4 and 24: "Low" and "High" spans present. |
| 8 | A threshold marker at the 30% position is visible on the gradient bar | VERIFIED | `ActivationLegend.tsx` lines 13-22: absolute-positioned white bar `style={{ left: '30%' }}` and "30%" label below. |
| 9 | The legend is fully static — no hover, click, or tooltip interactions | VERIFIED | No `onClick`, `onMouseEnter`, `onHover`, `onPointer`, `useState`, `useEffect`, or `useRef` found in `ActivationLegend.tsx`. No 'use client' directive. |

*Score: 9/9 truths verified (automated). 4 items also need human visual confirmation.*

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `web/src/lib/colormap.ts` | smoothstep, applyThresholdGlow, THRESHOLD/BLEND/DARK_GRAY/MAX_EMISSIVE constants | VERIFIED | All exports present at lines 75-95, 111-141. Existing functions (buildColormapLUT, applyColormapFromLUT, applyColormap) preserved. |
| `web/src/lib/colormap.test.ts` | Unit tests for smoothstep, threshold glow, emissive scaling | VERIFIED | 12 new tests in describe blocks `smoothstep` (lines 114-134) and `applyThresholdGlow` (lines 136-203). 18/18 total tests pass. |
| `web/src/components/results/BrainGlowMesh.tsx` | Inferno LUT, applyThresholdGlow, toneMapped={false} | VERIFIED | All three present. Import on line 8, LUT on line 20, usage in useEffect line 51, material on lines 65-70. |
| `web/src/components/results/ActivationLegend.tsx` | Static inferno gradient legend component | VERIFIED | Created. Exports `ActivationLegend` at line 1. Fully static: no hooks, no state, no event handlers. |
| `web/src/components/results/BrainViewer.tsx` | BrainViewer with ActivationLegend below Canvas | VERIFIED | Import at line 6. `<ActivationLegend />` at line 46, after the Canvas wrapper div and before the outer div closes. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `BrainGlowMesh.tsx` | `colormap.ts` | `import { applyThresholdGlow, buildColormapLUT }` | WIRED | Line 8. `applyThresholdGlow` called in useEffect (line 51). `buildColormapLUT('inferno')` in useMemo (line 20). |
| `BrainViewer.tsx` | `ActivationLegend.tsx` | `import { ActivationLegend }` | WIRED | Line 6. `<ActivationLegend />` rendered at line 46. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `BrainGlowMesh.tsx` | `vertexData` prop (Float32Array) | Parent passes decoded vertex activation values from `decodeVertexData()` | Yes — `applyThresholdGlow(vertexData, lutData, colorBuffer)` writes to color buffer, `colorAttr.needsUpdate = true` uploads to GPU per frame | FLOWING |
| `ActivationLegend.tsx` | None | Hardcoded inferno gradient stops and 30% marker — by design (static component) | N/A — fully static, no dynamic data required | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| smoothstep(0.25, 0.35, 0.30) = 0.5 | `node -e "const {smoothstep}=require('./web/src/lib/colormap.ts')"` (tested via vitest) | 18/18 tests pass including smoothstep midpoint case | PASS |
| All colormap tests pass (no regressions) | `cd web && npx vitest run src/lib/colormap.test.ts` | 18/18 passed (6 existing + 12 new) | PASS |
| Full test suite (no regressions) | `cd web && npx vitest run` | 66/66 passed across 6 test files | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| VIS-01 | 41-01-PLAN.md | Brain regions glow only above an activation threshold — below-threshold vertices appear dark | SATISFIED | `applyThresholdGlow` in `colormap.ts` + `BrainGlowMesh.tsx` integration with `toneMapped={false}`. All threshold behavior unit-tested. |
| VIS-03 | 41-02-PLAN.md | Static non-interactive color legend shows which color maps to which activation level | SATISFIED | `ActivationLegend.tsx` is a zero-hook, zero-handler static component with inferno gradient, Low/High labels, and 30% threshold marker. Wired into `BrainViewer.tsx`. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

Scanned: `colormap.ts`, `colormap.test.ts`, `BrainGlowMesh.tsx`, `ActivationLegend.tsx`, `BrainViewer.tsx`. No TODO/FIXME, placeholder returns, empty implementations, or hardcoded empty state that flows to rendering.

### Human Verification Required

#### 1. Brain regions glow visually above threshold

**Test:** Open the results page with a video that has high-activation segments. Observe the 3D brain mesh during playback.
**Expected:** High-activation vertices (>= 35% normalized) display warm inferno colors (orange/yellow) at higher brightness than the scene baseline. Low-activation vertices (<= 25%) appear as flat dark gray (#1a1a1a) with no warm tint.
**Why human:** HDR vertex colors above 1.0 (emissive scale 2x) require actual Three.js rendering with `toneMapped={false}` to confirm visual glow effect. Cannot be verified by grep or test output.

#### 2. Smoothstep blend is smooth (no hard-edge popping)

**Test:** During playback, scrub the video timeline across a segment boundary and observe the brain mesh at the threshold activation level (~30%).
**Expected:** The transition zone (25%-35% activation) shows a smooth gradient between dark gray and inferno color with no visible hard line or flickering step artifact.
**Why human:** Visual smoothness of the hermite curve requires rendering the mesh and observing the boundary region. Unit tests confirm the math is correct but cannot confirm perceptual smoothness.

#### 3. ActivationLegend renders correctly below the brain viewer

**Test:** Navigate to the results page and inspect the brain viewer section.
**Expected:** A horizontal gradient bar appears directly below the 3D canvas. Left end is near-black (#000004), progressing through purple, red-orange, yellow to bright yellow (#fcffa4). "Low" label is left-flanking, "High" is right-flanking. A thin white vertical line sits at the 30% position with a "30%" label below it.
**Why human:** CSS `linear-gradient` and absolute-positioned threshold marker require browser rendering to confirm the layout matches the spec. Tailwind classes (h-3, rounded-full, flex-1, etc.) require the design system to be loaded.

#### 4. Legend is completely non-interactive

**Test:** Hover over the gradient bar, click on it, and tap on the threshold marker (on mobile if available).
**Expected:** No hover effect, no cursor change, no tooltip, no click response, no color change on any part of the legend.
**Why human:** Confirming absence of browser default behaviors (e.g., text selection, link highlighting) and confirming no CSS hover rules exist requires manual browser interaction.

### Gaps Summary

No gaps. All 9 observable truths are verified in the codebase. The 4 human verification items are standard visual/behavioral checks that cannot be automated — they confirm the correct code actually renders correctly in the browser, which is expected for a Three.js + CSS phase.

---

_Verified: 2026-04-11T00:48:30Z_
_Verifier: Claude (gsd-verifier)_
