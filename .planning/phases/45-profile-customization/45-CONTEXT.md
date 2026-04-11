# Phase 45: Profile Customization - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can personalize their profile with an avatar image and short bio. This phase adds avatar upload to Supabase Storage, bio textarea with character counter, and extends the existing profile API and settings form.

</domain>

<decisions>
## Implementation Decisions

### Avatar Upload UX
- Click-to-upload circular image area showing current avatar or placeholder initials
- Click opens file picker, shows preview before save
- Max 2MB, accept jpg/png/webp, resize client-side to 256x256
- Default avatar shows initials from username (1-2 chars) with colored background based on username hash
- Avatar positioned at top of settings form, above username and bio

### Bio Field Design
- Textarea with live character counter showing remaining chars (e.g., "42/160")
- Bio and username save together via single "Save Profile" button
- Avatar saves immediately on upload (separate from text save)
- Placeholder text: "Tell us about your content..."

### Storage & API Design
- Supabase Storage bucket named `avatars` with public access policy
- Avatar file naming: `{user_id}.webp` — one file per user, overwritten on re-upload
- Bio field handling added to existing PATCH /api/profile route (alongside username)

### Claude's Discretion
None — all decisions captured above.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `upload.ts` — existing Supabase Storage upload pattern (videos bucket) to follow for avatars
- `SettingsForm.tsx` — existing settings form with username field, will be extended with avatar + bio
- `/api/profile/route.ts` — existing PATCH route for profile updates, extend for bio field
- `database.types.ts` — Profile interface already has avatar_url and bio columns

### Established Patterns
- Supabase Storage: `supabase.storage.from('bucket').upload(path, file)` + `getPublicUrl()`
- File upload with crypto.randomUUID() naming (but we'll use user_id for avatars)
- RLS-protected API routes with `supabase.auth.getUser()` checks

### Integration Points
- Settings page at `web/src/app/(app)/settings/` — add avatar + bio UI
- `/api/profile/route.ts` — extend PATCH handler for bio
- New Supabase Storage bucket `avatars` needs creation (migration or manual)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches matching existing codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
