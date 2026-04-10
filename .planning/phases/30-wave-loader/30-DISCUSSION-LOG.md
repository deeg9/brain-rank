# Phase 30: Processing Page Premium Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 30-processing-page-premium-polish
**Areas discussed:** Progress Bar Animation, Pipeline Stepper, Log Stream Terminal, VRAM Stat Card, Live Pulse Indicators, Wave Loader, Custom Icons
**Mode:** Auto (all areas auto-selected, recommended defaults chosen)

---

## Progress Bar Animation

| Option | Description | Selected |
|--------|-------------|----------|
| Framer Motion spring with shimmer overlay | Spring physics for smooth width transitions, CSS shimmer sweep, pulsing glow shadow | ✓ |
| CSS-only transition with keyframes | Simpler but less polished, no spring physics | |
| Lottie animation | Pre-rendered, heavier dependency | |

**User's choice:** Framer Motion spring with shimmer overlay
**Notes:** [auto] Recommended default — leverages existing framer-motion dependency, matches 21st.dev Animated Progress Bar pattern user browsed

---

## Pipeline Stepper

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal connected line with animated checkmarks | Steps linked by filling line segments, spring-animated check on complete, pulsing ring on active | ✓ |
| Vertical stepper | Steps stacked vertically — doesn't fit horizontal page layout | |
| Keep flat grid with better icons | Minimal change, less visual impact | |

**User's choice:** Horizontal connected line with animated checkmarks
**Notes:** [auto] Recommended default — replaces flat grid layout from screenshot, draws from Ark UI Steps pattern

---

## Log Stream Terminal

| Option | Description | Selected |
|--------|-------------|----------|
| macOS dots header with AnimatePresence entries | Terminal chrome, animated line entries, color-coded prefixes, fade gradients | ✓ |
| Static terminal with scroll | Keep current look, just add color coding | |
| Collapsible log drawer | Hide logs by default, expand on click | |

**User's choice:** macOS dots header with AnimatePresence entries
**Notes:** [auto] Recommended default — draws from 21st.dev Kinetic Log Stream pattern user browsed

---

## VRAM Stat Card

| Option | Description | Selected |
|--------|-------------|----------|
| Orbiting halo with useSpring number animation | Moving glow halo, animated counting number, shimmer on load bar, radial gradient pulse | ✓ |
| Static card with better typography | Minimal effort, less visual impact | |
| Circular gauge instead of linear bar | Different visualization style, higher complexity | |

**User's choice:** Orbiting halo with useSpring number animation
**Notes:** [auto] Recommended default — draws from 21st.dev Stat Card pattern user browsed

---

## Live Pulse Indicators

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind ping animation with box-shadow glow | animate-ping overlay + shadow glow, applied to all status dots | ✓ |
| Framer Motion scale pulse | More control but heavier for simple dots | |
| Static dots with color only | No animation — least effort | |

**User's choice:** Tailwind ping animation with box-shadow glow
**Notes:** [auto] Recommended default — CSS-only, no JS overhead for simple pulse effect

---

## Wave Loader

| Option | Description | Selected |
|--------|-------------|----------|
| Shown during predicting stage as visual augmentation | EEG-aesthetic bars with staggered scaleY, additive to existing UI | ✓ |
| Replace progress bar during predicting | More dramatic but loses status info | |
| Full-screen overlay loader | Too disruptive, hides useful information | |

**User's choice:** Shown during predicting stage as visual augmentation
**Notes:** [auto] Recommended default — matches original Phase 30 success criteria (coexists with status info)

---

## Custom Icons

| Option | Description | Selected |
|--------|-------------|----------|
| Inline SVG React components with Material Symbols placeholders | Custom icons as React components, fallback to Material Symbols until Gemini-generated SVGs are ready | ✓ |
| Icon font | Requires font generation pipeline | |
| PNG/sprite sheet | Not scalable, no color customization | |

**User's choice:** Inline SVG React components with Material Symbols placeholders
**Notes:** [auto] Recommended default — SVG components allow color props and scale cleanly

---

## Claude's Discretion

- Exact animation timing values (duration, delay, easing curves)
- Component file organization within processing/
- Whether shimmer uses CSS keyframes or Framer Motion
- Mobile breakpoint behavior for stepper

## Deferred Ideas

- Custom SVG icons from Google Gemini — user generates externally, implementation uses placeholders
