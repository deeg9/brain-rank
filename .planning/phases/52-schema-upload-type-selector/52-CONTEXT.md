# Phase 52: Schema & Upload Type Selector - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Add `input_type`, `text_content`, and `text_style` columns to the jobs table, update TypeScript types, and add a tab-based type selector (Video / Image / Text) to the upload page. This phase establishes the data model and UI foundation for all subsequent multi-modal phases.

</domain>

<decisions>
## Implementation Decisions

### Schema Design
- Column name: `input_type TEXT DEFAULT 'video'` — matches TRIBE v2 terminology
- Text content stored in `text_content TEXT` column on jobs table — simple, no extra table
- Text style stored in `text_style TEXT` column (values: 'billboard', 'social', 'general') — simple enum-like
- Keep `video_url` column as-is — reuse for all media URLs, avoids breaking changes

### Upload Type Selector UX
- Tab bar (Video / Image / Text) at top of upload area — clear, simple, matches existing dark theme
- Default selected type: Video (existing behavior, no regression)
- All 3 types shown and enabled at launch — UI is ready, placeholder content for unimplemented types
- Text mode sub-selector (Spoken/Visual toggle) shown only when Text tab is selected — progressive disclosure

### Claude's Discretion
- Migration file naming and numbering
- Exact tab bar styling (should match existing dark theme / glassmorphism patterns)
- Placeholder content for Image and Text tabs (e.g., "Coming soon" or skeleton UI)
- RunPod InputSchema changes (add optional fields alongside existing video_url)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AnimatedFileUpload` component at web/src/components/upload/AnimatedFileUpload.tsx — drag-drop file upload with preview
- Existing upload page at web/src/app/(app)/upload/page.tsx — FileItem state management, handleAnalyze flow
- Server action `createJob(videoUrl)` at web/src/app/(app)/upload/actions.ts — RunPod dispatch
- Database types at web/src/lib/database.types.ts — Job interface

### Established Patterns
- Dark theme with glassmorphism (backdrop-blur, bg-white/5 borders)
- Supabase migrations in numbered SQL files
- Server actions for mutations, API routes for polling
- Tab-like patterns exist in settings page

### Integration Points
- Jobs table schema (Supabase Postgres)
- TypeScript Job interface in database.types.ts
- Upload page component tree
- Server action createJob() — needs new params
- RunPod API route payload — needs input_type field
- API route GET /api/jobs/[id] — passes through results unchanged

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The tab selector should feel native to the existing Neural Architect design system.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
