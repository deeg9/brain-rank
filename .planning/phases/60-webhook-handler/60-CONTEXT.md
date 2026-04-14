# Phase 60: Webhook Handler - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Stripe subscription lifecycle events are reliably synced to Supabase so the app always reflects the true subscription state. This phase creates the webhook API route at `/api/stripe/webhook` that receives Stripe events, verifies signatures, and upserts subscription state into Supabase using the admin client.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, research (ARCHITECTURE.md, PITFALLS.md), and codebase conventions to guide decisions.

Key guidance from research:
- Use `await req.text()` for raw body (NOT `req.json()`) — Pitfall #1
- Use `supabaseAdmin` (service role) for all DB writes — Pitfall #3
- Use UPSERT with `onConflict: 'id'` for subscriptions — Pitfall #6
- Handle ALL 6 subscription statuses (active, past_due, canceled, incomplete, unpaid, trialing) — Pitfall #4
- Pass user_id in BOTH session metadata AND subscription_data.metadata
- Log all events to stripe_events table for idempotency (check before processing)
- Return 200 quickly — keep handler lean
- Events to handle: checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
- past_due = grace period (retain Creator access)
- Create `src/lib/subscription.ts` helper for querying subscription status

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/lib/stripe.ts` — Stripe SDK singleton (Phase 59)
- `web/src/lib/supabase/admin.ts` — Service role client (Phase 59)
- `web/src/lib/database.types.ts` — TypeScript types including Subscription, Customer, StripeEvent

### Established Patterns
- API routes at `web/src/app/api/` using Next.js App Router route handlers
- Existing route pattern: `export async function POST(req: Request) { ... }`

### Integration Points
- New route: `web/src/app/api/stripe/webhook/route.ts`
- New helper: `web/src/lib/subscription.ts`
- Reads/writes to: customers, subscriptions, stripe_events tables

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Follow research recommendations in ARCHITECTURE.md and PITFALLS.md.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
