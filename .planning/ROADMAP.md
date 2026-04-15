# Roadmap: BrainRank

## Milestones

- ✅ **v1.0 Inference Pipeline** - Phases 1-10 (shipped 2026-04-09)
- ✅ **v1.1 UI Audit & Consolidation** - Phases 11-14 (shipped 2026-04-09)
- ✅ **v2.0-v2.2 Frontend Implementation** - Phases 15-37 (shipped 2026-04-11)
- ✅ **v3.0 Brain Visualization UX Overhaul** - Phases 38-43 (shipped 2026-04-11)
- ✅ **v4.0 Social Discovery Platform** - Phases 44-51 (shipped 2026-04-12)
- ✅ **v5.0 Multi-Modal Input & Comparison** - Phases 52-58 (shipped 2026-04-13)
- ⏸️ **v6.0 Stripe Payments** - Phases 59-64 (paused)
- 🚧 **v7.0 BrainRank Landing Page** - Phases 65-67 (in progress)

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

### v7.0 BrainRank Landing Page (In Progress)

**Milestone Goal:** Create a visually striking landing page at `/` that introduces BrainRank, explains how neural content scoring works, and drives signups -- using the existing 3D brain viewer as the hero centerpiece. Brutalist minimalist aesthetic: black/white/gray, Space Grotesk + Inter.

- [ ] **Phase 65: Landing Page Foundation & Hero** - Route setup, brutalist design system, interactive 3D brain hero with headline and CTA
- [ ] **Phase 66: Content Sections** - How It Works, Feature Highlights, Visual Preview, and Final CTA sections
- [ ] **Phase 67: Polish & Responsiveness** - 21st.dev component integration, responsive layout across all breakpoints

## Phase Details

### Phase 65: Landing Page Foundation & Hero
**Goal**: Visitors land on a striking hero page at `/` with an interactive 3D brain model, bold headline, and clear signup CTA -- establishing the BrainRank brand identity
**Depends on**: Nothing (existing app infrastructure, BrainViewer.tsx component already available)
**Requirements**: HERO-01, HERO-02, HERO-03, DES-01, DES-02, DES-05
**Success Criteria** (what must be TRUE):
  1. Navigating to `/` renders the landing page instead of redirecting to dashboard
  2. Visitor sees an interactive 3D brain model with auto-rotation and visual effects (shimmer/bloom) as the page centerpiece
  3. Visitor sees a bold BrainRank headline with a one-line value proposition in Space Grotesk
  4. Visitor can click a primary CTA button that navigates to the signup flow
  5. The page uses a brutalist black/white/gray palette with Space Grotesk headlines and Inter body text
**Plans**: TBD
**UI hint**: yes

### Phase 66: Content Sections
**Goal**: Visitors can scroll through clear explanations of how BrainRank works, what it offers, and what results look like -- building understanding and desire before the final signup prompt
**Depends on**: Phase 65 (page and design system must exist)
**Requirements**: HOW-01, HOW-02, FEAT-01, FEAT-02, PREV-01, CTA-01
**Success Criteria** (what must be TRUE):
  1. Visitor sees a 3-step visual walkthrough (Upload, Analyze, See Results) with icons, titles, and descriptions for each step
  2. Visitor sees feature cards highlighting key capabilities (multi-modal input, brain networks, discovery feed) in the brutalist black/white/gray aesthetic
  3. Visitor sees a demo preview showing what brain analysis output looks like
  4. Visitor sees a closing CTA section with headline and "Get Started" button at the bottom of the page
**Plans**: TBD
**UI hint**: yes

### Phase 67: Polish & Responsiveness
**Goal**: The landing page feels polished with smooth animations and works flawlessly across desktop, tablet, and mobile viewports
**Depends on**: Phase 66 (all content sections must exist to polish)
**Requirements**: DES-03, DES-04
**Success Criteria** (what must be TRUE):
  1. Page uses 21st.dev magic MCP components for animations and layout polish (scroll reveals, transitions, etc.)
  2. All sections (hero, how it works, features, preview, CTA) render correctly on desktop (1440px+), tablet (768px), and mobile (375px)
  3. Interactive elements (3D brain, CTA buttons) remain functional and properly sized on all breakpoints
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 65. Landing Page Foundation & Hero | v7.0 | 0/? | Not started | - |
| 66. Content Sections | v7.0 | 0/? | Not started | - |
| 67. Polish & Responsiveness | v7.0 | 0/? | Not started | - |
