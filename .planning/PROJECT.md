# NeuroCut — Neural A/B Testing for Content Creators

## What This Is

A web app that lets content creators upload videos and get brain-activation-based engagement scores. The inference pipeline (TRIBE v2 on RunPod) is live. 15 production-ready UI screens have been designed via Google Stitch. This milestone implements the full frontend and backend to ship a working product.

## Core Value

Content creators upload a video and get per-segment neural engagement scores — showing exactly where viewers' brains light up and where they tune out, so creators can re-edit for maximum impact.

## Current Milestone: v4.0 Social Discovery Platform

**Goal:** Transform NeuroCut from a private analysis tool into a public discovery platform where users have identities (usernames), can share neural analyses publicly, and anyone can browse a leaderboard of brain reactions to videos.

**Target features:**
- User profiles with unique usernames (foundation for public identity) — Phase 44 complete
- Public/private toggle on analyses (privacy controls)
- Discovery/leaderboard page with browsable public neural data
- Social features — view counts, bookmarks, sorting by neural scores

**Current state:** Phase 44 complete — profiles table, username claiming, RLS policies, is_public flag on jobs all implemented. Last updated: 2026-04-11.

## Requirements

### Validated

- TRIBE v2 inference pipeline working end-to-end on RunPod — v1.0
- 759s total / 679s inference time for 60s video on A40 — v1.0
- Async endpoint pattern (/run + polling) — v1.0
- Pre-computed brain region masks (attention, reward, emotional, social) — v1.0
- UI screens consolidated and specced — v1.1
- 15 production-ready Stitch screens received — v1.1
- Design system documented (Neural Architect theme) — v1.1

### Active

- [ ] Per-vertex cortical heatmap on 3D brain viewer using full 20,484-vertex data
- [ ] Additional functional networks in region mapping (visual, auditory, language, default mode, motion)
- [ ] Arousal & valence composite metrics displayed on results page

### Out of Scope

- Multiple video A/B comparison — single video only for v2.0
- Real payment processing (Stripe) — mock billing page for now
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
- **No real payments**: Billing page is UI-only for v2.0 (Stripe integration deferred)

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
*Last updated: 2026-04-10 after v3.0 milestone start*
