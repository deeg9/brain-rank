# Phase 29: Animated File Upload - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

The upload page has a polished drag-and-drop zone with animated transitions, per-file progress bars, and video thumbnail previews replacing the current upload implementation. Adapts the 21st.dev "File Upload" component.

</domain>

<decisions>
## Implementation Decisions

### Component Design
- Create an AnimatedFileUpload component based on 21st.dev pattern
- Drag-and-drop zone with visual hover/active states using Framer Motion
- Per-file progress bars with animated width transitions
- Video thumbnail generation using HTML5 video element + canvas capture
- File list management (add/remove before confirming)
- Accept video file types: video/mp4, video/webm, video/quicktime

### Integration Points
- Replace existing upload UI on web/src/app/upload/page.tsx
- MUST integrate with existing Supabase Storage upload flow
- MUST preserve job creation flow (upload → create job record → redirect to processing)
- Use existing upload server actions if present

### Visual Adaptation
- Dark theme: upload zone uses glass-surface background with ghost-border
- Drag active state: glow effect with primary purple (#ba9eff)
- Progress bar: gradient from primary to secondary (#5af8fb)
- File icons: use Material Symbols Outlined (already in project)

### Claude's Discretion
- Whether to use react-dropzone or native drag events
- Exact animation timings and spring parameters
- File size limit display

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- web/src/lib/utils.ts — cn() utility
- web/src/app/upload/ — existing upload page and actions
- framer-motion already installed
- Supabase client utilities in web/src/lib/supabase/

### Established Patterns
- Server actions pattern for form submissions
- GlassPanel component for container styling
- StatusBadge for status indicators

### Integration Points
- web/src/app/upload/page.tsx — current upload page (replace UI, keep backend logic)
- web/src/app/upload/actions.ts — server actions for upload (preserve)
- Supabase Storage for file uploads

</code_context>

<specifics>
## Specific Ideas

The 21st.dev FileUpload uses Framer Motion AnimatePresence for file list animations, motion.div for the drop zone with scale/border animations on drag, and spring-based progress bars.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
