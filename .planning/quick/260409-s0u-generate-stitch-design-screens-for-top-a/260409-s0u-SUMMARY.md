# Stitch Design Generation — Top Audit Gaps

**Date:** 2026-04-10
**Quick Task:** 260409-s0u
**Stitch Project:** 15366884645778091653

---

## Results

### 1. Forgot Password Screen — GENERATED

**Stitch Screen ID:** `e25ffb9796d7444ba30d2966e81fb6c9`
**Status:** Complete

The screen was generated matching the existing Login/Sign Up auth screen style:
- Centered card on dark background (#0e0e10)
- surface-container-high (#1f1f22) card with ghost-border and ambient-glow
- NeuroCut logo + wordmark at top
- "Reset your password" heading (Space Grotesk)
- Email input with surface-container-low background
- "Send Reset Link" CTA with neural-gradient
- "Back to Sign In" link
- Footer with Privacy Policy, Terms, Help Center links
- Nav bar with Features, Pricing, Sign In links

**Design System Tokens Used:**
- `--primary: #ba9eff`
- `--primary-dim: #ac91f1`
- `--surface: #0e0e10`
- `--on-surface: #f9f5f8`
- Neural-gradient: `linear-gradient(135deg, #ba9eff, #8455ef)`
- Ghost-border: `rgba(72, 71, 74, 0.15)`
- Ambient-glow: `rgba(186, 158, 255, 0.15)` at 60px blur

**Implementation Notes for `web/src/app/(auth)/forgot-password/page.tsx`:**
- Copy Login page structure (centered card, same layout group)
- Single email input + submit button
- Server action: `supabase.auth.resetPasswordForEmail(email)`
- Success state: "Check your email" confirmation message
- Wire Login page's "Forgot password?" span → Link to `/forgot-password`

---

### 2. Results Detail v2 (Multi-Track Timeline) — TIMED OUT

**Status:** Stitch generation timed out 3 times. The multi-track brain activation timeline with 4 area charts is too complex for Stitch's generation model to render within the timeout window.

**Workaround — Design spec captured from prompt:**

The Results Detail v2 should have these sections (top to bottom):

#### A. Top Bar
- Back arrow + "← Back to Dashboard" link
- Filename + "VIDEO FILE" label
- "Export Results" button

#### B. Video Player (full width)
- 16:9 dark area (#000000 / surface-container-lowest)
- Centered play button icon
- Duration label "3:42" bottom-right
- Thin timeline scrubber below

#### C. Multi-Track Neural Activation Timeline (KEY COMPONENT)
- Title: "Neural Activation Timeline" with psychology icon
- 4 stacked area charts, each ~80px tall:
  - **Attention** — `#60a5fa` (blue) area with gradient fill
  - **Reward** — `#a78bfa` (purple) area with gradient fill
  - **Emotional Processing** — `#f472b6` (pink/rose) area with gradient fill
  - **Social Cognition** — `#fbbf24` (amber) area with gradient fill
- X-axis: shared time axis (0:00 to video duration)
- Y-axis: 0-100 per track (label on left)
- Vertical playhead line spanning all 4 tracks
- Hover tooltip showing all 4 values at timestamp
- Gradient fills fade to transparent at bottom of each track

**Recommended library:** Recharts (installed via `npx skills add ansanabria/skills@recharts`)
- Use `<AreaChart>` with custom gradient `<defs>` for each track
- Stack 4 separate `<ResponsiveContainer>` vertically (not stacked area — separate charts sharing x-domain)
- Custom tooltip component for cross-track hover

#### D. Metrics Row (4 cards)
- Overall Score: "87" + letter grade "A" badge + circular ring
- Hook Score: "92" + trend arrow
- Retention: "78%" + sparkline
- Peak Moment: "1:23" + star icon

#### E. Bottom Section (2 columns)
- Left col-span-5: Region Breakdown — 4 horizontal bars colored to match tracks
- Right col-span-7: Segment Explorer table (Segment, Time, Attention, Reward, Emotional, Social, Overall)

#### Design Tokens
- Cards: `surface-container-high` (#1f1f22), `rounded-xl`, no borders
- Background: `surface` (#0e0e10)
- Video well: `surface-container-lowest` (#000000)
- Accent: `primary` (#ba9eff)
- Track colors: blue #60a5fa, purple #a78bfa, pink #f472b6, amber #fbbf24
- Font: Inter (body), Space Grotesk (headlines/scores)

---

## Implementation Priority

| # | Screen | Status | Implementation Effort |
|---|--------|--------|-----------------------|
| 1 | Results Detail v2 — Multi-Track Timeline | Design spec only | High (new Recharts component, data wiring) |
| 2 | Forgot Password | Stitch design complete | Low (copy auth pattern, add Supabase reset) |
| 3 | Sign Up improvements | Use existing Stitch screen | Low (add password strength + terms) |

## Next Steps

1. Install Recharts: `npm install recharts` in web/
2. Build `NeuralTimeline` component using the design spec above
3. Add video player placeholder to Results Detail page
4. Create Forgot Password page using Stitch HTML as reference
5. Wire up Supabase `resetPasswordForEmail`
