# Domain Pitfalls: Stripe Subscription Integration

**Domain:** Adding Stripe subscription billing to an existing Next.js + Supabase app
**Researched:** 2026-04-13
**Confidence:** HIGH for webhook/sync pitfalls (verified via Stripe official docs, multiple post-mortems, real GitHub issues), MEDIUM for Supabase-specific RLS interactions (verified via Supabase docs + community discussions)

---

## Critical Pitfalls

Mistakes that cause lost revenue, security vulnerabilities, or data corruption.

### Pitfall 1: Webhook Signature Verification Fails Due to Next.js Body Parsing

**What goes wrong:**
Stripe webhook signature verification requires the raw, unmodified request body. Next.js App Router automatically parses JSON request bodies. If your webhook route handler calls `await req.json()` before signature verification, the re-serialized JSON may differ from the raw bytes Stripe signed (key ordering, whitespace), causing `stripe.webhooks.constructEvent()` to throw `Webhook signature verification failed`. The webhook silently rejects every event, and you have no subscription state sync at all.

**Why it happens:**
Developers test locally with `stripe listen --forward-to` which can bypass signature verification. Everything works in dev, breaks in production.

**Consequences:**
- Zero webhook events processed in production
- Users complete checkout, pay money, but never get Creator tier access
- Support tickets about "I paid but I'm still on Free"
- If you disable signature verification to "fix" it, anyone can POST fake webhook events and grant themselves paid access

**Prevention:**
```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST(req: Request) {
  // CRITICAL: Use req.text(), NOT req.json()
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Now safe to process event
  // Return 200 IMMEDIATELY, process async if needed
  return new Response('OK', { status: 200 });
}
```

**Detection:**
- Stripe Dashboard > Webhooks shows all events failing with non-2xx responses
- `stripe.webhooks.constructEvent` errors in server logs
- Users paying but subscription status never updating in Supabase

**Phase to address:**
Phase 2 (Webhook Handler) -- this is the first thing to get right. Test with `stripe trigger checkout.session.completed` in CLI.

---

### Pitfall 2: Race Condition Between Checkout Redirect and Webhook Delivery

**What goes wrong:**
After successful Stripe Checkout, two things happen nearly simultaneously: (1) Stripe redirects the user to your `success_url`, and (2) Stripe sends a `checkout.session.completed` webhook. The redirect often arrives BEFORE the webhook is processed. If your success page queries Supabase for the user's subscription status, it reads stale data ("Free" tier) because the webhook hasn't updated the database yet. The user sees "Payment successful!" but the UI still shows Free tier.

**Why it happens:**
Stripe's webhook delivery and the browser redirect are independent. The redirect is instant (browser hop), while the webhook must traverse Stripe's infrastructure, hit your server, verify the signature, and write to Supabase. Latency: 100ms to several seconds.

**Consequences:**
- User sees confusing "You're on Free tier" immediately after paying
- User frantically clicks around, refreshes, opens support tickets
- If you have credit-gating, user might hit "3 free analyses" limit right after paying

**Prevention:**
```typescript
// Option A: Poll on success page (recommended for simplicity)
// app/(app)/billing/success/page.tsx
'use client';
export default function SuccessPage() {
  const [status, setStatus] = useState<'loading' | 'active' | 'timeout'>('loading');

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
      attempts++;
      const sub = await getSubscriptionStatus(); // query Supabase
      if (sub?.status === 'active') {
        setStatus('active');
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        setStatus('timeout'); // show "processing, check back shortly"
        clearInterval(interval);
      }
    }, 2000); // poll every 2s for up to 20s
    return () => clearInterval(interval);
  }, []);

  // Show spinner while loading, success when active, "processing" on timeout
}

// Option B: Use checkout session ID from URL
// success_url: '/billing/success?session_id={CHECKOUT_SESSION_ID}'
// On success page, call Stripe API directly to verify payment
// Then write to Supabase if webhook hasn't arrived yet
```

**Detection:**
- Users reporting "I paid but still shows Free" (transient -- resolves on refresh)
- Success page showing Free tier momentarily after checkout

**Phase to address:**
Phase 3 (Checkout Flow) -- success page must handle the webhook lag from day one.

---

### Pitfall 3: Webhook Handler Uses Supabase Anon Key -- RLS Blocks All Writes

**What goes wrong:**
Stripe webhook requests have no user session. They hit your API route as an anonymous server-to-server call. If your webhook handler creates a Supabase client with the anon key (the default in most Next.js + Supabase setups), Row Level Security policies block the INSERT/UPDATE to the `subscriptions` table because there is no authenticated user in the request context. The webhook returns 200 (your code caught the error silently), but no data was written.

**Why it happens:**
The standard Supabase client in Next.js SSR uses the anon key + user session from cookies. Webhook routes have no cookies. Developers use the same `createServerClient()` helper everywhere, not realizing webhook routes need special treatment.

**Consequences:**
- Webhook events process without error (signature verified, event parsed) but database writes silently fail
- Subscription status never updates in Supabase
- Extremely hard to debug because the webhook returns 200 and Stripe shows "delivered"

**Prevention:**
```typescript
// lib/supabase-admin.ts -- ONLY used server-side, NEVER in client code
import { createClient } from '@supabase/supabase-js';

// Service role key bypasses RLS -- treat like a database root password
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // NOT the anon key
  { auth: { persistSession: false } }
);

// In webhook handler:
const { error } = await supabaseAdmin
  .from('subscriptions')
  .upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    status: subscription.status,
    // ...
  });

if (error) {
  console.error('Supabase write failed:', error);
  return new Response('Database error', { status: 500 }); // Stripe will retry
}
```

**Key rules:**
- Create a dedicated `supabaseAdmin` client file
- NEVER import it from client components
- NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to the browser (no `NEXT_PUBLIC_` prefix)
- Only use it in webhook handlers and server-side admin operations

**Detection:**
- Stripe Dashboard shows webhook delivered (200) but Supabase `subscriptions` table is empty
- Adding `console.log` after the upsert shows RLS policy violation errors
- Works perfectly in development if you have RLS disabled on your dev database

**Phase to address:**
Phase 1 (Database Schema) -- set up `supabaseAdmin` client when creating the subscriptions table and RLS policies.

---

### Pitfall 4: Handling Only "active" and "canceled" -- Ignoring 4 Other Subscription States

**What goes wrong:**
Stripe subscriptions have 6 possible statuses: `active`, `canceled`, `past_due`, `unpaid`, `trialing`, `incomplete`. Most developers only handle `active` (grant access) and `canceled` (revoke access). This creates silent bugs:
- `past_due`: Payment failed but Stripe is retrying. User should keep access during grace period but see a warning banner. If you treat `past_due` as `active`, users never know their card failed. If you treat it as not-active, you lock out paying customers whose bank had a temporary hold.
- `incomplete`: Checkout started but 3D Secure authentication wasn't completed. User is in limbo.
- `unpaid`: All payment retries exhausted. User should lose access but be prompted to update payment method, not shown "subscribe" as if they never had a subscription.

**Why it happens:**
The happy path (active/canceled) covers 95% of test scenarios. The edge cases only emerge with real cards, real bank declines, and real time passing.

**Consequences:**
- Past-due users silently churn because they never knew their card was declined
- Unpaid users see "Subscribe to Creator" when they should see "Update your payment method"
- Incomplete subscriptions create orphan Stripe customers with no matching Supabase record

**Prevention:**
```typescript
// Map ALL Stripe statuses to application behavior
type SubStatus = 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'trialing';

function getAccessLevel(status: SubStatus): {
  hasAccess: boolean;
  showWarning: boolean;
  warningMessage?: string;
} {
  switch (status) {
    case 'active':
    case 'trialing':
      return { hasAccess: true, showWarning: false };
    case 'past_due':
      return {
        hasAccess: true, // grace period -- don't punish for bank glitch
        showWarning: true,
        warningMessage: 'Your payment failed. Please update your payment method to avoid losing access.'
      };
    case 'incomplete':
      return {
        hasAccess: false,
        showWarning: true,
        warningMessage: 'Your subscription setup is incomplete. Please complete payment.'
      };
    case 'unpaid':
      return {
        hasAccess: false,
        showWarning: true,
        warningMessage: 'Your subscription payment failed. Update your payment method to restore access.'
      };
    case 'canceled':
      return { hasAccess: false, showWarning: false };
  }
}
```

Configure Stripe's dunning settings in Dashboard > Settings > Billing > Subscriptions and emails:
- Enable Smart Retries (Stripe retries failed payments with ML-optimized timing)
- Set retry schedule: 3 retries over 7 days
- After all retries fail: mark subscription as `canceled` (not `unpaid` -- cleaner)
- Enable failed payment email notifications from Stripe

**Detection:**
- Users with `past_due` status in Stripe Dashboard but no warning in the app
- Support tickets about "I was charged but lost access" (card declined, past_due treated as inactive)
- Orphan `incomplete` subscriptions in Stripe with no corresponding Supabase record

**Phase to address:**
Phase 2 (Webhook Handler) -- handle ALL statuses from the start. Phase 4 (UI) -- show warning banners for past_due/unpaid.

---

### Pitfall 5: Test Mode Price IDs Hardcoded -- Everything Breaks Going Live

**What goes wrong:**
Stripe test mode and live mode are completely separate environments. Products, prices, customers, subscriptions -- everything has different IDs. A price created in test mode (`price_1Abc...`) does not exist in live mode. If you hardcode test price IDs in your codebase or Supabase, switching to live mode causes "No such price" errors on every checkout attempt.

**Why it happens:**
During development, you create products and prices in the Stripe test Dashboard, copy-paste the IDs into your code, and everything works. Nobody thinks about live mode until launch day.

**Consequences:**
- Checkout fails for every real customer on launch day
- Scramble to create live products, update IDs, and redeploy
- If IDs are stored in Supabase (e.g., a `plans` table), you need a data migration too
- Webhook endpoint secret is also different between test and live mode

**Prevention:**
```bash
# .env.local (development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_CREATOR_MONTHLY=price_test_monthly_...
STRIPE_PRICE_CREATOR_ANNUAL=price_test_annual_...

# .env.production (Vercel environment variables)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_CREATOR_MONTHLY=price_live_monthly_...
STRIPE_PRICE_CREATOR_ANNUAL=price_live_annual_...
```

**Rules:**
- NEVER hardcode price IDs in source code. Always use environment variables.
- Create a checklist of ALL Stripe-related env vars that differ between test and live.
- After creating live products, verify every env var is updated before deploying.
- The webhook endpoint URL can be the same, but the webhook signing secret is different per endpoint. You need to register a new webhook endpoint in live mode Dashboard.
- Test your live mode setup with a real $1 charge to yourself before announcing to users.

**Detection:**
- "No such price" errors in Stripe API calls after switching to live mode
- Webhook signature verification failing in production (wrong signing secret)
- Checkout redirecting to Stripe but showing "Something went wrong"

**Phase to address:**
Phase 1 (Setup) -- establish env var pattern from day one. Phase 6 (Go-Live) -- create live products and verify all env vars.

---

### Pitfall 6: Webhook Events Arrive Out of Order -- Handler Assumes Sequential Processing

**What goes wrong:**
Stripe explicitly states: "We don't guarantee delivery of events in the order in which they're generated." During a checkout flow, these events fire nearly simultaneously:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `invoice.payment_succeeded`
- `invoice.created`

If your handler processes `customer.subscription.updated` before `customer.subscription.created`, and your code does `UPDATE subscriptions SET status = ...` without an UPSERT, the UPDATE finds no row and silently does nothing. The subscription is never recorded.

**Why it happens:**
Developers write webhook handlers with a mental model of sequential event flow: "first checkout completes, then subscription is created, then invoice is paid." Stripe's event delivery is async and non-deterministic.

**Consequences:**
- Missing subscription records for users who paid
- Duplicate processing if handler is not idempotent (e.g., crediting the same payment twice)
- Partial state updates (subscription exists but payment record doesn't, or vice versa)

**Prevention:**
```typescript
// Use UPSERT, not INSERT or UPDATE
// This handles any event order: first event creates, subsequent events update
async function syncSubscription(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(
      {
        stripe_subscription_id: subscription.id,
        user_id: getUserIdFromCustomer(subscription.customer),
        stripe_customer_id: subscription.customer as string,
        status: subscription.status,
        price_id: subscription.items.data[0]?.price.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id' }
    );

  if (error) throw error;
}

// In the webhook switch statement, multiple events call the same sync function:
case 'customer.subscription.created':
case 'customer.subscription.updated':
case 'customer.subscription.deleted':
  await syncSubscription(event.data.object as Stripe.Subscription);
  break;
```

**Also implement idempotency:**
```typescript
// Store processed event IDs to prevent duplicate processing
const { data: existing } = await supabaseAdmin
  .from('stripe_events')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single();

if (existing) {
  return new Response('Already processed', { status: 200 });
}

// Process event...

// Mark as processed
await supabaseAdmin
  .from('stripe_events')
  .insert({ stripe_event_id: event.id, event_type: event.type, processed_at: new Date().toISOString() });
```

**Detection:**
- Users with payments in Stripe but no `subscriptions` row in Supabase
- Duplicate rows in subscriptions table (if using INSERT instead of UPSERT)
- `stripe_events` table showing the same event ID processed multiple times

**Phase to address:**
Phase 2 (Webhook Handler) -- UPSERT pattern and idempotency table must be in the initial webhook implementation.

---

## Moderate Pitfalls

### Pitfall 7: Stripe Customer ID Not Linked to Supabase User Before Checkout

**What goes wrong:**
When a `checkout.session.completed` webhook arrives, you need to know WHICH Supabase user to grant Creator access to. If you don't pass the user ID in the checkout session metadata, and you don't have a `stripe_customer_id` stored on the user's profile, you have no way to link the Stripe event to a Supabase user. You end up trying to match by email, which fails if the user's Stripe email differs from their Supabase auth email.

**Why it happens:**
Checkout Session creation and webhook handling are separate code paths (one in API route, one in webhook route). It's easy to create the session without thinking about how the webhook will identify the user.

**Prevention:**
```typescript
// When creating checkout session, ALWAYS include user metadata:
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  customer_email: user.email, // pre-fill, but don't rely on for matching
  metadata: {
    supabase_user_id: user.id, // THIS is what the webhook uses to identify the user
  },
  subscription_data: {
    metadata: {
      supabase_user_id: user.id, // Also on the subscription itself
    },
  },
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/billing`,
});
```

Store `stripe_customer_id` on the user's profile after first checkout so subsequent lookups are fast.

**Phase to address:**
Phase 3 (Checkout Session Creation) -- metadata must be included from the first checkout implementation.

---

### Pitfall 8: Not Returning 200 Fast Enough -- Stripe Thinks Webhook Failed

**What goes wrong:**
Stripe expects a 2xx response within a few seconds. If your webhook handler does heavy processing synchronously (multiple Supabase queries, sending emails, updating caches) before returning, Stripe may time out and retry the event. Retries cause duplicate processing if you haven't implemented idempotency (Pitfall 6).

**Why it happens:**
Developers process everything inline in the webhook handler: verify signature, parse event, query database, update subscription, send confirmation email, invalidate cache, THEN return 200.

**Consequences:**
- Stripe retries the event up to 3 times over 72 hours
- Each retry triggers duplicate processing (duplicate emails, duplicate database writes)
- Webhook marked as failing in Stripe Dashboard, triggering alerts

**Prevention:**
```typescript
export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  // Do ONLY the critical database write synchronously
  try {
    await processStripeEvent(event); // upsert to Supabase -- fast
  } catch (err) {
    console.error('Webhook processing failed:', err);
    return new Response('Processing error', { status: 500 }); // Stripe will retry
  }

  // Return 200 immediately
  // Non-critical side effects (emails, cache invalidation) can happen after
  return new Response('OK', { status: 200 });
}
```

For NeuroCut's scale (low volume during validation), inline processing is fine. But structure the code so the critical path (DB write) is fast and non-critical work (emails) can be deferred later if needed.

**Phase to address:**
Phase 2 (Webhook Handler) -- keep the handler lean from the start.

---

### Pitfall 9: Billing Portal Returns Users to Wrong Page or Stale State

**What goes wrong:**
Stripe's Customer Portal lets users manage subscriptions (cancel, update payment method, switch plans). When they finish, Stripe redirects them back to your `return_url`. Common mistakes:
- `return_url` points to a page that doesn't exist or requires re-authentication
- User cancels subscription in portal, returns to app, but sees "Creator" tier because the webhook hasn't been processed yet (same race condition as Pitfall 2)
- User updates payment method successfully but the app still shows "Payment failed" warning

**Prevention:**
```typescript
// Create billing portal session
const portalSession = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: `${origin}/billing`, // Must be a valid, authenticated page
});
```

- Return URL should be the billing settings page, which re-fetches subscription status on mount
- Add the same polling pattern from Pitfall 2 if you detect the user is returning from the portal (check for `?portal_return=true` query param)
- Configure the Customer Portal in Stripe Dashboard: enable/disable specific actions (cancel, update payment, switch plans) based on what your app supports

**Phase to address:**
Phase 5 (Billing Portal Integration) -- test the full round-trip: app -> portal -> cancel -> return -> app shows updated status.

---

### Pitfall 10: Credit Gating Race Condition -- User Exceeds Limits During Status Transition

**What goes wrong:**
NeuroCut gates analyses by tier: Free = 3/week, Creator = unlimited. During the window between checkout and webhook processing (Pitfall 2), or during a payment failure grace period (Pitfall 4), the credit check logic may read stale subscription status. A Creator user whose payment just failed might be immediately blocked from running analyses. Or a user who just subscribed might hit the Free tier limit because their subscription isn't recorded yet.

**Prevention:**
```typescript
async function canUserAnalyze(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId);

  // Creator with active or past_due (grace period) = unlimited
  if (sub && ['active', 'past_due', 'trialing'].includes(sub.status)) {
    return true;
  }

  // Free tier: check weekly count
  const weeklyCount = await getWeeklyAnalysisCount(userId);
  return weeklyCount < 3;
}
```

- Be GENEROUS during edge cases. It is better to give one free analysis to a lapsed subscriber than to block a paying customer.
- For the post-checkout window: if `session_id` is present in the URL (user just came from checkout), temporarily grant access for the current request while waiting for webhook.
- Never cache subscription status in localStorage or cookies. Always query Supabase for the current status.

**Phase to address:**
Phase 4 (Credit Gating) -- implement alongside subscription status checks.

---

## Minor Pitfalls

### Pitfall 11: Stripe.js Loaded on Every Page -- Unnecessary Bundle Size

**What goes wrong:**
Importing `@stripe/stripe-js` loads the Stripe.js library (~40KB gzipped) on every page, even pages that don't use Stripe (results page, discovery page, etc).

**Prevention:**
- Use `loadStripe()` lazily, only on pages that need it (pricing page, billing settings)
- Use `@stripe/stripe-js/pure` to avoid the auto-injection of the Stripe.js script tag
- For Checkout-only integrations (no embedded payment form), you may not need Stripe.js at all -- just redirect to `session.url` from the server

**Phase to address:**
Phase 3 (Checkout Flow) -- architectural decision at the start.

---

### Pitfall 12: No Webhook Event Logging -- Debugging Billing Issues Becomes Impossible

**What goes wrong:**
When a user reports "I was charged twice" or "I canceled but was charged again," you need to see the exact sequence of webhook events received. Without a `stripe_events` log table, you're guessing based on Stripe Dashboard timestamps vs Supabase `updated_at` timestamps, which don't tell you what your server actually received.

**Prevention:**
```sql
create table stripe_events (
  id uuid default gen_random_uuid() primary key,
  stripe_event_id text unique not null,
  event_type text not null,
  payload jsonb,
  processed_at timestamptz default now(),
  error text
);

-- RLS: no public access, only service role
alter table stripe_events enable row level security;
-- No policies = only service role can read/write
```

Log every webhook event, even ones you don't handle. Store the full payload for debugging. This table also serves as the idempotency check (Pitfall 6).

**Phase to address:**
Phase 1 (Database Schema) -- create this table alongside the `subscriptions` table.

---

### Pitfall 13: Mixing Up `cancel_at_period_end` with Immediate Cancellation

**What goes wrong:**
Stripe supports two cancellation modes:
1. **Cancel at period end** (`cancel_at_period_end: true`): Subscription stays active until the current billing period ends, then stops. User keeps access until they've used what they paid for. Status remains `active`.
2. **Immediate cancellation** (`subscription.cancel()`): Subscription ends right now. Status changes to `canceled`.

If your webhook handler treats both the same way, you'll either: (a) revoke access from users who canceled-at-period-end (they paid for the rest of the month!), or (b) keep granting access to users who immediately canceled.

**Prevention:**
```typescript
// In your access check:
function hasAccess(sub: Subscription): boolean {
  if (sub.status === 'active') return true; // includes cancel_at_period_end
  if (sub.status === 'canceled') {
    // Check if period hasn't ended yet (shouldn't happen with cancel_at_period_end,
    // but defensive coding for immediate cancellation refund scenarios)
    return new Date(sub.current_period_end) > new Date();
  }
  return false;
}
```

Store `cancel_at_period_end` as a boolean in your `subscriptions` table. Show "Your plan will end on [date]" in the billing UI when true.

**Phase to address:**
Phase 5 (Billing Portal) -- cancellation handling must distinguish these two modes.

---

## Integration Gotchas: Stripe + Supabase Specific

| Integration Point | Common Mistake | Correct Approach |
|---|---|---|
| Webhook handler + Supabase client | Using `createServerClient()` with anon key (from cookies). No cookies in webhook = RLS blocks writes. | Dedicated `supabaseAdmin` client using `SUPABASE_SERVICE_ROLE_KEY`. Only in server-side webhook/admin code. |
| Subscription table + RLS policies | RLS policy requires `auth.uid() = user_id`. Webhook handler (service role) bypasses this but client-side queries need it. Forgetting the policy means any user can read any subscription. | `SELECT` policy: `auth.uid() = user_id`. No `INSERT/UPDATE/DELETE` policies for anon role (only service role writes via webhook). |
| User profile + Stripe customer ID | Storing `stripe_customer_id` only in the `subscriptions` table. If subscription is deleted, you lose the customer link and create a duplicate Stripe customer on re-subscribe. | Store `stripe_customer_id` on the `profiles` table too. On checkout, check if user already has a Stripe customer before creating a new one. |
| Supabase Realtime + subscription status | Subscribing to `subscriptions` table changes via Supabase Realtime to update UI. But Realtime requires RLS SELECT policy, and the webhook writes via service role. Service role writes DO trigger Realtime events, but only if the client's RLS policy allows reading that row. | Realtime works if your SELECT policy is `auth.uid() = user_id`. Test that the logged-in user receives the Realtime event when the webhook updates their subscription. |
| Environment variables + Vercel | Using `NEXT_PUBLIC_STRIPE_SECRET_KEY` (exposing secret key to browser). Or forgetting to add env vars to Vercel (they don't auto-sync from `.env.local`). | Secret key: `STRIPE_SECRET_KEY` (no `NEXT_PUBLIC_` prefix). Publishable key: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Add all to Vercel Dashboard > Settings > Environment Variables for production. |
| Checkout session + auth state | Creating checkout session in a client component. Secret key exposed. | Create checkout session in a Server Action or API route. Return only the `session.url` to the client for redirect. |

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Phase 1: Database Schema | Subscriptions table missing fields (cancel_at_period_end, current_period_end, price_id) | Use the full schema from the start -- adding columns later requires migrations and backfills |
| Phase 2: Webhook Handler | Silent failures (RLS blocks, wrong Supabase client, no error logging) | Test with `stripe trigger` CLI for every event type. Check Supabase table after each trigger. |
| Phase 3: Checkout Flow | Hardcoded price IDs, missing user metadata on session | Environment variables for all Stripe IDs. Always include `supabase_user_id` in session metadata. |
| Phase 4: Credit Gating | Stale subscription status, blocking paying users | Query Supabase live (no caching). Be generous on edge cases. |
| Phase 5: Billing Portal | Cancel-at-period-end treated as immediate cancel, portal return shows stale state | Store `cancel_at_period_end` boolean. Poll for updates on portal return. |
| Phase 6: Go-Live | Test mode IDs in production, webhook secret mismatch | Pre-launch checklist: all env vars updated, live webhook endpoint registered, test with real $1 charge. |

## "Looks Done But Isn't" Checklist

- [ ] **Webhook:** Uses `req.text()` not `req.json()` for raw body access
- [ ] **Webhook:** Signature verification with `stripe.webhooks.constructEvent()` -- tested in production, not just dev
- [ ] **Webhook:** Uses `supabaseAdmin` (service role key), not anon key
- [ ] **Webhook:** Returns 200 quickly, heavy processing is minimal
- [ ] **Webhook:** Idempotent -- `stripe_events` table prevents duplicate processing
- [ ] **Webhook:** Handles ALL subscription statuses (active, past_due, unpaid, canceled, incomplete, trialing)
- [ ] **Database:** `subscriptions` table has: stripe_subscription_id (unique), stripe_customer_id, user_id, status, price_id, current_period_start, current_period_end, cancel_at_period_end
- [ ] **Database:** `stripe_events` log table exists for debugging
- [ ] **Database:** `stripe_customer_id` stored on `profiles` table (not just subscriptions)
- [ ] **Database:** RLS: SELECT policy on subscriptions (`auth.uid() = user_id`), no public write policies
- [ ] **Checkout:** Session includes `metadata.supabase_user_id`
- [ ] **Checkout:** Price IDs from environment variables, not hardcoded
- [ ] **Checkout:** Success page handles webhook lag (polling or direct session verification)
- [ ] **Credit gating:** `past_due` treated as active (grace period)
- [ ] **Credit gating:** No subscription caching -- always query live
- [ ] **Billing portal:** `cancel_at_period_end` stored and displayed correctly
- [ ] **Billing portal:** Return URL is valid, authenticated page
- [ ] **Env vars:** All Stripe IDs are environment variables, different between test and live
- [ ] **Env vars:** Secret key has NO `NEXT_PUBLIC_` prefix
- [ ] **Env vars:** Webhook signing secret is per-environment (test vs live endpoint)
- [ ] **Go-live:** Live products/prices created in Stripe Dashboard
- [ ] **Go-live:** Live webhook endpoint registered with correct events
- [ ] **Go-live:** Tested with real card charge before public launch

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| Webhook signature verification broken in production | LOW | Fix `req.text()` call, redeploy. Stripe retries failed events for 72 hours. Most events will be recovered automatically. |
| RLS blocking all webhook writes | MEDIUM | Switch to service role client, redeploy. Replay missed events from Stripe Dashboard (Events > Resend). May need to manually sync users who paid during the outage. |
| Test price IDs in production | LOW | Create live products/prices, update env vars, redeploy. No data corruption -- checkout just failed for affected users. |
| Users granted access but subscription not recorded | HIGH | Must reconcile Stripe subscriptions with Supabase records. Use Stripe API to list all active subscriptions, cross-reference with Supabase, insert missing records. |
| Past_due users locked out | MEDIUM | Change access logic to include past_due. Apologize to affected users. Consider crediting extra analyses. |
| Duplicate subscription records | MEDIUM | Add unique constraint on `stripe_subscription_id`. Deduplicate existing rows (keep most recent). Add idempotency checks. |

## Sources

- [Stripe Official: Using Webhooks with Subscriptions](https://docs.stripe.com/billing/subscriptions/webhooks) -- event ordering, subscription lifecycle
- [Stripe Official: Receive Stripe Events in Your Webhook Endpoint](https://docs.stripe.com/webhooks) -- signature verification, retry behavior
- [Stripe Official: How Subscriptions Work](https://docs.stripe.com/billing/subscriptions/overview) -- subscription statuses, dunning
- [Stripe Official: Automate Payment Retries (Smart Retries)](https://docs.stripe.com/billing/revenue-recovery/smart-retries) -- dunning configuration
- [Stripe CLI Issue #418: Webhooks Sent in Incorrect Order](https://github.com/stripe/stripe-cli/issues/418) -- confirms non-deterministic event ordering
- [Supabase Docs: Handling Stripe Webhooks](https://supabase.com/docs/guides/functions/examples/stripe-webhooks) -- Edge Function pattern
- [Supabase Discussion #41877: Replication Lag Between Stripe + Supabase](https://github.com/orgs/supabase/discussions/41877) -- webhook timing and race conditions
- [Supabase Docs: Use Service Key to Bypass RLS](https://egghead.io/lessons/supabase-use-the-supabase-service-key-to-bypass-row-level-security) -- service role for webhook handlers
- [Next.js App Router + Stripe Webhook Signature Verification](https://kitson-broadhurst.medium.com/next-js-app-router-stripe-webhook-signature-verification-ea9d59f3593f) -- `req.text()` pattern
- [Next.js Issue #60002: Cannot Access Request Raw Body for Stripe Webhook](https://github.com/vercel/next.js/issues/60002) -- body parsing gotcha
- [DEV Community: The Race Condition You're Probably Shipping Right Now With Stripe Webhooks](https://dev.to/belazy/the-race-condition-youre-probably-shipping-right-now-with-stripe-webhooks-mj4) -- queue-based architecture, duplicate prevention
- [DEV Community: 5 Things We Got Wrong About Stripe Billing](https://dev.to/obsidiancladlabs/5-things-we-got-wrong-about-stripe-billing-3439) -- post-mortem on subscription lifecycle, dunning, price management
- [Stripe + Supabase SaaS Starter Kit](https://vercel.com/templates/next.js/stripe-supabase-saas-starter-kit) -- reference implementation patterns
- [DEV Community: Stripe Integration Guide for Next.js 15 with Supabase](https://dev.to/flnzba/33-stripe-integration-guide-for-nextjs-15-with-supabase-13b5) -- end-to-end integration guide
- [5 Things You Need to Know About Stripe's Test Mode](https://blog.tier.run/the-5-gotchas-of-stripe-test-mode) -- test/live mode separation, non-portable IDs
- [WooCommerce Payments Issue #2943: Test Mode Price IDs Don't Exist in Live Mode](https://github.com/Automattic/woocommerce-payments/issues/2943) -- confirms ID non-portability
- [Medium: Things You Should Avoid While Integrating Stripe Subscriptions](https://medium.com/@harisbakhabarpk/things-you-should-avoid-while-integrating-stripe-subscriptions-28c9d1974308) -- common integration mistakes
- [Ben Foster: How to Handle Failed Subscription Payments in Stripe](https://benfoster.io/blog/stripe-failed-payments-how-to/) -- dunning and past_due handling

---
*Pitfalls research for: NeuroCut v6.0 Stripe Payments*
*Researched: 2026-04-13*
