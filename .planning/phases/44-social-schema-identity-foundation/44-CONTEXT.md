# Phase 44: Social Schema & Identity Foundation - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can claim a unique username that becomes their public identity across the platform. This phase delivers the database schema (profiles table, is_public on jobs), username claiming UI in settings, and real-time availability checking.

</domain>

<decisions>
## Implementation Decisions

### Username Claiming UX
- Username claiming happens on the settings page (add field to existing SettingsForm)
- Availability checking uses debounced real-time API calls (500ms debounce, `/api/username/check` route)
- Existing users without usernames see a soft prompt banner on dashboard linking to settings
- Validation feedback shown inline below the username input field

### Username Rules & Restrictions
- Allowed characters: lowercase alphanumeric + underscores `[a-z0-9_]`, auto-lowercase input
- Reserve ~20 common names (admin, api, settings, help, support, discover, profile, etc.) via static blocklist
- Usernames can be changed after claiming (unlimited changes for v4.0)
- Length: 3-20 characters

### Database & Migration Design
- Profile row auto-created via database trigger on auth.users insert (guarantees 1:1 relationship)
- Use citext extension for case-insensitive username uniqueness (`CREATE EXTENSION IF NOT EXISTS citext`)
- Username availability check API route requires authentication (prevents bot enumeration)
- is_public column added to jobs table via separate migration file (00004_add_is_public_to_jobs.sql)

### Claude's Discretion
None — all decisions captured above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SettingsForm.tsx` — existing settings form with Toggle component, notification prefs; username field will be added here
- `Button`, `Input` components from `@/components/ui`
- Existing RLS policy patterns in `00001_create_jobs_table.sql`

### Established Patterns
- Supabase auth with `auth.uid()` for RLS policies
- Migration files numbered sequentially: `00001_`, `00002_`, `00003_`
- TypeScript types in `database.types.ts` — needs Profile type added
- Client-side state with localStorage (notification prefs pattern)

### Integration Points
- Settings page at `web/src/app/(app)/settings/` — add username section
- Dashboard page — add banner for unclaimed username prompt
- `database.types.ts` — add Profile interface and update Database type
- Supabase migrations folder: `web/supabase/migrations/`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches matching existing codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
