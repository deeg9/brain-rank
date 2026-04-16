# BrainRank — Neural Content Scoring Platform

## What This Is

A web platform that lets content creators upload videos, images, or text and get brain-activation-based engagement scores. Features a public discovery feed, 3D brain viewer with per-vertex heatmaps, and a brutalist landing page with interactive 3D brain hero. The inference pipeline (TRIBE v2 on RunPod) is live, and the platform supports multi-modal input with side-by-side comparison.

## Core Value

Content creators upload a video and get per-segment neural engagement scores — showing exactly where viewers' brains light up and where they tune out, so creators can re-edit for maximum impact.

## Shipped: v4.0 Social Discovery Platform (2026-04-12)

All 8 phases complete. NeuroCut is now a public discovery platform:
- User profiles with unique usernames, avatars, and bios
- Public/private toggle on analyses with shareable links
- Public analysis view with brain viewer, timeline, and metrics
- Discovery feed at /discover with neural score ranking, search, sort, and filters
- View counts and bookmarks with /bookmarks page

## Shipped: v5.0 Multi-Modal Input & Comparison (2026-04-13)

All 7 phases complete. NeuroCut now supports image and text analysis alongside video, with side-by-side comparison.

## Paused: v6.0 Stripe Payments

**Goal:** Integrate Stripe to enable real payment processing for the Creator tier ($20/mo or $200/yr), replacing the mock billing UI.
**Status:** Paused — landing page (v7.0) prioritized.

## Shipped: v7.0 BrainRank Landing Page (2026-04-15)

All 3 phases complete. BrainRank now has a public landing page:
- Interactive 3D brain hero with auto-rotation, shimmer, and bloom effects
- "How It Works" 3-step walkthrough (Upload → Analyze → See Results)
- Feature cards highlighting multi-modal input, 9 brain networks, discovery feed
- Browser-framed preview mockup of analysis results
- Closing CTA with "Get Started Free" driving signups
- Scroll-triggered fade-in animations, fully responsive (desktop/tablet/mobile)
- Brutalist minimalist aesthetic: pure black/white/gray, Space Grotesk + Inter

## Current Milestone: v8.0 Mobile Optimization

**Goal:** Make every authenticated and public-shared page render cleanly on iPhone 15 (390×844) while preserving the existing desktop architecture.

**Target features:**
- Mobile-first responsive shell (TopBar hamburger → bottom sheet, AppShell gutters)
- Core hub pages mobile-ready: Dashboard, Profile, Discover, Bookmarks
- Content flow mobile-ready: Upload → Processing → Results → Analysis (incl. public `/analysis/[id]`)
- BrainViewer touch controls (pan/rotate/zoom) working on mobile
- Settings, Billing, Pricing, Resources, Use-Cases, Auth/Onboarding flow mobile-ready
- Playwright MCP iPhone 15 screenshots captured per phase as verification artifacts

**Key context:**
- Mobile users expected to be the majority (content creators targeting short-form mobile content)
- Constraint: no big architecture changes to desktop experience
- Mobile nav pattern decided: hamburger → slide-down sheet (smallest architecture change)
- Landing page (v7.0) excluded — already responsive

## Requirements

### Validated

- TRIBE v2 inference pipeline working end-to-end on RunPod — v1.0
- 759s total / 679s inference time for 60s video on A40 — v1.0
- Async endpoint pattern (/run + polling) — v1.0
- Pre-computed brain region masks (attention, reward, emotional, social) — v1.0
- UI screens consolidated and specced — v1.1
- 15 production-ready Stitch screens received — v1.1
- Design system documented (Neural Architect theme) — v1.1
- BrainRank landing page with 3D brain hero, content sections, responsive layout — v7.0
- Brutalist grayscale design system scoped via [data-landing] CSS attribute — v7.0

### Active

- [ ] Per-vertex cortical heatmap on 3D brain viewer using full 20,484-vertex data
- [ ] Additional functional networks in region mapping (visual, auditory, language, default mode, motion)
- [ ] Arousal & valence composite metrics displayed on results page
- [ ] v8.0 — Mobile optimization across all authenticated + public pages (see REQUIREMENTS.md)

### Out of Scope

- Multiple video A/B comparison — single video only for v2.0
- Real payment processing (Stripe) — **now in scope for v6.0**
- Mobile app — web only
- Real-time collaboration features
- PDF report generation
- Video player with frame-level scrubbing — placeholder player for now
- Virality score — unreliable heuristic, failed to identify actual viral video
- Hook score — naive average of first 5 segments, doesn't measure hook quality
- Retention score — naive average of last 5 segments, doesn't measure actual retention

## Context

- RunPod endpoint: POST /run → poll /status/{job_id} → JSON with per-segment activation scores
- Response schema: 2-second windows with activation, arousal, valence, region breakdown (attention, reward, emotional_processing, social_cognition)
- ~12 min inference = UX needs progress polling, stage indicators, estimated time
- 15 Stitch HTML screens at: /Users/deeg/Downloads/stitch_neurocut_ui_brief2/ (10 screens) and /Users/deeg/Downloads/stitch_neurocut_ui_brief3/ (5 screens)
- Design system: dark theme, tonal layering (no borders), neural-gradient CTAs, Space Grotesk + Inter
- UI specs in ui-specs/ directory (13 files including component catalog, design tokens, interactions)

## Constraints

- **Model license**: CC BY-NC-4.0 — non-commercial only
- **Inference time**: ~12 minutes per 60s video — async UX required
- **Stitch fidelity**: Implementation should match Stitch HTML screens closely
- **Stripe integration**: v6.0 — real payments for Creator tier

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| RunPod serverless | Pay-per-job, no idle cost | ✓ Good |
| Async endpoint | 12+ min inference exceeds sync timeout | ✓ Good |
| Google Stitch for UI | Rapid prototyping, AI-generated screens | ✓ Good — 15 screens received |
| UI audit before implementation | Consolidated Stitch output, identified gaps | ✓ Good |
| Next.js for frontend | React ecosystem, SSR, API routes | — Pending |
| Supabase for backend | Auth, Postgres, real-time, free tier | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-16 — v8.0 Mobile Optimization milestone started*
