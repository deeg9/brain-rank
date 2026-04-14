# Requirements: NeuroCut

**Defined:** 2026-04-13
**Core Value:** Content creators upload content and get per-segment neural engagement scores — showing exactly where viewers' brains light up and where they tune out

## v6.0 Requirements

Requirements for Stripe Payments milestone. Integrate Stripe to enable real payment processing for the Creator tier ($20/mo or $200/yr).

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
| Team collaboration / seats | Major feature, not needed for initial billing launch |
| Trial periods | Free tier with 5 credits/week IS the trial |
| Custom dunning / retry logic | Stripe Smart Retries handles this automatically (~57% recovery) |
| Proration | Only 2 tiers (Free + Creator), no paid-to-paid plan switches |
| Coupon/promo codes | Adds UI complexity and abuse surface; defer to future |
| Tax calculation | Compliance complexity premature before revenue justifies it |
| Usage-based billing | Flat subscription + credit limits is simpler |
| Custom payment form (Stripe Elements) | Stripe Checkout converts better, handles PCI, supports 40+ payment methods |
| Invoice PDF generation | Stripe generates and hosts invoices via Customer Portal |
| Refund automation | Handle manually through Stripe Dashboard for now |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SUB-01 | Phase 61 | Pending |
| SUB-02 | Phase 60 | Pending |
| SUB-03 | Phase 59 | Pending |
| SUB-04 | Phase 59 | Pending |
| CRED-01 | Phase 62 | Pending |
| CRED-02 | Phase 62 | Pending |
| CRED-03 | Phase 62 | Pending |
| CRED-04 | Phase 62 | Pending |
| BILL-01 | Phase 63 | Pending |
| BILL-02 | Phase 63 | Pending |
| BILL-03 | Phase 63 | Pending |
| PROD-01 | Phase 59 | Pending |
| PROD-02 | Phase 60 | Pending |
| PROD-03 | Phase 60 | Pending |
| POL-01 | Phase 62 | Pending |
| POL-02 | Phase 64 | Pending |
| POL-03 | Phase 63 | Pending |

**Coverage:**
- v6.0 requirements: 17 total
- Mapped to phases: 17/17
- Unmapped: 0

---
*Requirements defined: 2026-04-13*
*Last updated: 2026-04-13 after roadmap creation*
