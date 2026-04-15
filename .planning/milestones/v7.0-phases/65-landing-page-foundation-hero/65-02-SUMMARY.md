---
phase: 65-landing-page-foundation-hero
plan: 02
subsystem: landing-page-hero
tags: [3d-brain, three-js, r3f, decorative, hero, brutalist]
dependency_graph:
  requires: [data-landing-tokens, landing-button-variant, auth-gated-root-route]
  provides: [brain-hero-component, brutalist-hero-section]
  affects: [web/src/components/hero/HeroOdyssey.tsx, web/src/components/hero/BrainHero.tsx]
tech_stack:
  added: []
  patterns: [decorative-r3f-canvas, useframe-auto-rotation, vertex-color-shimmer, webgl-context-cleanup]
key_files:
  created:
    - web/src/components/hero/BrainHero.tsx
  modified:
    - web/src/components/hero/HeroOdyssey.tsx
decisions:
  - "Camera distance 190 reused from existing BrainViewer (GLB model is brain-scale, not unit-scale)"
  - "Auto-rotation via useFrame on group ref instead of OrbitControls for zero user interaction"
  - "Kept client-side auth check in HeroOdyssey as defense-in-depth (server redirect handles logged-in users)"
metrics:
  duration: 93s
  completed: "2026-04-15T19:12:11Z"
---

# Phase 65 Plan 02: BrainHero 3D Component & Hero Integration Summary

Decorative 3D brain canvas with auto-rotation, white vertex shimmer, and bloom postprocessing, integrated into HeroOdyssey replacing LightningShader background with brutalist landing button variant.

## What Was Done

### Task 1: Create BrainHero decorative 3D brain component
- **Commit:** c2f2c29
- **Files:** `web/src/components/hero/BrainHero.tsx` (new, 135 lines)
- Created standalone decorative brain canvas: R3F Canvas with useGLTF loading the existing brain-fsaverage5-unified.glb model
- DecorativeBrainMesh inner component: clones geometry, applies dynamic vertex colors via useFrame shimmer loop (spatial sine wave, grayscale 0.32-0.38 range)
- RotatingGroup wrapper: useFrame-based auto-rotation at delta * 0.3 speed (no OrbitControls)
- Bloom postprocessing: luminanceThreshold 0.6, intensity 1.5, radius 0.8, mipmapBlur
- MeshStandardMaterial: vertexColors, emissive white at 0.15, base color #333333
- WebGL context cleanup on unmount (WEBGL_lose_context pattern from BrainViewer)
- prefers-reduced-motion: detects via matchMedia, disables rotation when active
- Suspense fallback={null} for non-blocking GLB load
- useGLTF.preload at module level for eager loading
- aria-hidden="true" on wrapper div (decorative only)

### Task 2: Evolve HeroOdyssey to use BrainHero and landing button variant
- **Commit:** 0335ee0
- **Files:** `web/src/components/hero/HeroOdyssey.tsx` (modified)
- Replaced LightningShader import and render with BrainHero
- Updated CTA button from variant="primary" to variant="landing" (ghost/outline brutalist style)
- Removed purple glow shadow class (shadow-[0_0_30px_-5px_rgba(186,158,255,0.5)])
- Updated gradient overlay from via-transparent to-rgba to via-black/20 to-black/60 for text legibility over brain
- Preserved all animations, header, footer, feature pills, and auth logic

### Task 3: Visual verification (checkpoint:human-verify)
- **Status:** Not executed -- requires human visual verification at http://localhost:3000/

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all code is fully wired and functional.

## Self-Check: PASSED
