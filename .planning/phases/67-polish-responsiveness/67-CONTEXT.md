# Phase 67: Polish & Responsiveness - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Add scroll-triggered fade-in animations using 21st.dev components and make all landing page sections fully responsive across desktop (1440px+), tablet (768px), and mobile (375px).

</domain>

<decisions>
## Implementation Decisions

### Animation & 21st.dev Components
- Add scroll-triggered fade-in reveals — each section fades up into view as user scrolls. Subtle, not flashy, matching brutalist minimalism.
- Use 21st.dev magic MCP to search for and install scroll reveal / fade-in animation components that work with React + Tailwind.
- No additional animation on the 3D brain hero — it already has auto-rotation, shimmer, and bloom from Phase 65.

### Responsive Breakpoints
- "How It Works" 3-column layout stacks vertically to single column on mobile (<768px)
- Feature cards stack vertically to single column on mobile (<768px), full-width cards
- 3D brain: keep on mobile but reduce DPR to [1, 1] for performance (same visual, lighter render)
- Preview mockup: scale down full-width with smaller text, same layout proportions
- CTA buttons remain full-width on mobile for easy tapping

### Claude's Discretion
- Which specific 21st.dev component to install (search and pick best match)
- Exact animation durations and easing curves
- Specific responsive text sizes at each breakpoint
- Whether to adjust section spacing on mobile

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Framer Motion already installed and used in HeroOdyssey (fadeUp variants)
- All landing components in `web/src/components/landing/` (HowItWorks, FeatureCards, PreviewSection, FinalCTA)
- `web/src/components/hero/HeroOdyssey.tsx` — hero with existing animations
- `web/src/components/hero/BrainHero.tsx` — 3D brain with DPR setting

### Established Patterns
- Tailwind CSS responsive prefixes: `md:` (768px+), `lg:` (1024px+)
- Framer Motion `variants` pattern with `initial`/`animate` for animations
- `font-headline` for headings, default for body text

### Integration Points
- Each section component needs responsive classes added
- BrainHero needs conditional DPR based on viewport width
- 21st.dev component wraps each section for scroll reveal

</code_context>

<specifics>
## Specific Ideas

- Use 21st.dev magic MCP to find the best scroll animation component
- Keep animations minimal and tasteful — brutalist aesthetic
- Mobile layout should still be visually striking, just reorganized for narrow screens

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
