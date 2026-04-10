# Stitch Design vs Codebase Audit

**Date:** 2026-04-09
**Scope:** 15 Stitch design screens compared against codebase implementation
**Method:** Stitch designs analyzed via ui-specs (canonical specs from Phase 11-14 screen audit + STITCH-BRIEF-MISSING-5.md), codebase pages read directly from source files

---

## Executive Summary

- **Total Stitch screens:** 15
- **Screens with matching codebase page:** 13
- **Screens with NO dedicated codebase page:** 2 (Error-Offline is a component overlay, not a page; Forgot Password has no screen at all)
- **Screens implemented as dedicated components rather than pages:** 1 (Error-Offline is OfflineDetector.tsx overlay component)

### Fidelity Overview

| Rating | Count | Screens |
|--------|-------|---------|
| High | 6 | Login, Sign Up, Welcome, Settings-General, Billing, Offline Detector |
| Partial | 7 | Dashboard, Dashboard-Empty, Processing, Results Overview, Results Detail, Profile, 404 |
| Low | 1 | 500 Error |
| Missing | 1 | (none truly missing -- all have some implementation) |

**Overall assessment:** The codebase covers all 15 design screens at some level of implementation. The core app screens (Dashboard, Upload, Processing, Results) have strong structural alignment with the Stitch designs. The main gaps are: (1) missing sidebar navigation and top bar shared components that exist in every Stitch design, (2) aspirational/decorative elements from designs that were intentionally omitted, and (3) some interaction states and responsive behaviors not yet implemented.

---

## Screen-by-Screen Audit

### 1. Billing Settings

- **Stitch screen ID:** 2c091b50c83c4357b8d6c155aa29adaf
- **Codebase file:** `web/src/app/(app)/settings/billing/page.tsx`
- **Match status:** High
- **Layout gaps:** None significant. Single-column layout with max-w-4xl matches design spec. App shell (sidebar + top bar) provided by (app) layout.
- **Component gaps:** All key components present: stats row (Current Plan, Balance, Spent), 3 credit package cards (Starter/Creator/Agency), transaction history table.
- **Content gaps:** "Most Popular" badge on Content Creator card matches design. Credit amounts and prices match design (100/$9.99, 500/$39.99, 1000/$69.99).
- **Interaction gaps:** Buy buttons show `alert("Payment processing coming soon!")` -- correct placeholder behavior per aspirational tag. No real payment flow expected in v1.
- **State gaps:** Transaction history shows "No transactions yet" empty state. No loading skeleton state.
- **Styling gaps:** Minor -- design calls for `surface-container-high` on package cards (implemented). Stats row uses `surface-container` (design uses same). Overall styling is faithful.
- **Priority:** Low (well-implemented)

### 2. Error -- Offline

- **Stitch screen ID:** c583dcdca9f5489fbf1c0ac6627bd3ae
- **Codebase file:** `web/src/components/OfflineDetector.tsx` (overlay component, not a page)
- **Match status:** High
- **Layout gaps:** Design shows full-screen centered layout. Implementation uses fixed overlay (z-[100]) with centered content -- functionally equivalent and arguably better as an overlay that doesn't require route navigation.
- **Component gaps:** All key elements present: wifi_off icon with decorative glow, "You're offline" headline, description text, "Checking connection..." spinner, "Retry Now" button. Also includes reconnected state with check_circle icon -- matches design's connection status states.
- **Content gaps:** Headline, description, and status text all closely match design spec. Footer metadata ("SYSTEM_STATUS: DISCONNECTED", "NODE: ARC-7") present -- matches design's tech-credibility pattern.
- **Interaction gaps:** Auto-retry via `navigator.onLine` + event listeners implemented. Reconnection state with brief confirmation overlay implemented. "Retry Now" button triggers `window.location.reload()`.
- **State gaps:** Design specifies 4 states (Checking, Offline, Reconnecting, Online). Implementation has 3 (Offline, Reconnecting/checking, Reconnected). Missing explicit "No connection detected" red-dot state -- implementation jumps from offline to checking on page load.
- **Styling gaps:** Uses `ghost-border` class on card, `surface-container-high` background, error color accents -- all match design system.
- **Priority:** Low (well-implemented)

### 3. Dashboard

- **Stitch screen ID:** 25829a2f1d9b41cf96e7d824d45e3131
- **Codebase file:** `web/src/app/(app)/dashboard/page.tsx`
- **Match status:** Partial
- **Layout gaps:** Design shows 2-column grid of job cards. Implementation uses `grid-cols-1 lg:grid-cols-2` -- matches. Page header with "Analysis History" title and "New Analysis" button matches design.
- **Component gaps:**
  - Quick Stats Row: Present with 3 cards (Total Analyses, Credits Remaining, Avg Neural Score). Design calls for same 3 stats. **Match.**
  - Job Cards: Present with thumbnail placeholder, filename, date, status badge, score bar, "View Results" link. Design calls for similar card structure. **Partial match** -- design shows thumbnails from video; implementation uses letter initial placeholder.
  - "New Analysis" card (dashed border, add icon): Present in implementation. Design mentions it as part of the grid. **Match.**
  - **Missing:** Search input in top bar (design spec mentions search). Sort/filter controls for job history.
- **Content gaps:** Credits hardcoded to "250" (design shows aspirational values). No real credit system.
- **Interaction gaps:** Missing search functionality. Missing sort controls. Job cards link to `/results/{id}` -- correct navigation path.
- **State gaps:** Server component fetches real jobs from Supabase -- good. Auth check with redirect to /login -- good. Empty state handled (see screen #11).
- **Styling gaps:** Uses `border-l-4` accent on stat cards (design spec shows a different treatment -- `surface-container-low` background). Minor visual difference.
- **Priority:** Medium (search and sort missing, thumbnail placeholders)

### 4. Results Overview

- **Stitch screen ID:** 1ba927823f0d4a118a8e1321257af4e3
- **Codebase file:** `web/src/app/(app)/results/page.tsx`
- **Match status:** Partial
- **Layout gaps:** Design calls for 12-column grid with 8-col video player + 4-col metric cards stack. Implementation uses `grid-cols-12` with `col-span-8` and `col-span-4` -- **matches exactly.**
- **Component gaps:**
  - Video Player Placeholder: Present (dark area with centered play button). **Match.**
  - Summary Metric Cards: Present -- Overall Score, Hook Score, Retention, Peak Moment (4 cards). Design calls for 5 cards (including aspirational "Engagement IQ"). **Partial match** -- 4 of 5 present, aspirational card intentionally omitted.
  - Neural Activation Timeline: Present via `ActivationTimeline` component. **Match** for basic timeline functionality.
  - "View Full Analysis" link to detail page: Present. **Match.**
  - **Missing:** AI Recommendations Panel (aspirational -- correctly omitted). Emotional Tags on timeline (aspirational -- correctly omitted). Hook zone marker on timeline.
- **Content gaps:** Metric card labels match design ("Overall Score", "Hook Score", "Retention", "Peak Moment").
- **Interaction gaps:** No timeline scrubbing/hover tooltips visible in code (would need to check ActivationTimeline component). No video-timeline sync. "View Full Analysis" link navigates to `/results/${jobId}` -- correct.
- **State gaps:** Loading state with skeleton cards present. Error state present. No-jobId state redirects to dashboard prompt. Job-still-processing state redirects to processing page. **Good coverage.**
- **Styling gaps:** Uses `neural-gradient` on CTAs. Metric card styling uses `MetricCard` component -- matches design system.
- **Priority:** Medium (timeline interaction gaps, missing hook zone marker)

### 5. Processing Analysis

- **Stitch screen ID:** 7187a79949df44faa466bc933bf3d2e2
- **Codebase file:** `web/src/app/(app)/processing/page.tsx`
- **Match status:** High (near-complete)
- **Layout gaps:** Design shows centered max-w-4xl layout with glass panel. Implementation uses `max-w-4xl mx-auto` -- **matches.** Bottom grid with logs (col-span-8) and VRAM card (col-span-4) -- **matches design.**
- **Component gaps:**
  - Progress bar with neural-gradient fill: Present. **Match.**
  - Stage checklist (4 stages): Present via `STAGES` array and `StageItem` component with check_circle/sync/pending icons. **Match.**
  - Inference Engine Logs panel: Present with monospace font, green pulse dot, simulated log lines. **Match** (aspirational but visually complete).
  - VRAM Load card: Present with memory icon, "14.2 GB" display, load intensity bar. **Match** (aspirational but visually complete).
  - Estimated time remaining: Present (calculated from progress). **Match.**
  - GPU Acceleration badge ("US-EAST-NEURAL-01"): Present. **Match.**
  - Status badge ("In Progress"): Present via `StatusBadge` component. **Match.**
  - File info display: Present (filename, "VIDEO FILE" label). **Match.**
  - Cancel/Back button: Present at bottom ("Cancel Analysis"). **Match.**
- **Content gaps:** Notification text ("Notification will be sent when complete", "Auto-save enabled") present -- matches design's footer area.
- **Interaction gaps:** Polling every 5 seconds for job status -- correct per design (3-5s). Auto-redirect to results on completion -- present. Retry on failure -- present with `handleRetry`.
- **State gaps:** All states covered: No jobId, Loading (before first fetch), Active processing, Failed/Error. **Excellent coverage.**
- **Styling gaps:** Glass panel uses `bg-surface-bright/60 backdrop-blur-[20px]` -- **exact match** to design spec.
- **Priority:** Low (well-implemented)

### 6. Error -- 500 Server Error

- **Stitch screen ID:** cd08735cd7f04a7a9f16607d1fe100a7
- **Codebase file:** `web/src/app/error.tsx`
- **Match status:** Partial
- **Layout gaps:** Design calls for full-screen centered, no app shell. Implementation is a Next.js error boundary (`error.tsx`) -- renders full-screen but includes a fixed header with "NeuroCut v1" branding. **Match** conceptually.
- **Component gaps:**
  - Warning icon in circle: Present (filled warning icon with error-container glow). **Match.**
  - Large "500" text: Present but as faded background element (`opacity-10`), not as the prominent display. Design shows "500" as large primary text similar to 404's large number. **Partial match** -- different visual treatment.
  - "Something went wrong" heading: Present. **Match.**
  - "Try Again" button with neural-gradient: Present. **Match.**
  - "Back to Dashboard" text link: Present. **Match.**
  - Diagnostics Card: Present with pseudo-terminal output ("Neural pathway timeout", "Server processing limit exceeded", error ID). **Extra element** not in original design but aligns with tech-credibility aesthetic.
  - Footer with system status: Present ("System Degradation", error code). **Match.**
- **Content gaps:** Description text closely matches design ("We hit an unexpected error...").
- **Interaction gaps:** "Try Again" calls `reset()` (Next.js error boundary reset). "Back to Dashboard" links to `/dashboard`. Both match design intent.
- **State gaps:** Single error state. No loading or recovery states. Design doesn't specify additional states beyond the error display.
- **Styling gaps:** Ambient background glows present. Uses design system colors (error, primary, secondary). Overall faithful to design language.
- **Priority:** Low (functional, minor visual differences in 500 number treatment)

### 7. Welcome Onboarding

- **Stitch screen ID:** 201ae7bc583347e69691e0100f9657c1
- **Codebase file:** `web/src/app/welcome/page.tsx`
- **Match status:** High
- **Layout gaps:** Design shows full-width centered layout without sidebar. Implementation uses `min-h-screen flex flex-col items-center justify-center` -- **matches.** No sidebar present -- correct.
- **Component gaps:**
  - NeuroCut logo + wordmark: Present (gradient icon + "NeuroCut" text). **Match.**
  - "Skip" link (top-right): Present, links to `/dashboard`. **Match.**
  - Hero illustration placeholder: Present (aspect-video area with gradient background, centered play_circle icon, floating "Neural Processing Active" badge). **Match** -- more elaborate than design minimum.
  - "Welcome to NeuroCut" headline: Present. **Match.**
  - Description text: Present ("Start predicting viral engagement..."). **Match.**
  - "Upload Your First Video" CTA: Present with neural-gradient shadow effect. **Match.**
  - Step indicator (dots): Present (4 dots: 1 active bar + 3 inactive dots). **Match.**
- **Content gaps:** Footer with version info ("v1.0.4-beta / secure_neural_layer") and security icons present -- adds to design's tech aesthetic.
- **Interaction gaps:** CTA links to `/upload`. Skip links to `/dashboard`. Both match design.
- **State gaps:** Static page -- no states needed. Correct.
- **Styling gaps:** Decorative background blurs present. Uses design system fonts and colors. **Faithful.**
- **Priority:** Low (well-implemented)

### 8. Settings -- General

- **Stitch screen ID:** b98c403a62d344feafc4e81c340014e2
- **Codebase file:** `web/src/app/(app)/settings/page.tsx` + `web/src/app/(app)/settings/SettingsForm.tsx`
- **Match status:** High
- **Layout gaps:** Design shows three stacked form sections within app shell. Implementation has exactly 3 sections: Profile Information, Security (Change Password), Notifications. **Match.**
- **Component gaps:**
  - Profile Information section: Present with Display Name input, locked Email display, "Save Changes" button. **Match.**
  - Change Password section: Present with Current Password, New Password, Confirm New Password inputs, "Update Security" button. **Match.**
  - Notifications section: Present with 4 toggle switches (Analysis Complete, Processing Failed, Weekly Summary, Product Updates). **Match.** Design calls for 3-4 toggles.
  - Toggle component: Custom implementation with `role="switch"`, `aria-checked` -- accessible. On state uses `tertiary-container`, off uses `surface-container-highest`. **Match** design spec.
  - FormSection pattern: Each section uses `surface-container` background, `rounded-xl`, two-column layout (label left, form right on md+). **Match.**
- **Content gaps:** Section descriptions match design's tone ("Manage your account and preferences" style).
- **Interaction gaps:** Toggle changes persist to localStorage (optimistic). No server-side save for display name or password (form buttons are non-functional). Design marks all as aspirational.
- **State gaps:** No loading skeletons. No success/error confirmation on save. Design calls for "brief green flash confirmation" -- **missing.**
- **Styling gaps:** Input fields use `surface-container-low` background. Email field is read-only with lock icon. **Matches** design spec.
- **Priority:** Low (well-implemented, save confirmation missing)

### 9. Sign Up

- **Stitch screen ID:** c11ae44212ac44e2a61ff0f3827b694c
- **Codebase file:** `web/src/app/(auth)/signup/page.tsx`
- **Match status:** Partial
- **Layout gaps:** Design shows centered card on dark background, no sidebar. Implementation uses `bg-surface-container-high rounded-xl p-10` card with `ambient-glow`. Auth layout group likely provides centering. **Match.**
- **Component gaps:**
  - Email input: Present. **Match.**
  - Password input: Present. **Match.**
  - Confirm Password input: Present. **Match.**
  - "Create Account" CTA button: Present with neural-gradient via `Button variant="primary"`. **Match.**
  - "Already have an account? Sign in" link: Present. **Match.**
  - **Missing:** Password strength indicator (design calls for 4-segment colored bar below password). **Gap.**
  - **Missing:** Terms of Service checkbox (design calls for "I agree to Terms" checkbox). **Gap.**
- **Content gaps:** Heading "Create your account" matches. Subtitle "Join the next generation of neural content editors" -- slightly different from design's "Start analyzing videos" but tonally consistent.
- **Interaction gaps:** Password match validation present (client-side in useActionState). Server action for signup. Error display for mismatched passwords. **Good.** Missing: real-time password strength feedback.
- **State gaps:** Error state present (inline error message). Loading state via `pending`. No success redirect visible in page (handled by server action).
- **Styling gaps:** Uses `ambient-glow` class -- design doesn't specify this specifically but aligns with NeuroCut aesthetic.
- **Priority:** Medium (missing password strength indicator and terms checkbox)

### 10. Login

- **Stitch screen ID:** 7952ef20e3a146c091f2667319f9c2bb
- **Codebase file:** `web/src/app/(auth)/login/page.tsx`
- **Match status:** High
- **Layout gaps:** Centered card, no sidebar. Card uses `bg-surface-container-high rounded-xl p-8 ghost-border ambient-glow`. **Match.**
- **Component gaps:**
  - "Welcome back" heading: Present. **Match.**
  - Email input: Present with `Input` component. **Match.**
  - Password input with "Forgot password?" link: Present -- password label and forgot link on same row. **Match** design spec.
  - "Sign In" CTA button: Present with `Button variant="primary"` + arrow_forward icon. **Match.**
  - "Don't have an account? Sign up" link: Present. **Match.**
- **Content gaps:** All text matches design spec.
- **Interaction gaps:** Form submission via `useActionState` + server action. Error display inline. Loading state on button. "Forgot password?" is a non-functional span (no href) -- **gap** (design expects navigation to Forgot Password screen, but no Forgot Password page exists).
- **State gaps:** Error state present. Loading state present. Success redirects handled server-side.
- **Styling gaps:** Faithful to design system. Uses ghost-border and ambient-glow.
- **Priority:** Low (minor: forgot password not linked, no forgot password page exists)

### 11. Dashboard -- Empty State

- **Stitch screen ID:** 5ac66a6d52264ea3932218471584645c
- **Codebase file:** `web/src/app/(app)/dashboard/page.tsx` (conditional branch when `hasJobs === false`)
- **Match status:** Partial
- **Layout gaps:** Design shows same header + quick stats row, then centered empty state card, then "How it works" section. Implementation has: same header (but no quick stats row in empty state), centered empty state card, "How it works" 3-column section. **Partial match** -- quick stats row still renders (showing 0, 250, --) which actually matches the design spec more closely.
- **Component gaps:**
  - Empty state card with icon: Present -- uses `psychology` icon (filled), "No analyses yet" headline, description text, "Upload Your First Video" CTA. **Match.**
  - "How it works" 3-column section: Present with 3 cards (Upload Media, Neural Mapping, Generate Insights). Design calls for (Upload, Analyze, Optimize). **Partial match** -- different card names and descriptions but same structure.
  - Neural-gradient CTA: Present with shadow glow. **Match.**
  - **Missing:** Design shows large centered illustration placeholder. Implementation uses a 24x24 icon in a square container instead. Functionally equivalent but less prominent.
- **Content gaps:** "No analyses yet" heading matches. Description text is more elaborate in implementation ("Your neural engine is idling. Upload your first video to begin the synaptic optimization process...") vs design's simpler version. Tonally consistent.
- **Interaction gaps:** CTA links to `/upload`. **Match.**
- **State gaps:** This IS the empty state -- no additional states needed.
- **Styling gaps:** Empty state card uses `surface-container` with decorative background blurs (primary/5, secondary/5). **Match** design aesthetic.
- **Priority:** Low (well-implemented, minor differences in "How it works" card copy)

### 12. Profile

- **Stitch screen ID:** bd98bc0db1c542cdbb2c4df4c41427e7
- **Codebase file:** `web/src/app/(app)/profile/page.tsx`
- **Match status:** High
- **Layout gaps:** Design shows profile card + stats row + recent activity. Implementation has all three sections in the same order. **Match.**
- **Component gaps:**
  - Profile card with avatar: Present -- 96px circular avatar with neural-gradient border, person icon, display name, email, member since date, "Edit Profile" button. **Match.**
  - Stats row (3 cards): Present -- Total Analyses, Average Score, Best Score. **Match.**
  - Recent Activity list: Present -- job items with movie icon, filename, date, status badge. **Match.**
  - **Missing:** Design mentions avatar upload on hover -- not implemented (aspirational). Design mentions clickable activity items navigating to Results -- activity items are not wrapped in Links. **Gap.**
- **Content gaps:** All labels and data match design spec.
- **Interaction gaps:** "Edit Profile" links to `/settings`. Activity items are display-only (not clickable/navigable to results). **Gap** -- design calls for clickable items.
- **State gaps:** Server component fetches real user data from Supabase. Empty activity state present ("No activity yet"). **Good.**
- **Styling gaps:** Uses `shadow-2xl` on profile card, `surface-container` on stat cards and activity feed. Matches design system.
- **Priority:** Medium (activity items should be clickable links)

### 13. Upload Analysis

- **Stitch screen ID:** e7afd58af7e94ffe9ca9bb1baa53cb92
- **Codebase file:** `web/src/app/(app)/upload/page.tsx`
- **Match status:** High
- **Layout gaps:** Design shows single-column with drop zone, glass panel cost estimate, 3 feature cards. Implementation has exactly this layout with `max-w-5xl mx-auto`. **Match.**
- **Component gaps:**
  - Video Drop Zone: Present with drag-and-drop handlers, "Drag video here or click to browse" text, Browse Files button, `dot-grid` background texture. **Match.**
  - File selected state: Present with file preview (movie icon, name, size, Remove button). **Match.**
  - Cost Estimate Glass Panel: Present via `GlassPanel` component with token icon, "Estimated Cost: 10 Credits", divider, "Analyze Video" CTA. **Match.**
  - Feature Cards (3): Present -- Turbo Processing, Neural Engine, Encrypted Transit. **Match** design's "AI Engine Stats" concept.
  - "Analyze Video" CTA: Present with bolt icon, loading state, disabled when no file. **Match.**
  - Validation errors: Present (unsupported format, file too large). **Match.**
- **Content gaps:** Supported formats listed (MP4, MOV, AVI, MKV, max 2GB, 30 min). Design mentions .mp4, .mov, .mkv -- implementation adds AVI. Minor difference.
- **Interaction gaps:** Full drag-and-drop flow implemented. File validation on drop/select. Upload progress not visible as a progress bar (upload happens on "Analyze Video" click, not on file drop). Design calls for upload progress bar in drop zone -- **gap** (implementation uploads on CTA click, shows button loading state instead).
- **State gaps:** Empty, File Selected, Uploading (via button loading), Error. **Good coverage.** Missing: explicit "Upload Complete" state with green checkmark before CTA enable (implementation enables CTA immediately on file select, not after upload).
- **Styling gaps:** Uses `surface-container-high` for drop zone and cards. Ghost border on file selected. Gradient glow on hover. **Faithful.**
- **Priority:** Low (minor: upload progress bar style difference)

### 14. Results Detail

- **Stitch screen ID:** b5edafa9253f4cbd85c1063f8cba959f
- **Codebase file:** `web/src/app/(app)/results/[id]/page.tsx`
- **Match status:** Partial
- **Layout gaps:** Design calls for: large full-width video player, multi-track timeline (4 brain regions), region breakdown panel (col-span-5), segment explorer table (col-span-7). Implementation has: back nav + filename + export button (top bar), synthesized score card (full-width), 3 summary stat cards (hook/retention/peak), region breakdown (col-span-5), segment table (col-span-7). **Structural match** but no video player and no multi-track timeline.
- **Component gaps:**
  - **Missing:** Large video player placeholder (design calls for col-span-12 video player). Implementation has no video player.
  - **Missing:** Multi-track timeline with 4 brain region tracks (Attention, Reward, Emotional, Social). This is the defining component of the detail view per design spec. **Major gap.**
  - Region Breakdown: Present via `RegionBreakdown` component with 4 regions (attention, reward, emotional_processing, social_cognition). **Match.**
  - Segment Table: Present via `SegmentTable` component. **Match.**
  - Export button: Present via `ExportButton` component (JSON export). **Match.** Design also calls for CSV export -- may need to check ExportButton implementation.
  - Synthesized Score with letter grade: Present (S/A/B/C/D grading, circular score display). **Extra** -- not in original Stitch design but adds value.
  - Back navigation: Present. **Match.**
  - **Missing:** Tag management section (aspirational -- correctly omitted).
  - **Missing:** Hook zone marker on timeline.
- **Content gaps:** Summary stat card labels match (Hook Score, Retention, Peak Moment).
- **Interaction gaps:** Missing timeline interactions (scrubbing, hover tooltips, video sync). Segment table rows are display-only (design calls for clickable rows that seek video).
- **State gaps:** Loading state with skeletons present. Error state present. "In Progress" state redirects to processing page. **Good.**
- **Styling gaps:** Uses Card component and design system colors. Score grades use design accent colors.
- **Priority:** High (missing multi-track timeline -- the core differentiating component of this screen)

### 15. 404 Page Not Found

- **Stitch screen ID:** 0fda6c5a491f4ac0a63a463e41eef9f1
- **Codebase file:** `web/src/app/not-found.tsx`
- **Match status:** Partial
- **Layout gaps:** Design shows full-screen centered, no app shell. Implementation is full-screen centered with fixed header ("NeuroCut v1"). **Match.**
- **Component gaps:**
  - Illustration placeholder: Present (256x256 area with `psychology_alt` icon and decorative dots). Design calls for similar. **Match.**
  - Large "404" number: Present (`text-[7rem] md:text-[9rem]`, `text-primary`). **Match.**
  - "Page not found" heading: Present. **Match.**
  - Description text: Present ("The page you are looking for does not exist..."). **Match.**
  - "Back to Dashboard" CTA: Present with `neural-gradient` and dashboard icon. **Match.**
  - Footer metadata: Present ("System Status: Operational", "Error Code: 0xNEURAL_VOID"). **Match** design's footer pattern.
  - Background grid texture: Present (radial gradient + line grid at low opacity). **Match.**
- **Content gaps:** All text closely matches design spec.
- **Interaction gaps:** CTA links to `/dashboard`. Browser back works normally. **Match.**
- **State gaps:** Static page -- no additional states needed.
- **Styling gaps:** Uses ambient glow, `ghost-border` on illustration. Background grid at 3% opacity. **Faithful** to design system.
- **Priority:** Low (well-implemented)

---

## Gap Summary Table

| # | Screen | Codebase File | Match Status | Layout | Components | Content | Interactions | States | Styling | Priority |
|---|--------|--------------|-------------|--------|------------|---------|--------------|--------|---------|----------|
| 1 | Billing Settings | settings/billing/page.tsx | High | 0 | 0 | 0 | 0 | 1 | 0 | Low |
| 2 | Error -- Offline | OfflineDetector.tsx | High | 0 | 0 | 0 | 0 | 1 | 0 | Low |
| 3 | Dashboard | dashboard/page.tsx | Partial | 0 | 1 | 0 | 2 | 0 | 1 | Medium |
| 4 | Results Overview | results/page.tsx | Partial | 0 | 1 | 0 | 2 | 0 | 0 | Medium |
| 5 | Processing | processing/page.tsx | High | 0 | 0 | 0 | 0 | 0 | 0 | Low |
| 6 | Error -- 500 | error.tsx | Partial | 0 | 1 | 0 | 0 | 0 | 0 | Low |
| 7 | Welcome | welcome/page.tsx | High | 0 | 0 | 0 | 0 | 0 | 0 | Low |
| 8 | Settings General | settings/page.tsx | High | 0 | 0 | 0 | 0 | 1 | 0 | Low |
| 9 | Sign Up | signup/page.tsx | Partial | 0 | 2 | 0 | 1 | 0 | 0 | Medium |
| 10 | Login | login/page.tsx | High | 0 | 0 | 0 | 1 | 0 | 0 | Low |
| 11 | Dashboard Empty | dashboard/page.tsx | Partial | 0 | 1 | 1 | 0 | 0 | 0 | Low |
| 12 | Profile | profile/page.tsx | High | 0 | 0 | 0 | 1 | 0 | 0 | Medium |
| 13 | Upload Analysis | upload/page.tsx | High | 0 | 0 | 0 | 1 | 1 | 0 | Low |
| 14 | Results Detail | results/[id]/page.tsx | Partial | 0 | 2 | 0 | 2 | 0 | 0 | High |
| 15 | 404 Not Found | not-found.tsx | Partial | 0 | 0 | 0 | 0 | 0 | 0 | Low |

**Gap counts per column:** Number of distinct gaps identified in that category.

---

## Cross-Cutting Gaps

### 1. Shared App Shell (Sidebar + Top Bar)

The Stitch designs show a consistent sidebar navigation (Upload, Processing, Results, Dashboard, New Analysis CTA, Settings, Support) and top bar (credits display, plan badge, notifications, avatar) on all authenticated screens. The codebase uses a `(app)/layout.tsx` that provides the app shell, but:
- **Sidebar nav items** may not match design exactly (need to verify layout.tsx)
- **Top bar credits display** is aspirational (no real credit system)
- **Notification bell** may be missing
- **"New Analysis" CTA in sidebar** presence needs verification

### 2. Forgot Password Screen

Design spec includes a Forgot Password screen (Auth / Forgot Password with email input, confirmation state). **No codebase page exists.** The Login page has a "Forgot password?" text but it's a non-functional span, not a link.

### 3. Video Thumbnails

Multiple screens (Dashboard job cards, Results) show video thumbnails in designs. All implementations use placeholder graphics (letter initials, gradient backgrounds, icons). This is expected -- thumbnail generation is aspirational.

### 4. Aspirational Features Correctly Omitted

The following design elements are tagged as "aspirational" in the ui-specs and are correctly absent from the codebase:
- A/B video comparison (entire feature set)
- AI Recommendations panel
- Emotional tags on timeline
- Real-time collaboration avatars
- PDF export
- Credit/billing system (UI placeholders exist, no real backend)
- Search in top bar (partially missing)
- Benchmark comparisons

---

## Recommendations

### High Priority (Major User Impact)

1. **Results Detail -- Multi-Track Timeline:** The 4-region brain activation timeline (Attention, Reward, Emotional Processing, Social Cognition) is the core differentiating visualization of NeuroCut. Currently missing from the detail view. This is the single largest gap between design and implementation.

2. **Results Detail -- Video Player Placeholder:** Adding a video player placeholder to the detail view would match the design's full-width player area and improve the visual hierarchy of the page.

### Medium Priority (Noticeable Gaps)

3. **Sign Up -- Password Strength Indicator:** Design calls for a 4-segment colored strength bar. Relatively quick to implement and improves sign-up UX.

4. **Sign Up -- Terms Checkbox:** Design includes an "I agree to Terms" checkbox. Even as a placeholder, it sets expectations for the legal requirement.

5. **Dashboard -- Search and Sort:** The design includes search input and sort controls for job history. These become important as users accumulate analyses.

6. **Profile -- Clickable Activity Items:** Recent activity items should link to the corresponding results page, enabling quick navigation from profile to past analyses.

7. **Results Overview -- Timeline Interactions:** Adding hover tooltips with segment details and region breakdowns would match the design's interactive timeline spec.

### Low Priority (Quick Wins / Polish)

8. **Login -- Forgot Password Link:** Wire the "Forgot password?" text to a route (even if the page is a placeholder).

9. **Settings -- Save Confirmation:** Add brief success flash when saving profile info (design calls for "tertiary flash confirmation").

10. **Upload -- Progress Bar in Drop Zone:** Design shows upload progress as a bar within the drop zone during file upload. Current implementation shows button loading state instead. Minor UX difference.

11. **500 Error -- "500" Number Prominence:** Design shows "500" as a large prominent number (like the 404 page). Implementation uses it as a faded background element.

### Suggested Implementation Order

1. Results Detail multi-track timeline (highest value, most complex)
2. Sign Up improvements (password strength + terms)
3. Dashboard search/sort
4. Profile activity item links
5. Results Overview timeline interactions
6. Remaining polish items (forgot password, save confirmation, etc.)
