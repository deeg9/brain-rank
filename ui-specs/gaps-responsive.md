# Responsive Behavior Gap Analysis

Documentation of how every screen adapts across mobile, tablet, and desktop breakpoints. Canonical specs describe desktop layout only. This document fills the gap for mobile (320px-767px) and tablet (768px-1023px) adaptations.

---

## Responsive Coverage Matrix

| Screen | Adaptation Complexity | Key Challenges |
|--------|----------------------|----------------|
| Upload | Low | Drop zone resize, cost panel reflow |
| Processing | Low | Glass panel full-width, logs stacking |
| Results Overview | High | Video + metrics side-by-side becomes stacked, timeline horizontal scroll |
| Results Detail | High | Multi-track timeline, segment table, region panel all need mobile treatment |
| Dashboard | Medium | Bento grid column reduction, card layout compaction |
| Auth (Login, Sign Up, Forgot) | Low | Already centered card -- minimal adaptation |
| Onboarding / Welcome | Low | Hero illustration resize, CTA full-width |
| Settings / Account | Medium | Form sections stack, toggle layout adapts |
| Settings / Billing | Medium | Credit packages stack, transaction table scrolls |
| Error (404, 500, Offline) | Low | Already centered -- minimal adaptation |
| Profile | Medium | Stats cards stack, activity list compacts |

---

## Breakpoints

Three breakpoints define the responsive system. All canonical specs currently describe the Desktop breakpoint.

| Breakpoint | Range | Columns | Primary Input | Layout |
|------------|-------|---------|---------------|--------|
| **Mobile** | 320px - 767px | 1 | Touch-first | Single column, stacked sections, bottom tab bar |
| **Tablet** | 768px - 1023px | 2-8 | Touch + pointer | Flexible columns, collapsible sidebar drawer |
| **Desktop** | 1024px+ | 12 | Pointer-first | Multi-column, persistent sidebar (current spec) |

### CSS Strategy

```
/* Mobile first -- base styles are mobile */
/* Tablet */
@media (min-width: 768px) { ... }
/* Desktop */
@media (min-width: 1024px) { ... }
```

---

## Global Navigation

The sidebar navigation and top bar appear on every screen within the main app shell (excludes Auth and Error pages). Their responsive adaptation is global.

### Sidebar Nav

| Breakpoint | Behavior |
|------------|----------|
| **Desktop** (1024px+) | Fixed left sidebar, 256px wide, always visible. Current behavior documented in components.md. |
| **Tablet** (768px-1023px) | Collapsible drawer. Hamburger menu icon in top-left of Top Bar. Tap to open drawer overlay (slides in from left, 256px wide). Tap outside or swipe left to dismiss. Semi-transparent scrim overlay on rest of page when drawer is open. |
| **Mobile** (320px-767px) | Bottom tab bar replacing sidebar entirely. 4 primary nav items (Upload, Processing, Results, Dashboard) as icon-only tabs at screen bottom. Fixed position, 56px height. Active tab uses `primary` color, inactive uses `on-surface-variant`. "New Analysis" CTA becomes a floating action button (FAB) or a prominent tab. Settings and Support accessible from a "More" menu (three-dot icon) in Top Bar. |

### Top Bar

| Breakpoint | Behavior |
|------------|----------|
| **Desktop** (1024px+) | Full width minus sidebar. All elements visible: logo/back arrow, title, credits, notifications, avatar. Current spec. |
| **Tablet** (768px-1023px) | Full width. Hamburger menu icon added at left. Credits badge may collapse to icon-only (bolt icon without number). Search input collapses to search icon that expands on tap. |
| **Mobile** (320px-767px) | Full width, compact height (48px). Left: hamburger icon or back arrow. Center: truncated page title (max 20 chars with ellipsis). Right: 2 icons max (notification bell, avatar or search). Credits hidden (accessible from Settings). |

### Bottom Tab Bar (Mobile Only)

New global component for mobile navigation:

- **Height:** 56px
- **Items:** 4 tabs -- Upload (cloud_upload icon), Processing (hourglass icon), Results (insights icon), Dashboard (dashboard icon)
- **Active state:** `primary` color icon + label text. Inactive: `on-surface-variant` icon, no label text.
- **Background:** `surface-container-low`
- **Safe area:** Respects iOS safe area inset (`env(safe-area-inset-bottom)`)
- **Min tap target:** 44px per Apple HIG for all tab items

---

## Upload

### Layout Adaptations

| Breakpoint | Layout Change |
|------------|--------------|
| **Desktop** | Sidebar (256px) + content area. Drop zone full-width in content. 3-column AI Stats grid. |
| **Tablet** | No persistent sidebar (drawer). Drop zone full-width with 16px horizontal padding. AI Stats grid: 3 columns (fits). Cost panel centered, max-width 500px. |
| **Mobile** | No sidebar (bottom tab bar). Drop zone full-width with 12px horizontal padding, reduced internal padding. AI Stats grid: 1 column (stacked). Cost panel full-width. CTA button full-width at 100%. Page title and subtitle stack with reduced font sizes. |

### Component Behavior Changes

- **Video Drop Zone:** Full-width on all breakpoints. On mobile, internal padding reduces from 24px to 16px. "Drag video here" text changes to "Tap to select video" on mobile (no drag-and-drop on touch devices). Browse Files button becomes the primary interaction on mobile.
- **Cost Estimate Glass Panel:** Centered on desktop/tablet (max-w-md). Full-width on mobile with 12px padding.
- **AI Engine Stats Cards:** 3-column on tablet/desktop, 1-column stacked on mobile with 8px gap between cards.

### Touch Considerations

- Drop zone tap target is the entire zone area (minimum 44px height ensured by padding)
- "Browse Files" button minimum height 44px on mobile
- CTA "Analyze Video" button minimum height 48px on mobile for easy thumb reach

---

## Processing

### Layout Adaptations

| Breakpoint | Layout Change |
|------------|--------------|
| **Desktop** | Sidebar + centered content (max-w-4xl). Progress panel, time estimate pill, bottom info grid (logs 2-col + VRAM 1-col). |
| **Tablet** | No persistent sidebar. Content centered (max-w-2xl). Bottom info grid: 2 columns (logs span full, VRAM below). |
| **Mobile** | Bottom tab bar. Content full-width with 12px padding. All sections stack vertically. Bottom info grid: 1 column (logs full-width, VRAM full-width below). Time estimate pill: full-width. GPU badge text truncates or wraps. |

### Component Behavior Changes

- **Glass Panel (Progress):** Full-width on mobile. Stage Checklist items compact: icon + name only, status label hidden (rely on icon color for state).
- **Inference Log Panel:** Full-width on all mobile/tablet. Max-height reduced on mobile (150px vs 250px on desktop) with "Show More" expand toggle.
- **VRAM Load Card:** Full-width on mobile, stacks below logs instead of side-by-side.
- **Estimated Time Remaining Pill:** Full-width on mobile. Font size reduces from `headline-sm` to `body-md`.

### Touch Considerations

- Cancel/Back button minimum tap target 44px
- No swipe gestures on this screen (purely observational)

---

## Results Overview

This is the highest-complexity screen for responsive adaptation due to the video + metrics + timeline layout.

### Layout Adaptations

| Breakpoint | Layout Change |
|------------|--------------|
| **Desktop** | 12-col grid. Video player col-span-8 + metrics col-span-4 (side-by-side). Timeline col-span-12. AI Recs col-span-8 + Export col-span-4. |
| **Tablet** | 8-col grid. Video player col-span-8 (full). Metrics row: 5 cards in horizontal scroll or 3+2 grid. Timeline col-span-8 (full). AI Recs and Export stack vertically. |
| **Mobile** | 1-col stack. Video player full-width. Metrics: horizontal scroll of 5 cards (card width 140px, snap scroll). Timeline full-width with horizontal scroll (see below). AI Recs and Export stack below. |

### Component Behavior Changes

- **Video Player Placeholder:**
  - Desktop: col-span-8 (~60% width)
  - Tablet: full content width
  - Mobile: full viewport width (edge-to-edge, no padding)
- **Summary Metric Cards:**
  - Desktop: vertical stack in col-span-4
  - Tablet: horizontal row, 5 cards in a 2-row grid (3 top, 2 bottom)
  - Mobile: horizontal scrolling strip. Cards are fixed-width (140px), snap-scroll, with peek of next card. Scroll indicators (dots or fade) at edges.
- **Neural Activation Timeline:**
  - Desktop: full width, all segments visible, interactive hover tooltips
  - Tablet: full width, touch tooltips (tap to show, tap elsewhere to dismiss)
  - Mobile: horizontal scroll container. Timeline maintains its full data width and becomes scrollable. Time axis is pinned. Pinch-to-zoom for segment detail. Tap-to-show tooltip replaces hover. Playhead drag via touch.
- **AI Recommendations Panel:**
  - Desktop: col-span-8 beside export controls
  - Tablet/Mobile: full-width, stacked below timeline
- **Export Controls:**
  - Desktop: col-span-4 beside recommendations
  - Tablet/Mobile: full-width row below recommendations. Buttons side-by-side on tablet, stacked on mobile.

### Touch Considerations

- Timeline segment tap target: minimum 44px width per segment. If segments are narrower at current zoom, pinch-to-zoom required to interact.
- Metric card horizontal scroll: momentum scrolling with snap points
- Tooltip interaction: tap to show, tap outside to dismiss (replaces hover)
- Playhead drag: touch-based drag with visual feedback (larger playhead handle on mobile, 44px tap target)

---

## Results Detail

Most complex responsive adaptation alongside Results Overview.

### Layout Adaptations

| Breakpoint | Layout Change |
|------------|--------------|
| **Desktop** | 12-col grid. Video player col-span-12. Multi-track timeline col-span-12. Region panel col-span-5 + Segment Explorer col-span-7. Tag management col-span-12. |
| **Tablet** | 8-col grid. Video player col-span-8 (full). Multi-track timeline col-span-8 (full). Region panel col-span-8 (full, above). Segment Explorer col-span-8 (full, below). Side-by-side becomes stacked. |
| **Mobile** | 1-col stack. Everything stacks vertically. Segment Explorer becomes card view instead of table. |

### Component Behavior Changes

- **Large Video Player Placeholder:**
  - Desktop: full content width (col-span-12)
  - Tablet: full content width
  - Mobile: full viewport width (edge-to-edge)
- **Multi-Track Timeline:**
  - Desktop: 4 tracks visible, horizontal full-width
  - Tablet: 4 tracks, horizontal scroll if needed. Track height reduces from ~60px to ~48px per track.
  - Mobile: Tracks stack or collapse to an accordion pattern. Only 1 track visible at a time with swipe between tracks or tap to select which region to view. Default: show combined activation score (single track). "Show all tracks" expander to view stacked but compact. Horizontal scroll for time axis. Minimum swipe target height 44px per track.
- **Region Breakdown Panel:**
  - Desktop: col-span-5, card with progress bars
  - Tablet: full-width, horizontal row of 4 mini-cards (1 per region)
  - Mobile: full-width. 2x2 grid of region mini-cards. Each card: region name, average score as number, small progress bar. Tap card to highlight that track in timeline.
- **Segment Explorer:**
  - Desktop: col-span-7, scrollable table with 8 columns
  - Tablet: full-width table, horizontal scroll enabled for all columns. First 3 columns (Time, Activation, Arousal) sticky on scroll.
  - Mobile: card view instead of table. Each segment becomes a card showing: time range (bold), activation score (large, `primary` color), secondary metrics below (arousal, valence as small chips). Expandable to show region breakdown. Cards in vertical scroll list with 8px gap. Sort control as a dropdown above the card list.
- **Tag Management (aspirational):**
  - Desktop: full-width bar with add button and tag pills
  - Mobile/Tablet: tag pills wrap to multiple lines. "Add Tag" button fixed at left of row.
- **Export Controls (in Top Bar):**
  - Desktop: JSON and CSV buttons visible in top bar
  - Tablet: Buttons collapse to single "Export" dropdown
  - Mobile: Export accessible from a three-dot overflow menu in top bar. Tap "Export" to see JSON/CSV options in a bottom sheet.

### Touch Considerations

- Multi-track timeline: swipe horizontally to scroll time, swipe between tracks on mobile
- Segment Explorer cards: tap to expand/collapse individual segments
- Region mini-cards: minimum 44px tap target per card
- Column sort: replaced with dropdown on mobile (no column headers to tap)

---

## Dashboard

### Layout Adaptations

| Breakpoint | Layout Change |
|------------|--------------|
| **Desktop** | Sidebar + content. Quick Stats 3-col row. Job History 2-col grid (xl:grid-cols-2). |
| **Tablet** | No persistent sidebar. Quick Stats 3-col row (compressed card width). Job History: 2-col grid. Search input in top bar. |
| **Mobile** | Bottom tab bar. Quick Stats: horizontal scroll of 3 cards (same pattern as Results metrics). Job History: 1-col stack. Cards full-width. Page header "Analysis History" + "New Analysis" button: button moves to a floating action button (FAB) at bottom-right above tab bar, or remains inline but full-width. |

### Component Behavior Changes

- **Quick Stats Bar:**
  - Desktop: 3-col grid
  - Tablet: 3-col grid (narrower cards)
  - Mobile: horizontal scroll strip, cards 140px wide with snap scroll
- **Job History Grid:**
  - Desktop: 2-col grid
  - Tablet: 2-col grid
  - Mobile: 1-col stack, full-width cards
- **Job Card:**
  - Desktop/Tablet: Full card with thumbnail, filename, date, score bar, status badge, "View Results" button
  - Mobile: Compact card -- thumbnail shrinks (aspect-video at 100% width but with reduced height using object-cover), score bar and status on same row, "View Results" as subtle right-arrow icon instead of full button. Card height reduces from ~280px to ~200px.
- **Search Input:**
  - Desktop: Visible in top bar
  - Tablet: Visible in top bar (slightly narrower)
  - Mobile: Hidden behind search icon. Tap icon to expand full-width search overlay with text input and "Cancel" button. Results filter in real-time as typing.
- **Empty State:**
  - Desktop/Tablet: Large icon, headline, description, gradient CTA
  - Mobile: Icon size reduces. CTA button full-width. Description text may truncate or reduce to 2 lines.

### Touch Considerations

- Job Card tap target: entire card is tappable (navigates to Results)
- Horizontal scroll for stats: momentum scrolling with snap
- Minimum 44px tap target for all interactive elements
- "New Analysis" FAB on mobile: 56px diameter, elevated with `shadow-ambient`, neural-gradient fill

---

## Auth Screens (Login, Sign Up, Forgot Password)

Auth screens use a centered card layout that is inherently responsive-friendly.

### Layout Adaptations

| Breakpoint | Layout Change |
|------------|--------------|
| **Desktop** | Centered card, max-width 420px, vertically centered on `surface` background. |
| **Tablet** | Same centered card, max-width 420px. Vertically centered. No changes needed. |
| **Mobile** | Card becomes full-width with 16px horizontal padding. Vertically aligned to top-third of screen (not centered -- keyboard overlap concern). NeuroCut logo remains centered above card. Card `rounded-xl` remains. Input fields full-width within card. |

### Component Behavior Changes

- **AuthCard:** Full-width on mobile with horizontal padding. Background may switch to `surface` (same as page background) to appear seamless, or retain `surface-container-high` with reduced border-radius feel.
- **InputField:** Touch-optimized height (minimum 48px) on mobile. Bottom-border input pattern works well at all sizes.
- **CTA Button:** Full-width at all breakpoints (already specced as full-width within card).
- **PasswordStrengthIndicator (Sign Up):** Full-width bar. Segments scale proportionally.

### Touch Considerations

- Input fields: minimum 48px height for comfortable touch input
- CTA button: minimum 48px height
- "Forgot password?" and "Sign up" links: minimum 44px tap target (add padding if text link is small)
- Keyboard management: form should scroll to keep active input above the virtual keyboard

---

## Onboarding / Welcome

### Layout Adaptations

| Breakpoint | Layout Change |
|------------|--------------|
| **Desktop** | Centered single-column. Illustration max-width 600px. CTA centered. "Skip" in top-right. |
| **Tablet** | Same centered layout. Illustration max-width 500px. |
| **Mobile** | Full-width with 16px padding. Illustration max-width 100% (edge-to-edge). CTA full-width. "Skip" moves to top-right corner with minimum 44px tap target. Text sizes reduce: headline from `headline-lg` to `headline-sm`, body from `body-md` to `body-sm`. Step indicator dots: 12px diameter minimum. |

### Touch Considerations

- "Skip" link: minimum 44px tap target with padding
- CTA button: minimum 48px height
- Step indicator dots: 12px diameter, 16px gap between dots for distinct tap targets

---

## Settings / Account

### Layout Adaptations

| Breakpoint | Layout Change |
|------------|--------------|
| **Desktop** | Sidebar + content area. FormSections stack vertically within content. Max-width 640px for form content. |
| **Tablet** | No persistent sidebar. FormSections full content width. Max-width 640px centered. |
| **Mobile** | Bottom tab bar. FormSections full-width with 12px padding. Each FormSection becomes a standalone card. "Save Changes" buttons become full-width. Toggle rows: label left, toggle right (same row, flexbox). |

### Component Behavior Changes

- **FormSection:** Full-width on mobile. Section title sticks to top on scroll (sticky header) within each section for context.
- **InputField:** Full-width at all breakpoints. Mobile: 48px minimum height.
- **Toggle:** Remains inline (label + toggle on same row) at all breakpoints. Toggle element minimum 44px tap target (wider track for easier thumb activation).
- **Action Buttons:** Full-width on mobile. Stacked if there are multiple buttons per section.

### Touch Considerations

- Toggle control: minimum 44px height, 52px width for easy thumb toggle
- Input fields: 48px minimum height
- Action buttons: 48px minimum height, full-width on mobile

---

## Settings / Billing

### Layout Adaptations

| Breakpoint | Layout Change |
|------------|--------------|
| **Desktop** | Sidebar + content. Stats row 3-col. Credit packages 3-col grid. Transaction table full-width. |
| **Tablet** | Stats row 3-col (compressed). Credit packages 3-col. Transaction table: horizontal scroll if columns exceed width. |
| **Mobile** | Bottom tab bar. Stats: horizontal scroll strip (same pattern). Credit packages: 1-col stack. Transaction table: card view (each transaction as a card with date, type, amount, balance). |

### Component Behavior Changes

- **Credit Package Cards:** 3-col on desktop/tablet, 1-col stack on mobile. Cards become full-width horizontal layout on mobile (credit amount + price on left, "Buy" button on right).
- **Transaction History Table:**
  - Desktop/Tablet: Standard table with columns
  - Mobile: Card view -- each transaction becomes a row card: date and type on top line, amount (colored green for purchases, red for deductions) and balance on bottom line.
- **Quick Stats Cards:** Same horizontal scroll pattern as Dashboard on mobile.

### Touch Considerations

- "Buy" buttons: minimum 44px tap target
- Transaction cards: tappable for detail expansion (future)
- Stats card scroll: momentum + snap

---

## Error Pages (404, 500, Offline)

Error pages use centered layouts that adapt naturally.

### Layout Adaptations

| Breakpoint | Layout Change |
|------------|--------------|
| **Desktop** | Centered content, illustration + text + CTA. |
| **Tablet** | Same centered layout, no changes needed. |
| **Mobile** | Full-width with 16px padding. Illustration scales to 60% viewport width (max 200px). Headline reduces to `headline-sm`. CTA button full-width. |

### Component Behavior Changes

- **ErrorIllustrationPlaceholder:** Scales proportionally. Max-width 300px on desktop, 200px on mobile.
- **CTA Button:** Full-width on mobile.
- **ConnectionStatusIndicator (Offline):** Full-width on mobile. Status text wraps below icon if needed.

### Touch Considerations

- CTA button: minimum 48px height
- "Retry Now" button: minimum 44px tap target
- No complex touch interactions on error pages

---

## Profile

### Layout Adaptations

| Breakpoint | Layout Change |
|------------|--------------|
| **Desktop** | Sidebar + content. Profile card centered (max-width 640px). Stats 3-col row. Activity list below. |
| **Tablet** | No persistent sidebar. Profile card centered. Stats 3-col. Activity list full-width. |
| **Mobile** | Bottom tab bar. Profile card full-width, avatar centered. Stats: horizontal scroll or 1-col stack. Activity list: compact cards. "Edit Profile" button full-width below avatar section. |

### Component Behavior Changes

- **AvatarUpload:** Centered at all breakpoints. Size: 96px on desktop, 80px on mobile.
- **Stats Cards:** 3-col on desktop/tablet, horizontal scroll or stack on mobile.
- **Activity Feed:** Full-width list. On mobile, each item is more compact: date and filename on one line, score on the right. Minimum row height 44px for tap targets.

### Touch Considerations

- Avatar upload: tap to trigger file picker, minimum 44px tap target (96px satisfies this)
- Activity items: entire row is tappable (navigates to Results)
- Stats cards: 44px minimum height

---

## Global Touch and Accessibility Rules

These rules apply across ALL screens at all breakpoints:

1. **Minimum tap target size:** 44px x 44px per Apple Human Interface Guidelines (HIG). All interactive elements (buttons, links, toggles, cards, list items) must meet this minimum.

2. **Swipe gestures replacing hover:** Where desktop uses hover for tooltips, mobile uses tap-to-show with tap-elsewhere-to-dismiss. No hover-dependent interactions should be the ONLY way to access information.

3. **Scroll vs swipe disambiguation:** Vertical scroll for page content. Horizontal scroll only for contained elements (stats cards, timeline). Nested scroll containers must not conflict -- inner horizontal scroll should not trigger outer vertical scroll.

4. **Keyboard avoidance:** On mobile, when the virtual keyboard opens, the viewport should scroll to keep the active input visible above the keyboard. Form screens (auth, settings) must account for keyboard height.

5. **Orientation support:** All screens should function in both portrait and landscape. No screen should lock orientation. Landscape on mobile gives more horizontal space for timelines.

6. **Safe areas:** Respect device safe areas (notch, home indicator) on iOS. Bottom tab bar sits above the home indicator area. Content does not underlap the notch.

7. **Reduced motion:** Honor `prefers-reduced-motion` media query. Replace all animations (skeleton shimmer, progress pulse, fade transitions) with instant state changes when user has requested reduced motion.

8. **Focus management:** Tab order must be logical at all breakpoints. Mobile bottom tab bar items must be reachable via assistive technology. Skip-to-content links for keyboard navigation.
