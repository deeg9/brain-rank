# Feature Landscape: Stripe Subscription Integration

**Domain:** SaaS subscription billing for NeuroCut (Free + Creator tiers)
**Researched:** 2026-04-13
**Overall Confidence:** HIGH (Stripe patterns are well-documented and stable)

## Table Stakes

Features users expect. Missing = product feels broken or untrustworthy.

| Feature | Why Expected | Complexity | Depends On |
|---------|--------------|------------|------------|
| Stripe Checkout for Creator upgrade | Users click "Upgrade" and expect a payment form. Embedded Checkout keeps them on-site, handles card/Apple Pay/Google Pay automatically | Low | Stripe Products + Prices configured in Dashboard |
| Webhook handler for subscription lifecycle | Without webhooks, your DB never learns about payments, cancellations, or failures. This is the backbone of the entire integration | Med | Next.js API route, Stripe webhook secret, Supabase service role |
| Subscription status in Supabase | Must persist customer mapping and subscription state so the app can gate features and display plan info | Med | Webhook handler, Supabase migration |
| Credit gating on analysis creation | Free users get 3 credits/week. Creator gets unlimited. Without enforcement, the paywall is meaningless | Med | Subscription status in DB, credit counting query against `jobs` table |
| Stripe Customer Portal for self-service | Users expect to update payment methods, cancel, and switch plans without contacting support. Stripe hosts the entire UI | Low | `stripe_customer_id` stored per user |
| Cancel at period end (not immediate) | SaaS standard: cancellation takes effect at end of billing period. Users keep access until paid through | Low | Portal config in Stripe Dashboard, webhook for `customer.subscription.updated` |
| Monthly + Annual billing toggle | Already in UI. Must map to two Stripe Prices on one Product. Annual = ~17% discount ($200/yr vs $240/yr equivalent) | Low | Two Stripe Price objects |
| Secure webhook signature verification | Stripe signs every webhook. Without verification, anyone can forge subscription events | Low | `STRIPE_WEBHOOK_SECRET` env var |

### Minimum Webhook Events to Handle

| Event | What It Signals | Action Required |
|-------|-----------------|-----------------|
| `checkout.session.completed` | User completed payment | Link Stripe customer to Supabase user, set subscription active |
| `customer.subscription.updated` | Plan change, cancellation scheduled, trial ending | Update status, `cancel_at_period_end` flag |
| `customer.subscription.deleted` | Subscription fully ended | Revoke Creator access, downgrade to Free |
| `invoice.payment_succeeded` | Recurring payment succeeded | Extend `current_period_end`, confirm active status |
| `invoice.payment_failed` | Payment declined | Mark subscription `past_due` |

## Differentiators

Features that improve UX but are not expected on day one.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Upgrade prompt in upload flow | When a Free user hits their credit limit, show inline upgrade CTA instead of generic error. Converts more users | Low | Check credit count before allowing job creation |
| Grace period on failed payment | Instead of immediately revoking access on failed payment, keep access while Stripe retries. Reduces involuntary churn | Low | Treat `past_due` as still having access; only revoke on `deleted` |
| Annual upsell on monthly checkout | Show "Save 17% with annual" before checkout. Small nudge, measurable revenue lift | Low | UI-only, switch Stripe Price ID |
| Credit usage display | Show "2 of 3 credits used this week" so Free users know where they stand | Low | Count jobs created in current week |
| Receipt emails via Stripe | Users expect email confirmation after paying. Stripe sends automatically | Low | Toggle in Stripe Dashboard, zero code |

## Anti-Features

Features to explicitly NOT build for v6.0.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Custom payment form with Stripe Elements | Stripe Checkout converts better, handles PCI compliance, supports 40+ payment methods, requires 90% less code | Use Stripe Embedded Checkout |
| Trial periods | Free tier with credits/week IS the trial. Adding paid trials adds webhook complexity for minimal benefit | Keep Free tier as try-before-you-buy |
| Proration for plan switches | Only two tiers (Free + Creator). No upgrade/downgrade between paid plans | Defer until a third paid tier exists |
| Custom dunning/retry logic | Stripe Smart Retries uses ML to recover ~57% of failed payments automatically | Enable Smart Retries in Stripe Dashboard |
| Coupon/promo code system | Adds UI complexity and abuse surface. Not needed for validation | Defer; one config flag (`allow_promotion_codes: true`) enables later |
| Multiple seats / team billing | Major feature (seat management, invites, per-seat pricing). Ship single-user first | Remove "team collaboration" from Creator features or mark "coming soon" |
| Invoice PDF generation | Stripe generates and hosts invoices via Customer Portal | Rely on Stripe-hosted invoices |
| Refund automation | Handle manually through Stripe Dashboard for now | Manual refunds via Dashboard |
| Usage-based billing | Per-analysis charging adds metering complexity. Flat subscription is simpler | Stick with flat subscription + credit limits |
| Tax calculation | Adds compliance complexity before revenue justifies it | Stripe Tax can be enabled later without code changes |

## Feature Dependencies

```
Stripe Products/Prices in Dashboard
  |
  v
Checkout Session creation -----> checkout.session.completed webhook
  |                                       |
  v                                       v
Pricing page wired to checkout    Supabase: customers + subscriptions tables
  |                                       |
  v                                       v
Billing settings wired to Portal  Credit gating on job creation
                                          |
                                          v
                                       Upgrade prompt in upload flow
```

**Critical path:** Stripe Dashboard setup -> Webhook handler + DB schema -> Checkout integration -> Portal integration -> Credit gating

## MVP Recommendation

**Phase 1 -- Foundation (must ship together):**
1. Stripe Products + Prices in Dashboard (monthly + annual)
2. Supabase migration: customers, products, prices, subscriptions tables
3. Webhook API route handling the 5 critical events
4. Checkout Session creation via Server Action

**Phase 2 -- Self-Service + Gating:**
5. Customer Portal integration (billing settings -> manage/cancel)
6. Credit gating on analysis creation (enforce limits on Free tier)
7. Credit usage display

**Phase 3 -- Polish:**
8. Upgrade prompt in upload flow when credits exhausted
9. Enable Smart Retries + dunning emails in Stripe Dashboard
10. Production environment setup (live keys, webhook URL registration)

**Defer:** Trials, proration, coupons, team billing, custom payment forms, usage-based billing.

## Sources

- [Stripe Embedded Checkout](https://docs.stripe.com/checkout/quickstart?client=next) -- Checkout flow
- [Stripe Subscription Webhooks](https://docs.stripe.com/billing/subscriptions/webhooks) -- required webhook events
- [Stripe Customer Portal](https://docs.stripe.com/customer-management/integrate-customer-portal) -- portal session API
- [Stripe Smart Retries](https://docs.stripe.com/billing/revenue-recovery) -- automated dunning
- [Vercel Next.js Subscription Payments](https://github.com/vercel/nextjs-subscription-payments) -- reference architecture
