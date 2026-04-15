# Requirements: BrainRank

**Defined:** 2026-04-15
**Core Value:** Content creators upload content and get per-segment neural engagement scores — showing exactly where viewers' brains light up and where they tune out

## v7.0 Requirements

Requirements for BrainRank Landing Page milestone. Create a visually striking landing page that introduces BrainRank and drives signups.

### Hero Section

- [ ] **HERO-01**: Visitor sees an interactive 3D brain model with auto-rotation, shimmer, and bloom effects as the page centerpiece
- [ ] **HERO-02**: Visitor sees a bold BrainRank headline with a one-line value proposition
- [x] **HERO-03**: Visitor can click a primary CTA button to navigate to signup

### How It Works

- [ ] **HOW-01**: Visitor sees a 3-step visual walkthrough: Upload → Analyze → See Results
- [ ] **HOW-02**: Each step has an icon/visual, title, and brief description

### Feature Highlights

- [ ] **FEAT-01**: Visitor sees key platform capabilities presented as feature cards (multi-modal input, brain networks, discovery feed)
- [ ] **FEAT-02**: Feature cards use icons or visuals consistent with the brutalist black/white/gray aesthetic

### Visual Preview

- [ ] **PREV-01**: Visitor sees a demo preview showing what brain analysis output looks like

### Final CTA

- [ ] **CTA-01**: Visitor sees a closing CTA section with headline and "Get Started" button

### Design & Polish

- [x] **DES-01**: Landing page uses brutalist minimalist aesthetic — black/white/gray palette only
- [x] **DES-02**: Typography uses Space Grotesk (headlines) and Inter (body), matching existing app
- [ ] **DES-03**: Page uses 21st.dev components via magic MCP for animations and layout polish
- [ ] **DES-04**: Page is responsive across desktop, tablet, and mobile
- [x] **DES-05**: Landing page is served at the root route (`/`) instead of redirecting to dashboard

## v6.0 Requirements (Paused)

Requirements for Stripe Payments milestone. Paused — will resume after v7.0.

### Subscription & Checkout

- [ ] **SUB-01**: User can subscribe to Creator tier via Stripe Checkout ($20/mo or $200/yr)
- [ ] **SUB-02**: Stripe webhook handler syncs subscription lifecycle events to Supabase
- [ ] **SUB-03**: User's subscription status (active, past_due, canceled, etc.) is tracked in Supabase
- [ ] **SUB-04**: Webhook signature verification prevents forged subscription events

### Credit Gating

- [ ] **CRED-01**: Free tier users are limited to 5 analyses per week
- [ ] **CRED-02**: Creator tier users have unlimited analyses
- [ ] **CRED-03**: User sees remaining credits on upload page
- [ ] **CRED-04**: User sees upgrade prompt when credit limit is reached

### Billing Management

- [ ] **BILL-01**: User can manage subscription via Stripe Customer Portal (cancel, update card)
- [ ] **BILL-02**: Billing settings page shows real subscription status, plan name, and renewal date
- [ ] **BILL-03**: Cancel-at-period-end preserves access until billing period ends

### Production Readiness

- [ ] **PROD-01**: All Stripe IDs are environment variables (no hardcoded test/live IDs)
- [ ] **PROD-02**: Webhook handler is idempotent (no duplicate processing)
- [ ] **PROD-03**: Past-due subscriptions get grace period (access maintained while Stripe retries)

### Polish

- [ ] **POL-01**: Upgrade prompt shown inline in upload flow when credits exhausted
- [ ] **POL-02**: Annual upsell nudge displayed when user selects monthly checkout
- [ ] **POL-03**: Plan badge shown in navigation/dashboard indicating current tier

## Future Requirements

### Team & Collaboration

- **TEAM-01**: Team collaboration with seat management
- **TEAM-02**: Per-seat pricing for Creator tier

### Monetization

- **MON-01**: Coupon/promo code support
- **MON-02**: Tax calculation via Stripe Tax
- **MON-03**: Usage-based billing (per-analysis pricing)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Testimonials | Not needed for initial landing page launch |
| Pricing section on landing page | Stripe payments (v6.0) not yet live |
| Blog/content section | Unnecessary complexity for landing page |
| Login/signup forms embedded on page | Separate auth routes already exist |
| Animation-heavy parallax | Keep it brutalist and minimal |
| Team collaboration / seats | Major feature, not needed for initial billing launch |
| Trial periods | Free tier with credit limits IS the trial |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HERO-01 | Phase 65 | Pending |
| HERO-02 | Phase 65 | Pending |
| HERO-03 | Phase 65 | Complete |
| HOW-01 | Phase 66 | Pending |
| HOW-02 | Phase 66 | Pending |
| FEAT-01 | Phase 66 | Pending |
| FEAT-02 | Phase 66 | Pending |
| PREV-01 | Phase 66 | Pending |
| CTA-01 | Phase 66 | Pending |
| DES-01 | Phase 65 | Complete |
| DES-02 | Phase 65 | Complete |
| DES-03 | Phase 67 | Pending |
| DES-04 | Phase 67 | Pending |
| DES-05 | Phase 65 | Complete |

**Coverage:**
- v7.0 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-15 after roadmap creation*
