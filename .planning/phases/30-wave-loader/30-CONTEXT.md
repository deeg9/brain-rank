# Phase 30: Processing Page Premium Polish - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode — expanded from wave-loader to full page overhaul)

<domain>
## Phase Boundary

The processing page is elevated from functional to premium. This covers 6 component upgrades + custom icon specs: animated progress bar, kinetic log stream, pipeline stepper with motion, VRAM stat card with glow, live pulse indicators, and a neural wave loader. All work targets `web/src/app/(app)/processing/page.tsx` and new components in `web/src/components/processing/`.

</domain>

<decisions>
## Implementation Decisions

### D-01: Animated Progress Bar
- Replace the static CSS `transition-all` progress bar with Framer Motion `motion.div`
- Spring physics: `damping: 10, stiffness: 100, mass: 0.75`
- Add a traveling shimmer highlight using a `translateX` keyframe overlay (CSS `@keyframes shimmer` with `background: linear-gradient` sweep)
- Pulsing glow shadow (`box-shadow`) that intensifies proportional to progress percentage
- Keep the existing `neural-gradient` (purple #ba9eff to #8455ef) as the bar fill color
- Bar height stays at `h-4` with rounded-full

### D-02: Pipeline Stage Stepper
- Replace the flat 4-column grid with a horizontal stepper layout
- Connected line segments between steps that fill with color (primary gradient) as stages complete
- Completed steps: animated checkmark icon with scale spring (Framer Motion)
- Active step: pulsing ring border + spinning loader icon (replace the current `animate-spin sync` icon)
- Inactive steps: dimmed (opacity-30) with ghost borders, showing the stage icon
- Each step shows its label below the indicator circle
- Responsive: stays horizontal on desktop, stacks or scrolls on mobile

### D-03: Kinetic Log Stream (Terminal Panel)
- Add macOS-style terminal chrome: 3 dots (red/yellow/green circles) in a header bar
- New log lines enter with `AnimatePresence` + slide-in from left with spring physics
- Color-coded log prefixes:
  - Green (`text-tertiary-fixed`) for lines containing "COMPLETE"
  - Cyan (`text-secondary`) for lines containing "ENCODING"
  - Amber/yellow for lines containing "DETECTION" or "SPIKE"
  - Default dim purple (`text-primary-dim/70`) for all other lines
- Top and bottom fade gradients (transparent-to-surface) for infinite scroll effect
- Keep the existing "Inference Engine Logs" header text and live dot

### D-04: VRAM Stat Card with Glow
- Add a Framer Motion `motion.div` halo (small blurred circle) that orbits the card edges with `animate: { top, left }` keyframes on a 10s loop
- Animate the "14.2 GB" number counting up using Framer Motion `useSpring` + `useTransform` for rolling number effect
- Apply the same shimmer effect from D-01 to the Load Intensity progress bar
- Add a subtle radial gradient background that pulses with load percentage
- Wrap in existing `glass-surface` utility class

### D-05: Live Status Pulse Dots
- Replace all static colored dots with a ping animation pattern:
  ```
  <span className="relative flex h-2.5 w-2.5">
    <span className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75 animate-ping" />
    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary shadow-[0_0_8px_#5af8fb]" />
  </span>
  ```
- Apply to: log panel live indicator, compute node badge, footer status dots
- Compute node "US-EAST-NEURAL-01" badge gets a subtle breathing glow animation

### D-06: Neural Wave Loader
- Animated vertical bars (8-12 bars) with staggered scaleY animation (EEG/neural signal aesthetic)
- Bar colors: alternating/gradient between primary (#ba9eff) and secondary (#5af8fb)
- Shown during the "predicting" stage as a visual augmentation below the progress bar area
- Does NOT replace any status information — purely additive visual
- Uses Framer Motion `animate` with infinite repeat and staggerChildren
- Background: transparent (sits on existing glass panel)

### D-07: Custom Icon Specs (for user to generate externally)
- 7 custom icons to be generated via Google Gemini:
  1. **Neural Upload** — upward arrow merging into neural node, purple gradient, 48x48 SVG
  2. **Audio Waveform Scan** — 3-5 bars with scanning line, cyan, 48x48 SVG
  3. **Video Encode** — film frame with circular encoding arrows, purple gradient, 48x48 SVG
  4. **Brain Predict** — geometric brain with radiating pulse lines, purple-to-cyan gradient, 48x48 SVG
  5. **GPU Chip** — minimalist processor with lightning bolt, cyan, 48x48 SVG
  6. **Terminal** — console window with `>_` prompt, monochrome white, 48x48 SVG
  7. **Live Pulse** — heartbeat/ECG line forming a circle, cyan with glow, 48x48 SVG
- All icons: geometric style, 2px stroke or solid fill, rounded corners, designed on 24x24 grid with 2px padding
- Provide colored + monochrome white versions
- Implementation: inline SVG React components in `web/src/components/icons/`
- **If icons aren't ready yet, use Material Symbols as placeholders** — the component code should accept an icon prop that can be swapped later

### Claude's Discretion
- Exact animation timing values (duration, delay, easing curves)
- Whether to extract each upgrade into its own component file or keep inline
- Component file organization within `web/src/components/processing/`
- Whether the shimmer uses CSS keyframes or Framer Motion (CSS preferred for performance)
- Exact mobile breakpoint behavior for the stepper

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Processing Page (existing implementation)
- `web/src/app/(app)/processing/page.tsx` — Current processing page with all components to upgrade
- `web/src/lib/jobs.ts` — STAGES array, JobStage type, getStageProgress(), getStageIndex()

### Design System
- `web/src/app/globals.css` — Color tokens, custom utilities (neural-gradient, glass-surface, glow-primary), existing animations
- `web/src/components/ui/index.ts` — Existing UI components (Button, StatusBadge, Skeleton, GlassPanel)

### Dependencies
- `framer-motion` (^12.38.0) — Already installed, primary animation library
- `web/src/lib/utils.ts` — cn() utility for conditional classes

### 21st.dev Inspiration (from earlier conversation)
- Animated Progress Bar pattern — Framer Motion spring with `initial={{ width: 0 }}` animate to percentage
- Kinetic Log Stream pattern — AnimatePresence with spring slide-in entries and terminal chrome
- CoreSpin Loader pattern — Multi-ring orbital animation with pulsing core
- Stat Card with moving halo — `motion.div` orbiting edges with `useSpring` number animation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cn()` utility in `web/src/lib/utils.ts` — class merging
- `framer-motion` ^12.38.0 — already a dependency
- `StatusBadge` component — used for "In Progress" badge
- `Skeleton` component — used for loading states
- `GlassPanel` component — glass-surface styling
- Material Symbols font — currently used for all icons (cloud_upload, graphic_eq, movie, neurology, etc.)

### Established Patterns
- Processing page uses `useCallback` + `useEffect` for 5s polling interval
- `generateLogLines()` creates decorative log entries with timestamps
- `StageItem` renders completed/active/inactive states for each pipeline stage
- Progress derived from `getStageProgress(currentStage)` in lib/jobs.ts
- Dark theme with surface layers: surface-container-lowest → surface-container-high → surface-bright

### Integration Points
- `web/src/app/(app)/processing/page.tsx` — Main file to modify (all upgrades happen here or in new child components)
- `STAGES` array from `@/lib/jobs` — defines the 4 pipeline stages with key, label, and icon
- `web/src/components/processing/` — New directory for extracted processing-specific components

</code_context>

<specifics>
## Specific Ideas

### 21st.dev Component Inspiration
The user browsed 21st.dev and identified these patterns to adapt:
- **Animated Progress Bar**: Spring physics (`damping: 10, mass: 0.75, stiffness: 100`) with `motion.div` that animates width from 0 to target
- **Kinetic Log Stream**: `AnimatePresence` with `initial: { opacity: 0, x: -50 }` spring entries, terminal header with macOS dots
- **Stat Card**: Moving halo (`motion.div` with absolute positioning animating top/left), rotating ray blur, `useSpring` for number animation
- **Status Pulse**: Tailwind `animate-ping` with absolute overlay for heartbeat effect

### Design Intent
The goal is to go from "functional dashboard" to "premium AI SaaS" — the motion, glow effects, and visual polish should reinforce NeuroCut's brand identity as a serious neural analysis tool. The terminal chrome and live indicators make users feel like real GPU compute is happening behind the scenes.

</specifics>

<deferred>
## Deferred Ideas

- Custom SVG icons generated via Google Gemini — user will create these externally and provide SVG files. Implementation should use Material Symbols as placeholders until custom icons are delivered.

</deferred>

---

*Phase: 30-processing-page-premium-polish*
*Context gathered: 2026-04-10*
