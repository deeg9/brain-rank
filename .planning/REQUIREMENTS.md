# Requirements: v8.0 Mobile Optimization

**Milestone goal:** Every authenticated and public-shared BrainRank page renders cleanly on iPhone 15 (390×844) while preserving the existing desktop architecture.

**Primary mobile viewport:** iPhone 15 — 390×844 CSS pixels.
**Breakpoint strategy:** Tailwind `md:` (768px) is the mobile/desktop split. Mobile = default, desktop = `md:` overrides.
**Touch target minimum:** 44×44px per Apple HIG.

---

## v8.0 Requirements

### Shared Shell (SHELL)

- [ ] **SHELL-01**: TopBar header renders within 390px viewport without horizontal overflow
- [ ] **SHELL-02**: User can open a mobile navigation sheet via a hamburger button on <md viewports
- [ ] **SHELL-03**: Mobile nav sheet exposes Dashboard / Upload / Discover, credits label, and Profile / Bookmarks / Billing / Settings / Resources / Logout entries
- [ ] **SHELL-04**: AppShell content gutters scale (16px mobile / 32px desktop) so content never touches screen edges
- [ ] **SHELL-05**: Desktop (≥md) TopBar and AppShell layout remain visually identical to pre-milestone

### Core Hub Pages (HUB)

- [ ] **HUB-01**: Dashboard page (stats, hero CTA, activity grid) fits iPhone 15 without horizontal scroll
- [ ] **HUB-02**: Profile page hero, avatar, stats, and activity list fit iPhone 15 — no hardcoded `max-w-[300px]` truncations
- [ ] **HUB-03**: Discover feed (filters, search, card grid) fits iPhone 15; filter dropdowns width-capped
- [ ] **HUB-04**: Bookmarks page (reused DiscoverCard grid + empty state) fits iPhone 15
- [ ] **HUB-05**: Public `/u/[username]` profile page fits iPhone 15 for shared-link visitors

### Content Flow — Upload, Processing, Results, Analysis (FLOW)

- [ ] **FLOW-01**: Upload page (input-type tabs, upload region, cost panel) completable end-to-end on iPhone 15
- [ ] **FLOW-02**: Upload cost panel stacks vertically on mobile (no horizontal flex with dividers)
- [ ] **FLOW-03**: Processing page stage stepper and progress UI fit iPhone 15
- [ ] **FLOW-04**: Results list page reflows on mobile — hardcoded `grid-cols-12` / `col-span-8/4` spans removed
- [ ] **FLOW-05**: Analysis detail page (`/results/[id]`) reflows on mobile using same pattern as results list
- [ ] **FLOW-06**: Public `/analysis/[id]` share page fits iPhone 15 for shared-link visitors
- [ ] **FLOW-07**: BrainViewer 3D canvas supports touch pan / rotate / zoom on mobile without hijacking page scroll
- [ ] **FLOW-08**: ActivationTimeline, SegmentTable, InsightsPanel, NeuralTimeline do not overflow horizontally on iPhone 15
- [ ] **FLOW-09**: Comparison modal / tray behaves as a full-screen sheet on mobile

### Settings, Billing, Pricing, Marketing-Adjacent (SEC)

- [ ] **SEC-01**: Settings page form fields are full-width and tappable on iPhone 15
- [ ] **SEC-02**: Billing page (subscription status, plan badge, actions) fits iPhone 15
- [ ] **SEC-03**: Pricing page tier cards stack and remain legible on iPhone 15
- [ ] **SEC-04**: Resources page(s) fit iPhone 15
- [ ] **SEC-05**: Use-Cases page(s) fit iPhone 15

### Auth & Onboarding (AUTH)

- [ ] **AUTH-01**: Login and signup pages fit iPhone 15 with full-width inputs and stacked OAuth buttons
- [ ] **AUTH-02**: Email verification page fits iPhone 15
- [ ] **AUTH-03**: Onboarding flow fits iPhone 15 at every step
- [ ] **AUTH-04**: Welcome page fits iPhone 15

### Cross-Cutting Quality (QA)

- [ ] **QA-01**: Tappable elements on mobile have ≥44×44px touch targets
- [ ] **QA-02**: No horizontal scroll anywhere at 390×844 across in-scope pages
- [ ] **QA-03**: Desktop layout at ≥md breakpoint remains visually equivalent to pre-milestone (no regressions)
- [ ] **QA-04**: iPhone 15 Playwright MCP screenshots captured per phase under `.planning/phases/<N>-*/screenshots/iphone15/`
- [ ] **QA-05**: Desktop (1280×800) Playwright screenshots captured per phase to verify no regressions
- [ ] **QA-06**: Reduced-motion preference honored on mobile for existing fade/stagger animations

---

## Future Requirements (deferred)

- [ ] Tablet-specific layout (iPad 820×1180) — for now, `md:` desktop layout applies ≥768px
- [ ] PWA install prompt / manifest refinements
- [ ] Bottom tab bar navigation pattern (considered and rejected in favor of hamburger sheet for minimal architecture change; revisit if mobile engagement warrants)
- [ ] Offline-first / service worker support for discovery feed
- [ ] Native iOS / Android app — web-only per PROJECT.md constraints

---

## Out of Scope

- **Landing page** — already shipped responsive in v7.0 (Phases 65–67)
- **Legal pages** (privacy, terms, disclaimer) — already mobile-safe static content
- **Admin tooling** — not user-facing
- **Redesigning the desktop experience** — explicit user constraint: preserve desktop
- **Major architectural rewrites** — explicit user constraint: keep existing components, apply mobile-specific styling only
- **Mobile-specific new features** (e.g., native camera capture, haptics) — this milestone is responsive refinement only
- **Virality / Hook / Retention scores** — already out of scope per PROJECT.md
- **Real-time collaboration features** — already out of scope per PROJECT.md

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SHELL-01 | Phase 68 | Pending |
| SHELL-02 | Phase 68 | Pending |
| SHELL-03 | Phase 68 | Pending |
| SHELL-04 | Phase 68 | Pending |
| SHELL-05 | Phase 68 | Pending |
| AUTH-01 | Phase 69 | Pending |
| AUTH-02 | Phase 69 | Pending |
| AUTH-03 | Phase 69 | Pending |
| AUTH-04 | Phase 69 | Pending |
| HUB-01 | Phase 70 | Pending |
| HUB-02 | Phase 70 | Pending |
| HUB-03 | Phase 70 | Pending |
| HUB-04 | Phase 70 | Pending |
| HUB-05 | Phase 70 | Pending |
| FLOW-01 | Phase 71 | Pending |
| FLOW-02 | Phase 71 | Pending |
| FLOW-03 | Phase 71 | Pending |
| FLOW-04 | Phase 71 | Pending |
| FLOW-05 | Phase 71 | Pending |
| FLOW-06 | Phase 71 | Pending |
| FLOW-07 | Phase 71 | Pending |
| FLOW-08 | Phase 71 | Pending |
| FLOW-09 | Phase 71 | Pending |
| SEC-01 | Phase 72 | Pending |
| SEC-02 | Phase 72 | Pending |
| SEC-03 | Phase 72 | Pending |
| SEC-04 | Phase 72 | Pending |
| SEC-05 | Phase 72 | Pending |
| QA-01 | Phase 73 | Pending |
| QA-02 | Phase 73 | Pending |
| QA-03 | Phase 73 | Pending |
| QA-04 | Phase 73 | Pending |
| QA-05 | Phase 73 | Pending |
| QA-06 | Phase 73 | Pending |

**Coverage:** 34/34 requirements mapped (100%) across 6 phases.
