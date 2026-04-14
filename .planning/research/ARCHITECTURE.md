# Architecture: Stripe Subscription Integration

**Domain:** SaaS subscription payments (Stripe + Next.js 16 App Router + Supabase)
**Researched:** 2026-04-13

## Recommended Architecture

### High-Level Data Flow

```
User clicks "Upgrade to Creator"
       |
       v
[PricingCard / BillingPage]  (client component)
       |
       v
POST /api/stripe/checkout   (API route - creates Checkout Session)
       |
       v
[Stripe Checkout]           (hosted by Stripe - handles payment)
       |
       v
Stripe fires webhook  ---->  POST /api/stripe/webhook  (API route)
       |                            |
       v                            v
User redirected to           Upsert `subscriptions` table in Supabase
/dashboard?checkout=success  Update `customers` table (stripe_customer_id)
                             Credit gating now active
```

### Billing Portal Flow (manage/cancel)

```
User clicks "Manage Subscription" on /settings/billing
       |
       v
POST /api/stripe/portal   (API route - creates Portal Session)
       |
       v
[Stripe Customer Portal]  (hosted by Stripe - update card, cancel, etc.)
       |
       v
Stripe fires webhooks ---> POST /api/stripe/webhook
       |
       v
Update subscription status in Supabase
```

## Component Boundaries

### New Files to Create

| Component | Path | Responsibility |
|-----------|------|---------------|
| Stripe checkout route | `src/app/api/stripe/checkout/route.ts` | Create Stripe Checkout Session with user_id in metadata |
| Stripe webhook route | `src/app/api/stripe/webhook/route.ts` | Receive Stripe events, sync state to Supabase |
| Stripe portal route | `src/app/api/stripe/portal/route.ts` | Create Billing Portal Session, return redirect URL |
| Stripe server lib | `src/lib/stripe.ts` | Stripe SDK singleton, shared config |
| Supabase admin client | `src/lib/supabase/admin.ts` | Service role client for webhook writes (bypasses RLS) |
| Subscription queries | `src/lib/subscription.ts` | Helper to fetch user subscription status from Supabase |
| Credit gating logic | `src/lib/credits.ts` | Check weekly usage count vs tier limits |

### Existing Files to Modify

| File | Change |
|------|--------|
| `src/components/pricing/PricingCard.tsx` | Replace `alert()` with checkout redirect call |
| `src/components/pricing/pricing-data.ts` | Add Stripe Price IDs to tier data |
| `src/app/(app)/settings/billing/page.tsx` | Wire "Manage Subscription" to portal, show real subscription status |
| `src/lib/database.types.ts` | Add Subscription, Customer, CreditUsage types |
| `src/app/api/jobs/route.ts` | Add credit check before creating job in POST handler |

### Files That Do NOT Need Changes

| File | Why |
|------|-----|
| `web/middleware.ts` | Auth session handling stays the same. Webhook route is already allowed through matcher. |
| `src/app/(app)/pricing/page.tsx` | Already renders PricingPage component, no changes needed. |
| `src/lib/supabase/server.ts` | Existing server client is correct for authenticated routes. Webhook uses separate admin client. |

## Supabase Schema

### New Tables

```sql
-- Maps auth.users to Stripe customer IDs (private, no public read)
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- No SELECT policy = only service role can read
-- This is intentional: stripe_customer_id is sensitive and only needed server-side

-- Subscription state synced from Stripe webhooks
CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'canceled', 'incomplete',
  'incomplete_expired', 'past_due', 'unpaid', 'paused'
);

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,                          -- Stripe subscription ID (sub_xxx)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status subscription_status NOT NULL,
  price_id TEXT,                                -- Stripe price ID (price_xxx)
  quantity INTEGER DEFAULT 1,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription (needed for client-side status display)
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role (webhook handler) can INSERT/UPDATE/DELETE
-- No INSERT/UPDATE/DELETE policies = service role only

-- Index for looking up active subscription by user
CREATE INDEX idx_subscriptions_user_status
  ON subscriptions (user_id, status);
```

### Credit Tracking Table

```sql
-- Track per-analysis credit usage for free tier gating
CREATE TABLE credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit usage"
  ON credit_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Index for weekly count queries (the core gating query)
CREATE INDEX idx_credit_usage_user_week
  ON credit_usage (user_id, created_at DESC);
```

### Why NOT Use the Stripe Sync Engine

Supabase offers a Stripe Sync Engine that mirrors all Stripe objects into a `stripe` schema. **Do not use it.** It syncs products, invoices, payment methods, charges -- all of which NeuroCut does not need. The manual webhook approach gives full control over exactly which fields get stored, has no additional infrastructure to deploy, and is the standard pattern used by every production Next.js + Stripe integration.

## API Route Implementation Patterns

### 1. Stripe SDK Singleton (`src/lib/stripe.ts`)

```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-18.acacia',  // pin to latest stable
  typescript: true,
});
```

### 2. Supabase Admin Client (`src/lib/supabase/admin.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Service role client -- bypasses RLS. Use ONLY in webhook handler and server-only code.
// NEVER import this in client components or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
```

### 3. Checkout Session Route (`src/app/api/stripe/checkout/route.ts`)

Key implementation details:
- Authenticate user via `supabase.auth.getUser()` (same pattern as existing `/api/jobs`)
- Look up or create Stripe customer (upsert `customers` table)
- Pass `user_id` in BOTH checkout session metadata AND subscription_data metadata
- Accept `priceId` from request body (monthly vs annual)
- Return checkout session URL for client-side redirect

```typescript
// Critical: pass user_id in metadata so webhook can link subscription to user
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${origin}/dashboard?checkout=success`,
  cancel_url: `${origin}/pricing?checkout=canceled`,
  metadata: { user_id: user.id },
  subscription_data: {
    metadata: { user_id: user.id },  // IMPORTANT: set on subscription object too
  },
});
```

**Why metadata on BOTH session AND subscription_data:** `checkout.session.completed` carries session metadata, but `customer.subscription.updated` and `customer.subscription.deleted` only carry subscription metadata. Without this, the webhook cannot map later lifecycle events back to the user.

### 4. Webhook Handler (`src/app/api/stripe/webhook/route.ts`)

```typescript
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.text();  // MUST be raw text, not json()
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle events...
  return NextResponse.json({ received: true }, { status: 200 });
}
```

Events to handle:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Upsert `customers` row (user_id -> stripe_customer_id). Upsert `subscriptions` row from session.subscription. |
| `customer.subscription.updated` | Update subscription status, period dates, cancel_at_period_end in `subscriptions` table. |
| `customer.subscription.deleted` | Set subscription status to `'canceled'` in `subscriptions` table. |
| `invoice.payment_failed` | Update subscription status to `'past_due'`. |

**Critical:** The webhook route must NOT call `supabase.auth.getUser()`. It receives requests from Stripe servers, not authenticated users. Use `supabaseAdmin` (service role) for all database writes.

### 5. Portal Route (`src/app/api/stripe/portal/route.ts`)

```typescript
// Authenticated route (same pattern as /api/jobs)
// 1. Get user via supabase.auth.getUser()
// 2. Look up stripe_customer_id from customers table
// 3. Create portal session
const session = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: `${origin}/settings/billing`,
});
return NextResponse.json({ url: session.url });
```

## Credit Gating Architecture

### How It Works

```
POST /api/jobs (user wants to analyze content)
       |
       v
1. Auth check (existing)
2. Query `subscriptions` table: active subscription for this user?
3. If status = 'active' or 'trialing' -> unlimited, skip credit check
4. If no active subscription (free tier):
   a. COUNT(*) from `credit_usage` WHERE user_id = X AND created_at > (now - 7 days)
   b. If count >= 3 -> return 403 { error: "Weekly credit limit reached", upgrade_url: "/pricing" }
   c. Else -> proceed, INSERT row into `credit_usage` after job creation
5. Create job (existing flow continues)
```

### Subscription Status Helper (`src/lib/subscription.ts`)

```typescript
export async function getUserSubscription(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from('subscriptions')
    .select('id, status, price_id, cancel_at_period_end, current_period_end')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;  // null = free tier
}

export function hasActivePlan(subscription: Subscription | null): boolean {
  return subscription !== null;
}
```

### Why Application-Level Gating, Not RLS

Credit gating via RLS would require a Postgres function call on every INSERT into `jobs` that counts `credit_usage` rows, checks subscription status, and conditionally allows/denies. This is:
1. **Slow** -- function evaluates per-row on every insert
2. **Fragile** -- business logic (3/week limit, tier names) baked into SQL
3. **Hard to debug** -- RLS failures return opaque "new row violates policy" errors

RLS is correct for data isolation (users see only their own subscriptions). Credit gating is business logic that belongs in the API route where it can return meaningful error messages and be easily modified.

## Environment Variables

```bash
# Add to .env.local (all new)
STRIPE_SECRET_KEY=sk_test_...              # Stripe Dashboard -> Developers -> API Keys
STRIPE_WEBHOOK_SECRET=whsec_...            # Stripe CLI prints this, or Dashboard -> Webhooks
STRIPE_PRICE_ID_MONTHLY=price_...          # Create in Stripe Dashboard -> Product Catalog
STRIPE_PRICE_ID_ANNUAL=price_...           # Create in Stripe Dashboard -> Product Catalog
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # Supabase Dashboard -> Settings -> API -> service_role
```

The `SUPABASE_SERVICE_ROLE_KEY` is the only existing Supabase secret not already in `.env.local`. All Stripe keys are new.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fulfilling on redirect, not webhook
**What:** Granting subscription access when user hits `success_url` after checkout.
**Why bad:** User can close browser before redirect. Redirect URL can be visited manually. Race condition between redirect and webhook arrival.
**Instead:** Only grant access via webhook handler writing to `subscriptions` table. The success page should read subscription status from Supabase (which the webhook populates).

### Anti-Pattern 2: Storing payment details in your database
**What:** Saving card numbers, payment method details, invoice amounts in Supabase.
**Why bad:** PCI compliance nightmare.
**Instead:** Store only: stripe_customer_id, subscription_id, status, price_id, period dates. Use Stripe Dashboard or Customer Portal for payment details.

### Anti-Pattern 3: Using anon key in webhook handler
**What:** Using the Supabase anon key (which respects RLS) in the webhook handler.
**Why bad:** Webhook has no user session, so RLS blocks all writes. The webhook silently fails to insert/update and returns 200 to Stripe, which stops retrying.
**Instead:** Use service role key via `supabaseAdmin` client. This bypasses RLS intentionally.

### Anti-Pattern 4: Not verifying webhook signatures
**What:** Trusting the webhook payload without calling `constructEvent()`.
**Why bad:** Anyone can POST to `/api/stripe/webhook` with a crafted payload granting themselves a subscription.
**Instead:** Always verify with `stripe.webhooks.constructEvent()` using raw body + signing secret.

### Anti-Pattern 5: Creating a new Stripe customer per checkout
**What:** Calling `stripe.customers.create()` every time the user clicks "Upgrade."
**Why bad:** Duplicate customers in Stripe, broken portal links, billing confusion.
**Instead:** Check `customers` table first. Create once, reuse the `stripe_customer_id` for all sessions.

### Anti-Pattern 6: Using `req.json()` in webhook handler
**What:** Parsing the webhook body as JSON before signature verification.
**Why bad:** `constructEvent()` requires the raw string body. Parsing and re-stringifying changes whitespace/ordering, breaking the signature.
**Instead:** Use `await req.text()` to get the raw body string.

## Suggested Build Order

Build order follows dependency chain. Each phase can be tested independently before moving to the next.

### Phase 1: Foundation (no UI changes)
1. `npm install stripe` in web/
2. Create `src/lib/stripe.ts` (SDK singleton)
3. Create `src/lib/supabase/admin.ts` (service role client)
4. Run Supabase migrations: `customers`, `subscriptions`, `credit_usage` tables + RLS + indexes
5. Add all env vars to `.env.local`
6. Update `src/lib/database.types.ts` with new types
7. Create Stripe Products + Prices in Stripe Dashboard (test mode)

**Depends on:** Nothing. **Enables:** Everything else.

### Phase 2: Checkout Flow
1. Create `src/app/api/stripe/checkout/route.ts`
2. Add Stripe Price IDs to `pricing-data.ts`
3. Wire `PricingCard.tsx` button to call checkout API and `window.location.href` redirect
4. Wire billing page button similarly
5. Add success/cancel query param handling on dashboard/pricing pages

**Depends on:** Phase 1. **Test:** Click "Upgrade to Creator" -> redirected to Stripe Checkout -> complete with test card -> redirected back to dashboard.

### Phase 3: Webhook + State Sync
1. Create `src/app/api/stripe/webhook/route.ts`
2. Create `src/lib/subscription.ts` (status query helpers)
3. Set up Stripe CLI for local webhook forwarding: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Test full flow: checkout -> Stripe fires webhook -> `customers` + `subscriptions` rows appear in Supabase

**Depends on:** Phase 2. **Test:** Complete a test checkout, verify subscription row exists in Supabase with status='active'.

### Phase 4: Credit Gating
1. Create `src/lib/credits.ts` (usage counting + tier check)
2. Modify `src/app/api/jobs/route.ts` POST handler: check subscription, check credits, insert credit_usage row
3. Add UI feedback: remaining credits on upload page, "upgrade" prompt when limit hit

**Depends on:** Phase 3 (needs subscription status in Supabase). **Test:** Free user hits 3 analyses/week, gets 403. Creator user has no limit.

### Phase 5: Billing Portal + Settings
1. Create `src/app/api/stripe/portal/route.ts`
2. Rewrite `src/app/(app)/settings/billing/page.tsx` to fetch real subscription from Supabase
3. Show: current plan name, status, renewal date, cancel_at_period_end
4. Add "Manage Subscription" button -> calls portal API -> redirects to Stripe Portal

**Depends on:** Phase 3. **Test:** Subscribed user clicks "Manage Subscription" -> Stripe Portal opens -> can cancel/update card -> webhook updates Supabase.

### Phase 6: Polish + Production
1. Handle edge cases: resubscription after cancel, past_due grace period
2. Add plan badge to dashboard header/nav
3. Webhook idempotency (check if subscription row already matches before updating)
4. Configure production webhook endpoint in Stripe Dashboard
5. Switch from test keys to live keys in production env

**Depends on:** Phases 1-5 complete.

## Stripe Test Mode Workflow

```bash
# Install Stripe CLI (one-time)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/stripe/webhook
# CLI prints: whsec_xxx -- copy to .env.local as STRIPE_WEBHOOK_SECRET

# Test cards
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002
# Requires auth: 4000 0025 0000 3155
```

## Sources

- [Stripe Official Webhook Example for Next.js App Router](https://github.com/stripe/stripe-node/blob/master/examples/webhook-signing/nextjs/app/api/webhooks/route.ts) -- verified raw body + constructEvent pattern (HIGH confidence)
- [Stripe Subscription Lifecycle in Next.js 2026](https://dev.to/thekarlesi/stripe-subscription-lifecycle-in-nextjs-the-complete-developer-guide-2026-4l9d) -- full lifecycle guide (MEDIUM confidence)
- [Stripe + Next.js 15 Complete Guide](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/) -- checkout + portal patterns (MEDIUM confidence)
- [Supabase Stripe Subscription SQL Schema](https://supabase-sql.vercel.app/stripe-subscriptions) -- standard table design (HIGH confidence, community-standard pattern)
- [Stripe Customer Portal API](https://docs.stripe.com/api/customer_portal/sessions/create) -- portal session creation (HIGH confidence, official docs)
- [Stripe Checkout + Webhook in Next.js 15](https://medium.com/@gragson.john/stripe-checkout-and-webhook-in-a-next-js-15-2025-925d7529855e) -- raw body handling (MEDIUM confidence)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- policy patterns (HIGH confidence, official docs)
- [Stripe Integration with Supabase + Next.js](https://dev.to/flnzba/33-stripe-integration-guide-for-nextjs-15-with-supabase-13b5) -- end-to-end pattern (MEDIUM confidence)
- [Stripe Metadata Documentation](https://docs.stripe.com/metadata) -- metadata propagation rules (HIGH confidence, official docs)
- Existing codebase analysis: api/jobs/route.ts, supabase/server.ts, supabase/middleware.ts, pricing components, database.types.ts (HIGH confidence)
