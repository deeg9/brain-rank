# Technology Stack: Stripe Payments Integration

**Project:** NeuroCut v6.0 -- Stripe Payments
**Researched:** 2026-04-13
**Scope:** New packages only. Existing stack (Next.js 16, React 19, Supabase, Tailwind v4) is not re-evaluated.

## Recommended Stack Additions

### Stripe Server SDK

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| stripe | 22.0.1 | Server-side Stripe API calls | Latest major release (April 2026). v22 is a true ES6 class (`new Stripe()`), drops callback support in favor of async/await, and generates TypeScript types via compiler instead of separate folder. Use ONLY in server code (Route Handlers, Server Actions). Pin API version to `2026-03-25.dahlia` for reproducibility. |

### Stripe Client SDK

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @stripe/stripe-js | 9.1.0 | Client-side Stripe.js loader | Required for Embedded Checkout. Loads Stripe.js asynchronously via `loadStripe()`. Lightweight wrapper -- does NOT bundle Stripe.js itself, just loads it from Stripe's CDN. |
| @stripe/react-stripe-js | 6.1.0 | React components for Stripe Elements | Provides `<EmbeddedCheckoutProvider>` and `<EmbeddedCheckout>` components. Required for the embedded checkout flow (keeps user on your domain instead of redirecting to Stripe). Works with React 19. |

### No Additional Packages Needed

Everything else is already in the stack or handled by Stripe's hosted services:

| Concern | Solution | Why No Extra Package |
|---------|----------|---------------------|
| Webhook signature verification | Built into `stripe` SDK (`stripe.webhooks.constructEvent()`) | No separate webhook library needed |
| Billing portal | Stripe Customer Portal (hosted by Stripe) | Redirect to `stripe.billingPortal.sessions.create()` URL -- no UI to build |
| Subscription state in DB | Supabase migrations + RLS policies | Webhook handler writes to Supabase tables directly via `@supabase/supabase-js` (already installed) |
| HTTP requests | Built into Next.js (fetch) | No need for axios or similar |
| Email notifications | Stripe handles dunning, receipt, and failed payment emails | No email library needed |

## Package Summary

```bash
# Production dependencies (3 new packages)
npm install stripe@22.0.1 @stripe/stripe-js@9.1.0 @stripe/react-stripe-js@6.1.0
```

That is it. Three packages total.

## Stripe API Version Strategy

Pin to `2026-03-25.dahlia` (latest as of April 2026) in both:
1. **Stripe Dashboard** -- Settings > API version
2. **SDK initialization** -- `new Stripe(secret, { apiVersion: '2026-03-25.dahlia' })`

This prevents silent behavior changes when Stripe releases new API versions.

## Integration Architecture

### Checkout Flow (Embedded Checkout -- recommended over redirect)

```
User clicks "Subscribe" on Pricing page
  --> Server Action creates Stripe Checkout Session (mode: 'subscription')
  --> Returns clientSecret to client
  --> <EmbeddedCheckoutProvider> renders Stripe's checkout form inline
  --> User completes payment without leaving NeuroCut
  --> Stripe sends webhook to /api/webhooks/stripe
  --> Webhook handler updates Supabase subscriptions table
  --> User redirected to success page
```

Why Embedded over Redirect: Keeps users on your domain, better UX, same PCI compliance offloading. Stripe's 2026 recommendation.

### Webhook Handler Pattern (Next.js App Router)

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const body = await request.text();  // raw body -- no config needed in App Router
  const signature = request.headers.get('stripe-signature')!;
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  // handle event...
}
```

Key: Use `request.text()` for raw body. App Router handles this natively -- no `bodyParser: false` config needed (that was a Pages Router thing).

### Billing Portal (Self-Service)

```typescript
// Server Action or Route Handler
const session = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: `${origin}/settings/billing`,
});
// Redirect user to session.url
```

Stripe hosts the entire portal UI. Users can cancel, change plans, update payment method. Zero UI to build.

### Supabase Subscription Tracking

Database schema follows the Vercel nextjs-subscription-payments template pattern (battle-tested with Supabase + Stripe):

**New tables:**
- `customers` -- maps Supabase `auth.users.id` to `stripe_customer_id`
- `products` -- synced from Stripe via webhooks (id, name, active, metadata)
- `prices` -- synced from Stripe via webhooks (id, product_id, unit_amount, currency, interval)
- `subscriptions` -- synced from Stripe via webhooks (id, user_id, status, price_id, current_period_start, current_period_end, cancel_at_period_end)

**RLS policies:**
- `products` and `prices`: public read (anyone can see pricing)
- `subscriptions`: users can only read their own
- `customers`: users can only read their own

**Credit gating query pattern:**
```sql
-- Check if user has active Creator subscription
SELECT EXISTS (
  SELECT 1 FROM subscriptions
  WHERE user_id = auth.uid()
  AND status IN ('active', 'trialing')
) AS is_creator;
```

### Webhook Events to Handle

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription record, link customer |
| `customer.subscription.created` | Insert into subscriptions table |
| `customer.subscription.updated` | Update status, period dates, cancel_at_period_end |
| `customer.subscription.deleted` | Update status to 'canceled' |
| `invoice.payment_succeeded` | Update current_period_end (renewal) |
| `invoice.payment_failed` | Update status to 'past_due', optionally notify user |
| `product.created` / `product.updated` | Sync products table |
| `price.created` / `price.updated` | Sync prices table |

### Environment Variables

```env
# Server-side only (NEVER expose to client)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Client-side (safe to expose)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Stripe SDK v22 Migration Notes

v22 has breaking changes from v17/v18 that many tutorials still reference:

| Change | Old (v17-v21) | New (v22) |
|--------|---------------|-----------|
| Constructor | `Stripe('sk_...')` or `new Stripe('sk_...')` | Must use `new Stripe('sk_...')` (true ES6 class) |
| Callbacks | `stripe.customers.create({}, callback)` | Callbacks removed. Use `await stripe.customers.create({})` |
| CJS import | `const Stripe = require('stripe').default` | `const { Stripe } = require('stripe')` or use ESM |
| TypeScript types | `/// <reference types="stripe/types" />` | Types auto-included, no reference directive needed |

Use ESM imports throughout (Next.js App Router is ESM-native).

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Checkout UX | Embedded Checkout | Redirect to Stripe-hosted page | Embedded keeps users on your domain. Better UX. Stripe's 2026 recommendation. |
| Checkout UX | Embedded Checkout | Custom Stripe Elements form | Overkill for subscriptions. Elements are for custom payment forms. Checkout handles the full subscription flow (trial, proration, tax) out of the box. |
| Subscription sync | Webhook handler + Supabase tables | Stripe Sync Engine (Supabase extension) | Sync Engine is a separate service to deploy/manage. Webhooks are simpler, real-time, and follow the battle-tested Vercel template pattern. Sync Engine is better for analytics/reporting use cases. |
| Subscription sync | Webhook handler + Supabase tables | Supabase Foreign Data Wrapper for Stripe | FDW queries Stripe API on every SELECT -- adds latency and rate limit risk. Local tables with webhook sync are faster and more reliable. |
| State management | Supabase RLS + server queries | Client-side subscription state library | Server-authoritative subscription state is more secure. Client can cache but server is source of truth. |
| Billing portal | Stripe Customer Portal (hosted) | Custom billing management UI | Stripe handles PCI compliance, payment method updates, invoice history. Building this yourself is months of work for zero differentiation. |
| Payment library | stripe + @stripe/stripe-js | Lemonsqueezy / Paddle | Stripe is industry standard, best docs, best Next.js integration. LemonSqueezy/Paddle are merchant-of-record (handle tax) but add abstraction and take higher fees. NeuroCut is US-focused initially -- Stripe is simpler. |

## Stripe Product Configuration

Set up in Stripe Dashboard (not in code):

| Item | Value | Notes |
|------|-------|-------|
| Product: "Creator" | One product | Single tier for now |
| Price: Monthly | $20/mo | `price_xxx` -- store ID in env or sync via webhook |
| Price: Annual | $200/yr | $16.67/mo effective -- 17% savings messaging |
| Customer Portal | Enable plan switching, cancellation | Configure allowed actions in Dashboard |

## Sources

- [stripe npm package](https://www.npmjs.com/package/stripe) -- v22.0.1 confirmed
- [@stripe/stripe-js npm](https://www.npmjs.com/package/@stripe/stripe-js) -- v9.1.0 confirmed
- [@stripe/react-stripe-js npm](https://www.npmjs.com/package/@stripe/react-stripe-js) -- v6.1.0 confirmed
- [Stripe Node SDK v22 Migration Guide](https://github.com/stripe/stripe-node/wiki/Migration-guide-for-v22) -- breaking changes
- [Stripe API Versioning](https://docs.stripe.com/api/versioning) -- 2026-03-25.dahlia
- [Vercel Next.js Subscription Payments Template](https://github.com/vercel/nextjs-subscription-payments) -- Supabase schema pattern
- [Next.js 16 Webhook Handler Pattern](https://dev.to/huangyongshan46a11y/nextjs-16-webhook-handler-pattern-stripe-github-and-more-2bgh) -- raw body via request.text()
- [Stripe Embedded Checkout](https://docs.stripe.com/checkout/quickstart?client=next) -- recommended over redirect
- [Stripe + Next.js 2026 Guide](https://dev.to/sameer_saleem/the-ultimate-guide-to-stripe-nextjs-2026-edition-2f33) -- Server Action patterns
