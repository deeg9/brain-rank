# Phase 18: Upload & Processing - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Build the Upload screen (drag-and-drop video upload with credit cost estimate) and Processing screen (real-time progress polling with stage indicators). Upload saves video to Supabase Storage, creates a job record, and triggers inference. Processing polls job status and displays progress.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Use Stitch HTML as reference.

Key technical decisions:
- Video upload to Supabase Storage (bucket: "videos")
- After upload: create job record in Supabase jobs table, trigger RunPod via API route
- Processing page polls /api/jobs/[id]/status every 5 seconds
- Display stages: Uploading → Analyzing Audio → Encoding Video → Predicting Brain Activation
- Handle failure with retry option

Stitch reference:
- /Users/deeg/Downloads/stitch_neurocut_ui_brief2/upload_analysis/code.html
- /Users/deeg/Downloads/stitch_neurocut_ui_brief2/processing_analysis/code.html

</decisions>

<code_context>
## Existing Code Insights

- web/src/app/(app)/upload/page.tsx — stub exists
- web/src/app/(app)/processing/page.tsx — stub exists
- web/src/lib/supabase/ — client utilities ready
- web/src/lib/database.types.ts — Job type defined
- web/src/components/ui/ — Button, Input, Card, GlassPanel, StatusBadge, Skeleton ready

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond Stitch reference.

</specifics>

<deferred>
## Deferred Ideas

- Multiple video upload
- Video preview/thumbnail generation
- Upload resume on failure

</deferred>
