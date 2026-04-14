# Phase 61: Checkout Flow - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can subscribe to the Creator tier through a real Stripe Checkout session. Wire the existing pricing UI to create checkout sessions and redirect users to Stripe. After payment, the webhook (Phase 60) handles subscription state sync.

</domain>

<decisions>
## Implementation Decisions

### Checkout Approach
- Use Stripe Checkout redirect (session.url redirect), not Embedded Checkout — simpler, fewer dependencies
- Create API route at /api/stripe/checkout that creates a Checkout Session
- Pass user_id in BOTH session metadata AND subscription_data.metadata (per ARCHITECTURE.md)
- Accept priceId in request body (monthly vs annual from env vars)
- Success URL: /dashboard?checkout=success
- Cancel URL: /pricing

### Pricing UI Wiring
- Replace `alert("Payment processing coming soon!")` in billing page with real checkout call
- Wire PricingCard component's CTA button to call checkout API
- Pass the correct Stripe price ID based on monthly/annual toggle
- Both pricing page (/pricing) and billing settings page (/settings/billing) need to trigger checkout

### Success Page Handling
- On /dashboard with ?checkout=success, show a brief success message
- Poll for subscription status (webhook may not have arrived yet per Pitfall #2)

### Claude's Discretion
- Exact UI for success/loading state
- Error handling UX for failed checkout creation

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/lib/stripe.ts` — Stripe SDK singleton
- `web/src/lib/supabase/admin.ts` — for looking up/creating Stripe customer
- `web/src/lib/subscription.ts` — getUserSubscription for status checks
- `web/src/components/pricing/PricingCard.tsx` — existing pricing card component
- `web/src/components/pricing/pricing-data.ts` — tier data with prices
- `web/src/app/(app)/settings/billing/page.tsx` — billing settings with "coming soon" alert

### Integration Points
- New: `web/src/app/api/stripe/checkout/route.ts`
- Modify: PricingCard.tsx, billing/page.tsx, pricing-data.ts
- Modify: dashboard/page.tsx (success state)

</code_context>

<specifics>
## Specific Ideas

- Free tier = 5 credits/week (confirmed by user)
- Creator = $20/mo or $200/yr
- Remove "Team collaboration (up to 5 seats)" from Creator features list

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
