# Phase 65: Landing Page Foundation & Hero - Research

**Researched:** 2026-04-15
**Domain:** Next.js App Router landing page with Three.js/R3F decorative 3D brain, brutalist design system
**Confidence:** HIGH

## Summary

This phase converts the root route (`/`) from a dashboard redirect into a full landing page with a 3D brain hero. The codebase already has every major dependency installed and working: `@react-three/fiber` 9.5, `@react-three/drei` 10.7, `@react-three/postprocessing` 3.0, `framer-motion` 12.38, Tailwind CSS 4 with `@theme` tokens, and the brain GLB model. The existing `HeroOdyssey.tsx` component already contains the exact headline, subhead, CTA, feature pills, header, and footer -- it just needs its background swapped from `LightningShader` to a decorative `BrainHero` canvas, and the color palette scoped to grayscale via `[data-landing]` CSS overrides.

The primary engineering work is: (1) creating a simplified `BrainHero` wrapper that renders the brain mesh with monochrome shimmer/bloom but no data, no controls, no tooltips; (2) adding `[data-landing]` token overrides to `globals.css`; (3) adding a `"landing"` variant to the `Button` component; and (4) replacing the `redirect("/dashboard")` in `app/page.tsx` with the landing page component (with server-side auth redirect for logged-in users).

**Primary recommendation:** Evolve `HeroOdyssey.tsx` in-place, replacing `LightningShader` with a new `BrainHero` component derived from the existing `BrainViewerCanvas`/`BrainGlowMesh` pattern but stripped to decorative-only mode.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Evolve the existing HeroOdyssey component (web/src/components/hero/HeroOdyssey.tsx) -- it already has BrainRank branding, auth-aware CTA, and Framer Motion animations. Extend it with the 3D brain.
- Create a standalone decorative BrainHero wrapper -- renders the brain mesh with shimmer/bloom but no segment data, no tooltips, no controls. Pure visual centerpiece.
- 3D brain sits behind the text, full-width -- brain as atmospheric background element (replacing the current LightningShader), with headline overlaid on top.
- Replace the lightning shader background with the 3D brain -- the brain IS the background hero element.
- Landing page-scoped CSS overrides -- add a `data-landing` attribute on the landing page wrapper that remaps design tokens to grayscale values. The app keeps its purple/cyan theme unchanged.
- Pure black #000000 background -- maximum brutalist contrast.
- CTA button: white text on white border, ghost style -- brutalist aesthetic uses outline/ghost buttons, no fills. Hover: invert to white fill, black text.
- Brain glow effect in monochrome -- grayscale render with white shimmer and soft white bloom.
- Authenticated users redirect to /dashboard -- landing page is for acquisition only.
- Minimal header -- BrainRank wordmark (left) + Login link (right). No sidebar, no app shell.
- Replace the redirect in `app/page.tsx` -- render landing page component directly in the root route group (not inside `(app)` auth group).

### Claude's Discretion
- Specific Three.js camera distance and angle for the hero brain
- Shimmer animation speed and intensity for the decorative brain
- Exact typography sizes and spacing within the hero section

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HERO-01 | Visitor sees an interactive 3D brain model with auto-rotation, shimmer, and bloom effects | BrainHero component derived from existing BrainGlowMesh + BrainViewerCanvas; R3F Canvas with Bloom postprocessing already proven in codebase |
| HERO-02 | Visitor sees a bold BrainRank headline with a one-line value proposition | Already exists in HeroOdyssey.tsx -- headline "See What Brains See" + subhead with Framer Motion fadeUp animations |
| HERO-03 | Visitor can click a primary CTA button to navigate to signup | Already exists in HeroOdyssey.tsx -- auth-aware CTA linking to /signup or /upload; needs "landing" button variant for brutalist styling |
| DES-01 | Landing page uses brutalist minimalist aesthetic -- black/white/gray palette only | `[data-landing]` CSS token overrides in globals.css scoping all design tokens to grayscale |
| DES-02 | Typography uses Space Grotesk (headlines) and Inter (body) | Already loaded in layout.tsx via next/font/google; `--font-headline` and `--font-body` CSS variables defined |
| DES-05 | Landing page served at root route (`/`) instead of redirecting to dashboard | Replace `redirect("/dashboard")` in app/page.tsx with LandingPage component; server-side auth check redirects logged-in users |

</phase_requirements>

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| @react-three/fiber | ^9.5.0 | Three.js React renderer | Installed, used by BrainViewer [VERIFIED: package.json] |
| @react-three/drei | ^10.7.7 | R3F helpers (useGLTF, Center) | Installed, used by BrainViewerCanvas [VERIFIED: package.json] |
| @react-three/postprocessing | ^3.0.4 | Bloom effect | Installed, used by BrainViewer [VERIFIED: package.json] |
| three | ^0.183.2 | 3D engine | Installed [VERIFIED: package.json] |
| framer-motion | ^12.38.0 | Animations | Installed, used by HeroOdyssey [VERIFIED: package.json] |
| next | 16.2.3 | Framework | Installed [VERIFIED: package.json] |
| tailwindcss | ^4 | Styling | Installed with @theme directive [VERIFIED: package.json + globals.css] |

### No New Dependencies Needed

This phase requires zero new npm installs. Every library is already in the project and actively used by existing components. [VERIFIED: package.json and codebase grep]

## Architecture Patterns

### Recommended Project Structure

```
web/src/
├── app/
│   └── page.tsx                          # MODIFY: redirect -> LandingPage component
├── components/
│   ├── hero/
│   │   ├── HeroOdyssey.tsx               # MODIFY: replace LightningShader with BrainHero
│   │   ├── BrainHero.tsx                 # NEW: decorative 3D brain canvas
│   │   └── LightningShader.tsx           # KEEP (unused by landing page, no breaking change)
│   └── ui/
│       └── Button.tsx                    # MODIFY: add "landing" variant
├── app/
│   └── globals.css                       # MODIFY: add [data-landing] token overrides
```

### Pattern 1: Decorative BrainHero (Simplified Brain Canvas)

**What:** A stripped-down version of the existing BrainViewer pattern that renders the brain mesh purely as a visual effect -- no data, no interaction, no controls.

**When to use:** Landing page hero background.

**Key differences from BrainViewer:**
- No `vertexDataA`/`regionColors` props -- uniform monochrome material
- No `OrbitControls` -- user cannot interact (purely decorative)
- No hover/tooltip system -- no `onHoverVertex` callback
- Constant auto-rotation at slow speed (0.3)
- `aria-hidden="true"` on canvas wrapper
- Monochrome material: `MeshStandardMaterial` with emissive white at 0.15, base `#333333`
- Simpler lighting: single ambient + single point light (not 3 directional lights)

**Existing code to reuse:** [VERIFIED: codebase inspection]
- `useGLTF('/models/brain-fsaverage5-unified.glb')` from `@react-three/drei` -- same GLB model
- `Canvas` from `@react-three/fiber` -- same pattern as BrainViewer line 264-269
- `EffectComposer` + `Bloom` from `@react-three/postprocessing` -- same pattern as BrainViewer line 280-286
- `Center` from `@react-three/drei` -- same centering pattern as BrainViewerCanvas line 88

**Shimmer approach:** The existing `BrainGlowMesh` uses a `useFrame` loop with multi-frequency sine waves for shimmer (lines 106-153). For the decorative brain, implement a simpler version: uniform white shimmer across all vertices (since there are no "active" vs "inactive" regions). This avoids importing the full `BrainGlowMesh` with its data-dependent logic.

```typescript
// BrainHero shimmer: simple vertex color cycling
// All vertices get subtle white pulse, no threshold checking needed
useFrame(({ clock }) => {
  const t = clock.getElapsedTime();
  for (let i = 0; i < vertexCount; i++) {
    const px = positions[i * 3];
    const py = positions[i * 3 + 1];
    const wave = Math.sin(px * 0.05 + t * Math.PI) * 0.5 + 0.5; // 0.5Hz
    const displacement = wave * 0.002;
    // Apply subtle emissive variation
    const emissive = 0.12 + wave * 0.06; // 0.12 to 0.18 range
    colors[i * 3] = 0.2 + emissive;
    colors[i * 3 + 1] = 0.2 + emissive;
    colors[i * 3 + 2] = 0.2 + emissive;
  }
  colorAttr.needsUpdate = true;
});
```

### Pattern 2: Landing Page Scoped Styles via data-landing

**What:** CSS attribute selector `[data-landing]` overrides design tokens to grayscale values without touching the app theme.

**Why this works:** Tailwind 4's `@theme` directive compiles CSS custom properties. The `.dark` class already overrides these for dark mode (globals.css lines 84-142). A `[data-landing]` selector with higher or equal specificity achieves the same effect for the landing page only. [VERIFIED: globals.css inspection]

```css
/* Add to globals.css after .dark block */
[data-landing] {
  --color-surface: #000000;
  --color-background: #000000;
  --color-surface-container: #111111;
  --color-surface-container-lowest: #000000;
  --color-surface-container-low: #0a0a0a;
  --color-surface-container-high: #1a1a1a;
  --color-surface-container-highest: #222222;
  --color-on-surface: #ffffff;
  --color-on-surface-variant: #999999;
  --color-on-background: #ffffff;
  --color-outline-variant: rgba(255, 255, 255, 0.1);
}
```

**Specificity note:** `[data-landing]` has specificity (0, 1, 0), same as `.dark`. If both apply simultaneously (which they will -- the app uses dark mode), the one declared later in CSS wins. Place `[data-landing]` after `.dark` in globals.css. [VERIFIED: CSS specificity rules]

### Pattern 3: Server-Side Auth Redirect in app/page.tsx

**What:** Replace the current `redirect("/dashboard")` with a server component that checks auth and conditionally renders.

**Current code** (app/page.tsx):
```typescript
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/dashboard");
}
```

**New pattern:**
```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HeroOdyssey } from "@/components/hero/HeroOdyssey";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return (
    <div data-landing>
      <HeroOdyssey />
    </div>
  );
}
```

**Note:** HeroOdyssey already has a client-side auth check (lines 23-29) that sets the CTA href. Since the server redirect handles logged-in users, the client-side check in HeroOdyssey will only fire for unauthenticated visitors and will correctly default to `/signup`. The client-side check can remain as a safety net but will effectively be a no-op for the landing page. [VERIFIED: HeroOdyssey.tsx lines 23-29]

### Pattern 4: Button "landing" Variant

**What:** Add a new variant to the existing Button component for the brutalist ghost/outline CTA style.

**Current variants:** `primary`, `secondary`, `ghost` [VERIFIED: Button.tsx lines 12-19]

**New variant:**
```typescript
landing:
  "border border-white text-white bg-transparent font-headline font-bold rounded-lg hover:bg-white hover:text-black active:scale-[0.98] active:bg-white/90 transition-all focus:outline-2 focus:outline-white focus:outline-offset-2",
```

### Anti-Patterns to Avoid

- **Creating a separate route group for landing page:** The root `app/page.tsx` is outside all route groups already -- it should stay there. Do NOT create a `(marketing)` route group. [VERIFIED: app/page.tsx is at root level]
- **Importing full BrainViewer for hero:** BrainViewer has data dependencies (segments, vertex maps, network-vertex-map.json fetch). The decorative brain must be a new lightweight component.
- **Duplicating BrainGlowMesh:** Don't fork BrainGlowMesh -- create a new, simpler mesh component specifically for the decorative use case. The existing one has 200+ lines of data-handling logic that would be dead code.
- **Using `dynamic(() => import(...), { ssr: false })` unnecessarily:** R3F Canvas already handles SSR gracefully in Next.js 16. The existing BrainViewer doesn't use dynamic imports. However, wrapping BrainHero in Suspense is still good practice for the GLB load.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 3D brain rendering | Custom WebGL | @react-three/fiber Canvas | Already proven in codebase, handles context cleanup |
| Bloom glow effect | Custom shader pass | @react-three/postprocessing Bloom | Already configured and working |
| GLB model loading | Custom fetch + parse | useGLTF from @react-three/drei | Handles caching, preloading, disposal |
| Entry animations | Custom CSS keyframes | framer-motion variants | Already used by HeroOdyssey, consistent API |
| Font loading | Manual @font-face | next/font/google | Already configured in layout.tsx |
| WebGL fallback | Custom detection | Try/catch on Canvas render | Match LightningShader's fallback pattern (line 258-272) |

## Common Pitfalls

### Pitfall 1: WebGL Context Exhaustion

**What goes wrong:** Multiple Three.js Canvas instances on the same page (or across navigation) exhaust the browser's WebGL context limit (typically 8-16 contexts).

**Why it happens:** The existing BrainViewer on the results page already creates a context. If a user navigates landing -> results -> back, orphaned contexts accumulate.

**How to avoid:** The existing BrainViewer already handles this with explicit context cleanup on unmount (BrainViewer.tsx lines 139-146). The BrainHero component must also call `gl.getExtension('WEBGL_lose_context')?.loseContext()` on unmount. Additionally, the LightningShader (if still imported anywhere) manages its own context cleanup (lines 240-254). [VERIFIED: codebase patterns]

**Warning signs:** Black canvas, "Too many active WebGL contexts" console warning.

### Pitfall 2: CSS Specificity Conflict Between .dark and [data-landing]

**What goes wrong:** The landing page shows purple/cyan accent colors leaking through because `.dark` overrides win over `[data-landing]`.

**Why it happens:** Both selectors have the same specificity (0, 1, 0). CSS cascade order determines winner.

**How to avoid:** Place `[data-landing]` block AFTER the `.dark` block in globals.css. Or use `[data-landing]` as a compound selector: `.dark[data-landing]` or `[data-landing]` on a wrapper inside the body (which already has `.dark`), ensuring descendant specificity wins. The safest approach is placing it last in the file. [VERIFIED: CSS specificity analysis]

### Pitfall 3: Large GLB Blocking First Paint

**What goes wrong:** The 738KB brain model blocks rendering, causing a flash of empty black before the brain appears.

**Why it happens:** `useGLTF` suspends the component while loading.

**How to avoid:** Wrap the BrainHero Canvas in `<Suspense fallback={null}>` so the text content renders immediately. The brain fades in after load. Add `useGLTF.preload('/models/brain-fsaverage5-unified.glb')` at module level (already done in BrainGlowMesh.tsx line 210 and BrainViewerCanvas.tsx line 117). [VERIFIED: existing preload pattern in codebase]

### Pitfall 4: Gradient Overlay Not Covering Enough for Text Legibility

**What goes wrong:** White text is hard to read against bright spots on the 3D brain mesh.

**Why it happens:** The brain's emissive white shimmer can create bright spots that reduce contrast with white text.

**How to avoid:** The UI spec defines a gradient overlay: `bg-gradient-to-b from-transparent via-black/20 to-black/60`. The existing HeroOdyssey already has a similar gradient (line 40). For the monochrome brain (which is predominantly dark gray #333 with white shimmer), the contrast should be sufficient given text z-index is above the overlay. Test and adjust `via-black/40` if needed.

### Pitfall 5: prefers-reduced-motion Ignored

**What goes wrong:** Users with motion sensitivity see continuous brain rotation and fade-up animations.

**Why it happens:** Framer Motion respects `prefers-reduced-motion` by default (reduces animations), but Three.js auto-rotation does not.

**How to avoid:** Check `window.matchMedia('(prefers-reduced-motion: reduce)')` and conditionally disable auto-rotation in the BrainHero. For Framer Motion, version 12.x respects the user preference automatically. [ASSUMED]

## Code Examples

### BrainHero Component Structure

```typescript
// Source: Derived from existing BrainViewerCanvas.tsx + BrainGlowMesh.tsx patterns
'use client';

import { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function DecorativeBrainMesh() {
  const { nodes } = useGLTF('/models/brain-fsaverage5-unified.glb');
  // Clone geometry, set up vertex colors for shimmer
  // useFrame for subtle white shimmer animation
  // MeshStandardMaterial: emissive white 0.15, base #333
  return (
    <mesh geometry={clonedGeometry}>
      <meshStandardMaterial
        vertexColors
        toneMapped={false}
        roughness={0.7}
        metalness={0.1}
        emissive="#ffffff"
        emissiveIntensity={0.15}
        color="#333333"
      />
    </mesh>
  );
}

export function BrainHero() {
  const glRef = useRef<WebGLRenderingContext | null>(null);

  useEffect(() => {
    return () => {
      // WebGL context cleanup (matches BrainViewer pattern)
      if (glRef.current) {
        const ext = glRef.current.getExtension('WEBGL_lose_context');
        ext?.loseContext();
      }
    };
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        gl={{ alpha: true }}
        onCreated={({ gl }) => { glRef.current = gl.getContext(); }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} color="#ffffff" />
          <pointLight position={[2, 3, 4]} intensity={0.8} color="#ffffff" />
          <Center>
            <group rotation={[-Math.PI / 2, 0, 0]}>
              <DecorativeBrainMesh />
            </group>
          </Center>
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.6}
              luminanceSmoothing={0.4}
              intensity={1.5}
              radius={0.8}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/brain-fsaverage5-unified.glb');
```

### Camera Distance Note

The existing BrainViewer uses `CAMERA_DISTANCE = 190` with the brain mesh at its natural scale. The UI spec suggests `3.5` units at `fov: 45`. The actual value depends on the GLB model's world-space size. The existing camera at 190 with fov 45 works -- for the landing page, we want the brain to fill more of the viewport. Start with the existing 190 distance and adjust. This falls under Claude's Discretion. [VERIFIED: BrainViewerCanvas.tsx line 29]

### WebGL Fallback Pattern

```typescript
// Match existing LightningShader fallback pattern (LightningShader.tsx lines 258-272)
// If Canvas fails to render, show plain black background silently
// The text content remains visible regardless -- it's layered above via z-index
```

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected -- no test files in web/src/ |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HERO-01 | 3D brain renders with auto-rotation, shimmer, bloom | manual-only | Visual inspection in browser | N/A |
| HERO-02 | Headline + subhead visible | manual-only | Visual inspection | N/A |
| HERO-03 | CTA button navigates to /signup | manual-only | Click test in browser | N/A |
| DES-01 | Black/white/gray palette only | manual-only | Visual inspection | N/A |
| DES-02 | Space Grotesk headlines, Inter body | manual-only | DevTools font check | N/A |
| DES-05 | `/` renders landing page | manual-only | Navigate to localhost:3000/ | N/A |

**Justification for manual-only:** This phase is purely visual/UI. All requirements are about what visitors SEE. No test framework is configured, and setting one up for a visual landing page would be overhead without ROI. The planner should specify manual verification steps in each task.

### Sampling Rate

- **Per task commit:** `npm run dev` + manual browser check at localhost:3000/
- **Per wave merge:** Full visual walkthrough of landing page at all 3 breakpoints (mobile/tablet/desktop)
- **Phase gate:** All 6 requirements visually confirmed

### Wave 0 Gaps

None -- manual testing only. No test infrastructure to set up.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (redirect logic) | Server-side Supabase auth check before rendering; no auth forms on this page |
| V3 Session Management | no | No session creation on landing page |
| V4 Access Control | yes (route protection) | Authenticated users redirected server-side to /dashboard |
| V5 Input Validation | no | No user input on landing page (CTA is a link, not a form) |
| V6 Cryptography | no | No crypto operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Auth bypass (accessing /dashboard without login) | Elevation of Privilege | Server-side auth check in page.tsx; (app) layout has its own auth guard |
| XSS via injected content | Tampering | No dynamic content on landing page -- all copy is hardcoded |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Framer Motion 12.x respects prefers-reduced-motion automatically | Common Pitfalls | Animations play for motion-sensitive users; easy to add manual check |
| A2 | R3F Canvas in Next.js 16 handles SSR without dynamic import | Anti-Patterns | Server render error; fix with `dynamic(() => import(...), { ssr: false })` |

## Open Questions

1. **Camera distance for decorative brain**
   - What we know: Existing BrainViewer uses distance 190 with fov 45. UI spec suggests 3.5.
   - What's unclear: The GLB model scale -- if it's in millimeters (brain-sized), 190 makes sense. 3.5 would only work if the model is unit-scale.
   - Recommendation: Start with existing 190 distance and test. Falls under Claude's Discretion. Adjust empirically.

2. **Auto-rotation without OrbitControls**
   - What we know: The existing BrainViewerCanvas uses `OrbitControls` with `autoRotate`. The UI spec says no OrbitControls for the landing page brain.
   - What's unclear: How to auto-rotate without OrbitControls.
   - Recommendation: Use a `useFrame` hook to rotate the `<group>` directly: `group.rotation.y += delta * 0.3`. This avoids importing OrbitControls entirely and is simpler.

## Sources

### Primary (HIGH confidence)
- `web/src/components/hero/HeroOdyssey.tsx` -- existing hero component with exact copy, animations, auth logic
- `web/src/components/results/BrainViewer.tsx` -- existing 3D brain viewer, Canvas/Bloom/R3F patterns
- `web/src/components/results/BrainGlowMesh.tsx` -- vertex color shimmer implementation
- `web/src/components/results/BrainViewerCanvas.tsx` -- OrbitControls, auto-rotation, camera setup
- `web/src/components/hero/LightningShader.tsx` -- WebGL fallback pattern, context cleanup
- `web/src/app/globals.css` -- Tailwind 4 @theme tokens, .dark overrides, CSS custom properties
- `web/src/app/layout.tsx` -- Font loading, theme provider, metadata
- `web/src/components/ui/Button.tsx` -- Existing variant system
- `web/package.json` -- All dependency versions verified
- `65-CONTEXT.md` -- Locked decisions from discuss phase
- `65-UI-SPEC.md` -- Complete visual/interaction contract

### Secondary (MEDIUM confidence)
- CSS specificity rules for [data-landing] vs .dark -- standard CSS behavior

### Tertiary (LOW confidence)
- A1: Framer Motion 12.x reduced-motion behavior -- based on training data, not verified against current docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies verified in package.json, all patterns verified in existing code
- Architecture: HIGH -- derived directly from existing codebase patterns, minimal new code
- Pitfalls: HIGH -- identified from actual codebase patterns (WebGL cleanup, CSS specificity, GLB loading)

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (stable -- no dependency upgrades needed)
