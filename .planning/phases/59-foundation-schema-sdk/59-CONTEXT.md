# Phase 59: Foundation (Schema + SDK) - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The database tracks subscription state and the Stripe SDK is configured for both development and production. This phase installs the 3 Stripe npm packages, creates a Stripe SDK singleton, creates a Supabase admin client (service role), runs Supabase migrations for customers/subscriptions/credit_usage/stripe_events tables with RLS policies, sets up environment variable structure, and updates TypeScript types.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, research (STACK.md, ARCHITECTURE.md, PITFALLS.md), and codebase conventions to guide decisions.

Key guidance from research:
- Use `stripe@22.0.1`, `@stripe/stripe-js@9.1.0`, `@stripe/react-stripe-js@6.1.0`
- Pin Stripe API version to `2026-03-25.dahlia`
- Supabase admin client uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- Tables: customers (user→stripe_customer_id), subscriptions (full lifecycle), credit_usage (weekly counting), stripe_events (idempotency log)
- RLS: users read own subscriptions, no public write policies, service role writes only
- Free tier = 5 analyses/week, Creator = unlimited

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/lib/supabase/server.ts` — existing Supabase server client pattern
- `web/src/lib/supabase/middleware.ts` — auth middleware
- `web/src/lib/database.types.ts` — existing TypeScript types for Supabase

### Established Patterns
- API routes at `web/src/app/api/` (e.g., jobs/route.ts)
- Environment variables in `.env.local`
- Supabase migrations via Dashboard or SQL

### Integration Points
- New `src/lib/stripe.ts` for Stripe SDK singleton
- New `src/lib/supabase/admin.ts` for service role client
- New tables in Supabase Postgres

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Follow research recommendations in STACK.md and ARCHITECTURE.md.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
