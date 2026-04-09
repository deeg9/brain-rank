# Phase 16: Backend Foundation - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Set up Supabase integration in the Next.js project: install client libraries, configure auth (email/password), create the jobs database table with RLS, and set up environment variables. Output is working Supabase auth + database, not UI.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

Key technical decisions:
- Use @supabase/supabase-js + @supabase/ssr for Next.js App Router integration
- Auth: email/password signup and login via Supabase Auth
- Database: jobs table (id uuid, user_id uuid references auth.users, video_url text, status text, results jsonb, created_at, updated_at)
- RLS: users can only read/write their own jobs
- Environment: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local

</decisions>

<code_context>
## Existing Code Insights

- web/ directory has Next.js 16 with App Router, TypeScript, Tailwind
- No Supabase integration exists yet
- No .env.local or environment config exists yet

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
