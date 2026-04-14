---
phase: 60-webhook-handler
plan: 01
status: complete
started: 2026-04-14
completed: 2026-04-14
---

# Plan 60-01: Webhook Handler & Subscription Helper — Summary

## What Was Built

Stripe webhook API route that syncs subscription lifecycle events to Supabase, plus a reusable subscription query helper.

## Key Files

| File | Purpose |
|------|---------|
| `web/src/app/api/stripe/webhook/route.ts` | POST handler: signature verification, idempotency, 5 event types |
| `web/src/lib/subscription.ts` | getUserSubscription, hasActiveAccess, getAccessLevel helpers |

## Events Handled

- `checkout.session.completed` — upserts customer + subscription
- `customer.subscription.created/updated/deleted` — upserts subscription state
- `invoice.payment_failed` — sets subscription to past_due

## Key Patterns

- Raw body via `req.text()` (not `req.json()`) for signature verification
- `supabaseAdmin` for all writes (bypasses RLS)
- UPSERT with `onConflict: 'id'` handles out-of-order events
- Idempotency check via `stripe_events` table before processing
- `past_due` = grace period (hasActiveAccess returns true)

## Deviations

- Stripe v22 moved `current_period_start/end` to subscription items (not top-level). Adapted.
- Stripe v22 moved `invoice.subscription` to `invoice.parent.subscription_details`. Adapted.
- Supabase generic types resolve to `never` for upsert/update — used `as never` type assertions (same pattern as existing codebase).

## Self-Check: PASSED
