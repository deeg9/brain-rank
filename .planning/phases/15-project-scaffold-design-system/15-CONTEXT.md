# Phase 15: Project Scaffold & Design System - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Initialize a Next.js project with TypeScript and Tailwind CSS. Build the NeuroCut design system as reusable React components matching the Stitch HTML reference. Set up routing for all 15 screens with correct layout wrappers (app shell for authenticated screens, full-screen for auth/error pages).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key references:
- Stitch HTML screens: /Users/deeg/Downloads/stitch_neurocut_ui_brief2/ and /Users/deeg/Downloads/stitch_neurocut_ui_brief3/
- Design tokens: ui-specs/design-tokens.md
- Component catalog: ui-specs/components.md
- Interactions: ui-specs/interactions.md
- Screen index: ui-specs/00-screen-index.md

Stack decisions:
- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS v4 with custom NeuroCut design tokens
- Google Fonts: Space Grotesk + Inter
- Material Symbols Outlined for icons

</decisions>

<code_context>
## Existing Code Insights

No frontend code exists yet. The repo currently has:
- src/ — Python inference pipeline code (RunPod handler)
- ui-specs/ — 13 spec files from v1.1 audit
- Dockerfile, scripts/ — container and deployment tooling

The frontend will be a new top-level directory or co-located with Next.js conventions.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
