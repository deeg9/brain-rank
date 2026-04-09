---
phase: 13-gap-analysis
plan: 01
subsystem: ui-specs
tags: [gap-analysis, ui-specs, responsive, states, screens]
dependency_graph:
  requires: [ui-specs/00-screen-index.md, ui-specs/01-upload.md, ui-specs/02-processing.md, ui-specs/03-results-overview.md, ui-specs/04-results-detail.md, ui-specs/05-dashboard.md, ui-specs/components.md, ui-specs/design-tokens.md, ui-specs/interactions.md]
  provides: [ui-specs/gaps-missing-screens.md, ui-specs/gaps-missing-states.md, ui-specs/gaps-responsive.md]
  affects: [Phase 14 Stitch Brief]
tech_stack:
  added: []
  patterns: [centered-auth-card, bottom-tab-bar-mobile, card-view-mobile-tables, horizontal-scroll-metrics]
key_files:
  created:
    - ui-specs/gaps-missing-screens.md
    - ui-specs/gaps-missing-states.md
    - ui-specs/gaps-responsive.md
  modified: []
decisions:
  - Auth screens use standalone centered card layout outside the main app shell (no sidebar)
  - Mobile navigation uses bottom tab bar replacing sidebar entirely
  - Segment Explorer table converts to card view on mobile instead of horizontal-scrolling table
  - Multi-track timeline uses accordion pattern on mobile (one track visible at a time)
  - Error pages stand alone without sidebar nav to avoid confusion
metrics:
  duration_seconds: 555
  completed: 2026-04-09T20:45:00Z
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 0
---

# Phase 13 Plan 01: UI Gap Analysis Summary

**Complete gap analysis of NeuroCut UI spec surface: 10 missing screens specced, all 15 screens state-documented, responsive breakpoints defined for mobile/tablet/desktop.**

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Document missing screens | 38e7b22 | ui-specs/gaps-missing-screens.md |
| 2 | Document missing states | f4e329f | ui-specs/gaps-missing-states.md |
| 3 | Document responsive behaviors | 05ff1df | ui-specs/gaps-responsive.md |

## What Was Built

### Task 1: Missing Screens (gaps-missing-screens.md)

Documented 10 screens not covered in the canonical set:

- **Auth (3 screens):** Login, Sign Up, Forgot Password -- centered AuthCard pattern on dark background, outside main app shell
- **Onboarding (1 screen):** Welcome/first-run experience with hero illustration and first-upload CTA
- **Settings (2 screens):** Account management (profile, password, notifications) and Billing (credits, packages, transaction history)
- **Error (3 screens):** 404, 500, Offline -- consistent centered layout with illustration placeholders and recovery CTAs
- **Profile (1 screen):** User profile with avatar, analysis stats, and recent activity feed

Each screen includes: purpose, layout diagram, component references to components.md, interactions, data requirements tagged as real/derived/aspirational, navigation flows, and new components needed.

**New components identified:** AuthCard, PasswordStrengthIndicator, ConfirmationMessage, HeroIllustrationPlaceholder, StepIndicator, FormSection, Toggle, CreditPackageCard, TransactionHistoryTable, ErrorIllustrationPlaceholder, ConnectionStatusIndicator, AvatarUpload (12 total).

### Task 2: Missing States (gaps-missing-states.md)

Documented loading, empty, error, disabled, and partial/degraded states for all 15 screens:

- Coverage matrix at top showing which states are New, Covered, Partial, or N/A per screen
- Canonical screens: filled gaps for network errors, disabled interactive elements, partial data loading scenarios
- Gap screens: full state documentation from scratch (auth validation errors, form submission loading, settings partial failures)
- Error pages documented as inherently being their error state (no separate error state needed)

### Task 3: Responsive Behaviors (gaps-responsive.md)

Documented mobile (320-767px), tablet (768-1023px), and desktop (1024px+) behavior for all screens:

- Global navigation: sidebar to collapsible drawer (tablet) to bottom tab bar (mobile)
- Per-screen layout reflow rules with specific column/grid changes
- Component behavior changes (tables to card views, horizontal scroll for metric cards, timeline scroll and pinch-to-zoom)
- Touch considerations with 44px minimum tap targets (Apple HIG)
- Accessibility: reduced motion, keyboard avoidance, safe areas, focus management

## Decisions Made

1. **Auth screens standalone:** Auth screens render without the sidebar/top bar app shell to keep the auth flow clean and simple. The user enters the app shell after login.
2. **Mobile bottom tab bar:** On mobile, the sidebar collapses to a 4-item bottom tab bar (Upload, Processing, Results, Dashboard) plus a "More" overflow menu. This is the standard mobile pattern.
3. **Card view for mobile tables:** The Segment Explorer table and Transaction History table convert to card views on mobile rather than horizontal-scrolling tables. Cards are more touch-friendly and readable.
4. **Accordion timeline on mobile:** The multi-track timeline (4 brain region tracks) uses an accordion pattern on mobile where only 1 track is visible at a time, reducing vertical space and cognitive load.
5. **Error pages without sidebar:** Error pages (404, 500, Offline) render standalone without the app shell sidebar to avoid confusion about navigation context during error states.

## Deviations from Plan

None -- plan executed exactly as written.

## Self-Check: PASSED

All 3 created files verified on disk. All 3 task commits verified in git log.
