# Phase 31: Hero Odyssey - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

The welcome/marketing page has a WebGL lightning shader hero section that establishes the neural/scientific brand identity. Adapts the 21st.dev "Hero Odyssey" component with NeuroCut palette.

</domain>

<decisions>
## Implementation Decisions

### Component Design
- Create a HeroLightning component with WebGL shader (canvas-based)
- The shader generates animated lightning/electrical effects using fractal noise (FBM)
- Configurable hue, intensity, speed, size parameters
- Framer Motion for content animations (stagger, fade-in, scale)

### Visual Adaptation  
- Lightning hue: ~270 (purple, matching #ba9eff primary)
- Secondary glow: cyan (#5af8fb) for the gradient sphere/planet element
- Background: pure black (#0e0e10) to match NeuroCut surface
- Replace "Hero Odyssey" text with NeuroCut branding and value proposition
- CTA button: "Analyze Your Video" → navigates to /upload or /signup

### Content
- Headline: "NeuroCut" or "See What Brains See"
- Subheadline: Brief value proposition about neural A/B testing
- CTA: "Analyze Your Video" (links to /upload if authenticated, /signup if not)
- Feature items: Replace tech stack labels with NeuroCut features (Brain Mapping, Neural Analysis, etc.)

### WebGL Fallback
- Detect WebGL support before rendering shader
- Static gradient fallback for devices without WebGL
- Performance: requestAnimationFrame with cleanup on unmount

### Integration Points
- Replace current content on web/src/app/welcome/page.tsx or web/src/app/page.tsx (marketing landing)
- Must work with existing navigation (Sidebar hidden on welcome page)

### Claude's Discretion
- Exact copy/messaging for headline and features
- Whether to include the hue slider (probably remove for production)
- Whether the planet/sphere element is needed or just the lightning
- Mobile responsive adjustments

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- web/src/lib/utils.ts — cn() utility
- framer-motion already installed
- Existing auth utilities for conditional CTA routing

### Established Patterns
- Welcome page uses full-screen layout (no sidebar)
- AuthLayout component for full-screen pages
- Next.js Link for navigation

### Integration Points
- web/src/app/welcome/page.tsx or web/src/app/page.tsx — marketing page
- Auth state for conditional CTA (upload vs signup)

</code_context>

<specifics>
## Specific Ideas

The 21st.dev Hero Odyssey uses a WebGL fragment shader with fractal Brownian motion (FBM) to generate lightning. The shader runs in a full-screen canvas with HSV-to-RGB color conversion. Content overlays use Framer Motion stagger animations.

Key shader parameters to customize:
- hue: 270 (purple for NeuroCut)
- intensity: 0.6
- speed: 1.6
- size: 2

</specifics>

<deferred>
## Deferred Ideas

- Interactive hue slider (from original — not needed for production)
- Mobile menu overlay (from original — NeuroCut has its own nav)

</deferred>
