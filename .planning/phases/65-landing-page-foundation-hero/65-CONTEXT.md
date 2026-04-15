# Phase 65: Landing Page Foundation & Hero - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitors land on a striking hero page at `/` with an interactive 3D brain model, bold headline, and clear signup CTA — establishing the BrainRank brand identity. Uses brutalist minimalist aesthetic: pure black background, white/gray text, Space Grotesk + Inter typography.

</domain>

<decisions>
## Implementation Decisions

### Hero Layout & 3D Brain
- Evolve the existing HeroOdyssey component (web/src/components/hero/HeroOdyssey.tsx) — it already has BrainRank branding, auth-aware CTA, and Framer Motion animations. Extend it with the 3D brain.
- Create a standalone decorative BrainHero wrapper — renders the brain mesh with shimmer/bloom but no segment data, no tooltips, no controls. Pure visual centerpiece.
- 3D brain sits behind the text, full-width — brain as atmospheric background element (replacing the current LightningShader), with headline overlaid on top.
- Replace the lightning shader background with the 3D brain — the brain IS the background hero element.

### Brutalist Color System
- Landing page-scoped CSS overrides — add a `data-landing` attribute on the landing page wrapper that remaps design tokens to grayscale values. The app keeps its purple/cyan theme unchanged.
- Pure black #000000 background — maximum brutalist contrast (app uses #0e0e10 in dark mode, landing page is harsher).
- CTA button: white text on white border, ghost style — brutalist aesthetic uses outline/ghost buttons, no fills. Hover: invert to white fill, black text.
- Brain glow effect in monochrome — grayscale render with white shimmer and soft white bloom, matching the B/W palette.

### Navigation & Routing
- Authenticated users redirect to /dashboard — landing page is for acquisition only.
- Minimal header — BrainRank wordmark (left) + Login link (right). No sidebar, no app shell.
- Replace the redirect in `app/page.tsx` — render landing page component directly in the root route group (not inside `(app)` auth group).

### Claude's Discretion
- Specific Three.js camera distance and angle for the hero brain
- Shimmer animation speed and intensity for the decorative brain
- Exact typography sizes and spacing within the hero section

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/components/hero/HeroOdyssey.tsx` — existing hero with BrainRank branding, Framer Motion fadeUp animations, auth-aware CTA, feature pills
- `web/src/components/hero/LightningShader.tsx` — WebGL shader background (to be replaced by 3D brain)
- `web/src/components/results/BrainViewer.tsx` — full 3D brain viewer (Three.js/R3F) with segment data, tooltips, controls
- `web/src/components/results/BrainGlowMesh.tsx` — vertex-level coloring, shimmer effects, threshold glow
- `web/src/components/results/BrainViewerCanvas.tsx` — Three.js Canvas wrapper with OrbitControls, auto-rotation
- `public/models/brain-fsaverage5-unified.glb` — 738KB brain model (20,484 vertices)
- `web/src/components/ui/Button.tsx` — shared button component with variants

### Established Patterns
- Tailwind CSS 4 with `@theme` directive for design tokens in globals.css
- Dark mode via `.dark` class on `<html>` with CSS custom property overrides
- Framer Motion for page/component animations
- Next.js App Router with route groups: `(app)`, `(auth)`, `(legal)`
- Font loading via Google Fonts in layout.tsx (Space Grotesk + Inter)
- @react-three/fiber for Three.js integration, @react-three/postprocessing for Bloom

### Integration Points
- `web/src/app/page.tsx` — currently redirects to /dashboard, needs to render landing page
- `web/src/app/layout.tsx` — root layout with font variables, ThemeProvider, metadata already says "BrainRank"
- Auth check pattern: `supabase.auth.getUser()` for redirect logic (already in HeroOdyssey)

</code_context>

<specifics>
## Specific Ideas

- User specifically wants the "three modeling of the brain" (3D brain model) as the main eyecatcher
- Brutalist minimalist: black/white/gray ONLY — no purple, no cyan, no color on the landing page
- Same font stack as existing app (Space Grotesk headlines, Inter body)
- The landing page should be visually striking and appealing to drive signups

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
