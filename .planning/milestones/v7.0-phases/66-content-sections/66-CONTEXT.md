# Phase 66: Content Sections - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitors scroll below the hero to see clear explanations of how BrainRank works, key capabilities as feature cards, a visual preview of the analysis output, and a closing CTA to drive signups. All sections use the brutalist black/white/gray palette established in Phase 65 via `[data-landing]`.

</domain>

<decisions>
## Implementation Decisions

### Content Layout & Structure
- Full-page scrolling sections — each section (How It Works, Features, Preview, CTA) gets generous vertical spacing (~viewport height each)
- No visual dividers between sections — whitespace only, brutalist aesthetic
- "How It Works" uses a horizontal 3-column row: Upload → Analyze → See Results
- Each step has a large step number (01, 02, 03), a Material Symbols icon (upload, psychology, insights), title, and brief description
- Icons are monochrome white on dark background, using the Material Symbols Outlined font already loaded

### Feature Cards & Preview
- 3 feature cards: "Multi-Modal Input" (video, image, text), "9 Brain Networks" (detailed neural mapping), "Discovery Feed" (explore public analyses)
- Ghost card style: #111111 background, white border (1px, 10% opacity), white icon, white title, gray description
- Visual Preview section shows a static screenshot/mockup of the brain analysis results page (3D brain heatmap, neural timeline, score metrics)
- Screenshot taken from the actual running results page, saved as a static image in `/public/`

### Final CTA & Copywriting
- Headline: "Ready to See What Brains See?" — callbacks to hero headline, creates a bookend
- CTA button text: "Get Started Free" — emphasizes no-cost entry, free tier positioning
- One-line subtext below button: "Free to use. No credit card required." — removes friction
- CTA button uses same `variant="landing"` ghost/outline style from Phase 65

### Claude's Discretion
- Exact vertical spacing between sections
- Screenshot composition and framing for the preview image
- Feature card icon choices (within Material Symbols Outlined)
- Animation timing for scroll reveals (to be added in Phase 67)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/components/hero/HeroOdyssey.tsx` — hero section at top of landing page, sections render below it
- `web/src/components/ui/Button.tsx` — `landing` variant already exists from Phase 65
- `web/src/app/page.tsx` — renders `<div data-landing>` wrapper (Phase 65), new sections go inside this wrapper
- `web/src/app/globals.css` — `[data-landing]` CSS overrides active (Phase 65)
- Material Symbols Outlined — already loaded via Google Fonts CDN in the app

### Established Patterns
- Framer Motion for animations (used in HeroOdyssey)
- Tailwind CSS 4 with design tokens (all grayscale inside `[data-landing]`)
- `font-headline` for Space Grotesk headings, default for Inter body

### Integration Points
- New sections are added inside the `<div data-landing>` wrapper in `app/page.tsx`, below `<HeroOdyssey />`
- Each section is a new React component in `web/src/components/landing/`
- The CTA button links to `/signup` (same as hero CTA)

</code_context>

<specifics>
## Specific Ideas

- User wants the landing page to be visually appealing to drive signups
- Not too long — concise sections that explain the value
- No testimonials
- The preview should show what the actual brain analysis looks like

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
