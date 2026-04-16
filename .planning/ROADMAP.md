# Roadmap: BrainRank

## Milestones

- ✅ **v1.0 Inference Pipeline** - Phases 1-10 (shipped 2026-04-09)
- ✅ **v1.1 UI Audit & Consolidation** - Phases 11-14 (shipped 2026-04-09)
- ✅ **v2.0-v2.2 Frontend Implementation** - Phases 15-37 (shipped 2026-04-11)
- ✅ **v3.0 Brain Visualization UX Overhaul** - Phases 38-43 (shipped 2026-04-11)
- ✅ **v4.0 Social Discovery Platform** - Phases 44-51 (shipped 2026-04-12)
- ✅ **v5.0 Multi-Modal Input & Comparison** - Phases 52-58 (shipped 2026-04-13)
- ⏸️ **v6.0 Stripe Payments** - Phases 59-64 (paused)
- ✅ **v7.0 BrainRank Landing Page** - Phases 65-67 (shipped 2026-04-15)
- 🚧 **v8.0 Mobile Optimization** - Phases 68-73 (in progress, started 2026-04-16)

## Phases

<details>
<summary>✅ v1.0 through v5.0 (Phases 1-58) - SHIPPED</summary>

See MILESTONES.md for full history of shipped phases 1-58.

</details>

<details>
<summary>⏸️ v6.0 Stripe Payments (Phases 59-64) - PAUSED</summary>

- [ ] **Phase 59: Stripe Schema & Config** - Supabase schema for subscriptions, Stripe SDK setup, env vars
- [ ] **Phase 60: Webhook Handler** - Stripe webhook endpoint with signature verification and event processing
- [ ] **Phase 61: Checkout & Portal** - Stripe Checkout for Creator tier, Customer Portal for billing management
- [ ] **Phase 62: Credit Gating** - Free tier limits (5/week), Creator unlimited, credit display and upgrade prompts
- [ ] **Phase 63: Billing UI** - Real subscription status on billing page, cancel-at-period-end, plan badge
- [ ] **Phase 64: Payment Polish** - Inline upgrade prompts, annual upsell, idempotent webhooks, grace period

</details>

<details>
<summary>✅ v7.0 BrainRank Landing Page (Phases 65-67) - SHIPPED 2026-04-15</summary>

- [x] **Phase 65: Landing Page Foundation & Hero** (2/2 plans) — completed 2026-04-15
- [x] **Phase 66: Content Sections** (2/2 plans) — completed 2026-04-15
- [x] **Phase 67: Polish & Responsiveness** (1/1 plan) — completed 2026-04-15

</details>

### v8.0 Mobile Optimization (Phases 68-73)

- [ ] **Phase 68: Mobile Shell & Navigation Primitive** - TopBar hamburger, MobileNavSheet, responsive AppShell gutters
- [ ] **Phase 69: Auth & Onboarding Flow Mobile** - Login, signup, verify, onboarding, welcome pages on iPhone 15
- [ ] **Phase 70: Core Hub Pages Mobile** - Dashboard, Profile, Discover, Bookmarks, public `/u/[username]` on iPhone 15
- [ ] **Phase 71: Content Flow Mobile** - Upload → Processing → Results → Analysis (private + public) + BrainViewer touch + timeline/tables/comparison
- [ ] **Phase 72: Settings, Billing, Pricing, Resources, Use-Cases Mobile** - Secondary and marketing-adjacent pages on iPhone 15
- [ ] **Phase 73: Mobile QA Sweep & Polish** - Playwright iPhone 15 + desktop screenshot sweep, touch target audit, reduced-motion, regression check

## Phase Details

### Phase 68: Mobile Shell & Navigation Primitive
**Goal**: Establish a responsive chrome (TopBar + AppShell + MobileNavSheet) so every downstream phase inherits a working mobile shell without touching the desktop layout.
**Depends on**: Nothing (foundation phase for v8.0)
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05
**Success Criteria** (what must be TRUE):
  1. TopBar header renders within a 390px viewport with no horizontal overflow at any auth state.
  2. User can tap a hamburger button on `<md` viewports to open a slide-down `MobileNavSheet`, and tap the backdrop or a close control to dismiss it.
  3. Mobile nav sheet exposes Dashboard / Upload / Discover nav links, a credits label, and Profile / Bookmarks / Billing / Settings / Resources / Logout entries.
  4. AppShell content gutters are 16px on mobile and 32px at `md+`, so content never touches screen edges on iPhone 15.
  5. At `≥md` the TopBar and AppShell render visually identically to the pre-milestone desktop layout (no regressions in Playwright desktop screenshot diff).
**Plans**: TBD
**UI hint**: yes

### Phase 69: Auth & Onboarding Flow Mobile
**Goal**: Every first-touch page a mobile signup hits (login, signup, email verification, onboarding, welcome) is completable on iPhone 15 without horizontal scroll or unreachable CTAs.
**Depends on**: Phase 68 (MobileNavSheet + AppShell gutters)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can land on `/login` or `/signup` at 390×844, see full-width inputs and stacked OAuth buttons, and submit without horizontal scroll.
  2. User can complete the email verification page on iPhone 15 — verification code/instruction UI fits within the viewport and action buttons are tappable (≥44×44px).
  3. User can step through every onboarding screen on iPhone 15; inputs, progress indicators, and continue buttons are visible and tappable without scrolling horizontally.
  4. User can view the welcome page on iPhone 15 with hero content, CTAs, and next-step links rendered inside the viewport.
**Plans**: TBD
**UI hint**: yes

### Phase 70: Core Hub Pages Mobile
**Goal**: The pages an authenticated user lands on most (Dashboard, Profile, Discover, Bookmarks, public `/u/[username]`) render cleanly on iPhone 15 with no truncations or hardcoded desktop widths.
**Depends on**: Phase 68 (shell), Phase 69 can run in parallel but shell must be first
**Requirements**: HUB-01, HUB-02, HUB-03, HUB-04, HUB-05
**Success Criteria** (what must be TRUE):
  1. User can view the Dashboard on iPhone 15 with stats tiles, hero CTA, and activity grid visible and stacking without horizontal scroll.
  2. User can view their Profile page on iPhone 15 — hero/avatar/stats/activity list fit the viewport, and the hardcoded `max-w-[300px]` truncation on activity items is removed.
  3. User can browse the Discover feed on iPhone 15 with filter dropdowns width-capped inside the viewport and analysis cards stacking in the mobile grid.
  4. User can view the Bookmarks page on iPhone 15 — DiscoverCard grid reflows, and the empty state renders inside the viewport when no bookmarks exist.
  5. A shared-link visitor can open a public `/u/[username]` profile on iPhone 15 and see the owner's hero, stats, and public analyses without horizontal scroll.
**Plans**: TBD
**UI hint**: yes

### Phase 71: Content Flow Mobile
**Goal**: The end-to-end creator conversion path (Upload → Processing → Results → Analysis, plus public `/analysis/[id]`, BrainViewer touch, timeline/tables/panels, comparison) is completable and readable on iPhone 15.
**Depends on**: Phase 68 (shell); Phase 70 not blocking but preferred sequence
**Requirements**: FLOW-01, FLOW-02, FLOW-03, FLOW-04, FLOW-05, FLOW-06, FLOW-07, FLOW-08, FLOW-09
**Success Criteria** (what must be TRUE):
  1. User can complete the Upload flow on iPhone 15 — input-type tabs, upload region, and cost panel all render inside the viewport, and the cost panel stacks vertically (no horizontal flex with dividers).
  2. User can watch a processing job run on iPhone 15 — the stage stepper and progress UI fit the viewport and stack/wrap without overflow.
  3. User can view the Results list page (`/results`) and Analysis detail page (`/results/[id]`) on iPhone 15 — previously hardcoded `grid-cols-12 / col-span-8 / col-span-4` spans reflow into a single-column mobile layout.
  4. A shared-link visitor can view a public `/analysis/[id]` page on iPhone 15 with the brain viewer, metrics, and commentary rendered inside the viewport.
  5. User can pan, rotate, and zoom the BrainViewer 3D canvas using one- and two-finger touch gestures on iPhone 15 without hijacking page scroll.
  6. User can read ActivationTimeline, SegmentTable, InsightsPanel, and NeuralTimeline on iPhone 15 with no horizontal overflow (tables become cards or scroll internally as needed); comparison modal/tray renders as a full-screen sheet on mobile.
**Plans**: TBD
**UI hint**: yes

### Phase 72: Settings, Billing, Pricing, Resources, Use-Cases Mobile
**Goal**: Secondary authenticated pages and marketing-adjacent pages fit iPhone 15 with full-width inputs, stacked tier cards, and legible copy.
**Depends on**: Phase 68 (shell)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Success Criteria** (what must be TRUE):
  1. User can edit settings on iPhone 15 — every form field is full-width, tappable, and submits without the form pushing outside the viewport.
  2. User can view the Billing page on iPhone 15 with subscription status, plan badge, and actions rendered inside the viewport.
  3. User can view the Pricing page on iPhone 15 — tier cards stack vertically, feature lists wrap cleanly, and CTAs remain tappable.
  4. User can browse Resources pages on iPhone 15 without horizontal scroll and with readable typography.
  5. User can browse Use-Cases pages on iPhone 15 without horizontal scroll and with readable typography.
**Plans**: TBD
**UI hint**: yes

### Phase 73: Mobile QA Sweep & Polish
**Goal**: Verify every in-scope page on iPhone 15 and at `≥md` desktop, audit touch targets and reduced-motion, and land any final fixes so the milestone exits with verifiable screenshot artifacts and no desktop regressions.
**Depends on**: Phases 68, 69, 70, 71, 72 (must be final phase)
**Requirements**: QA-01, QA-02, QA-03, QA-04, QA-05, QA-06
**Success Criteria** (what must be TRUE):
  1. All tappable elements on mobile in-scope pages meet the ≥44×44px touch target minimum (audit recorded per page).
  2. No page in the in-scope list exhibits horizontal scroll at 390×844 (verified via Playwright MCP sweep).
  3. Desktop layout at `≥md` (1280×800) remains visually equivalent to the pre-milestone baseline across all in-scope pages (Playwright desktop screenshots diffed, no regressions).
  4. iPhone 15 Playwright MCP screenshots exist under `.planning/phases/<N>-*/screenshots/iphone15/` for every phase 68–73.
  5. Desktop (1280×800) Playwright screenshots exist under `.planning/phases/<N>-*/screenshots/desktop/` for every phase 68–73.
  6. With `prefers-reduced-motion: reduce` set, existing fade/stagger animations on mobile either disable or fall back to instant transitions without breaking layout.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 68. Mobile Shell & Navigation Primitive | 0/? | Not started | - |
| 69. Auth & Onboarding Flow Mobile | 0/? | Not started | - |
| 70. Core Hub Pages Mobile | 0/? | Not started | - |
| 71. Content Flow Mobile | 0/? | Not started | - |
| 72. Settings, Billing, Pricing, Resources, Use-Cases Mobile | 0/? | Not started | - |
| 73. Mobile QA Sweep & Polish | 0/? | Not started | - |
