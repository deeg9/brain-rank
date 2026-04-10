---
phase: 27-animation-foundation
plan: 01
subsystem: web-ui
tags: [animation, utilities, dependencies, foundation]
dependency_graph:
  requires: []
  provides: [framer-motion, react-use-measure, cn-utility, tailwind-merge]
  affects: [web/src/components/ui/Card.tsx]
tech_stack:
  added: [framer-motion, react-use-measure, clsx, tailwind-merge]
  patterns: [cn-class-merging, motion-div-animation]
key_files:
  created:
    - web/src/lib/utils.ts
    - web/src/lib/utils.test.ts
    - web/src/components/ui/AnimationDemo.tsx
  modified:
    - web/package.json
    - web/package-lock.json
    - web/src/components/ui/Card.tsx
decisions:
  - "Used standard cn() pattern (clsx + tailwind-merge) for class merging"
  - "AnimationDemo is verification-only component, not routed"
metrics:
  duration: 154s
  completed: "2026-04-10T16:22:23Z"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 27 Plan 01: Animation Foundation Summary

Installed framer-motion, react-use-measure, clsx, and tailwind-merge as runtime dependencies; created cn() class-merging utility with 6 passing tests; updated Card component to use cn(); verified animation stack with AnimationDemo component.

## Task Results

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Install animation and utility dependencies | 113fd82 | Done |
| 2 | Create cn() utility with tests (TDD) | bb8581b | Done |
| 3 | Verify Framer Motion with existing Card component | fafa3ae | Done |

## What Was Built

### Dependencies Installed
Four npm runtime dependencies added to `web/package.json`:
- **framer-motion** - React animation library for all v2.1 component phases
- **react-use-measure** - Element measurement hook for animated layouts
- **clsx** - Conditional class string builder
- **tailwind-merge** - Tailwind CSS class conflict resolver

### cn() Utility (`web/src/lib/utils.ts`)
Standard class-merging utility combining clsx (conditional filtering) with tailwind-merge (conflict resolution). Six unit tests cover: Tailwind conflict resolution, falsy value filtering, null/undefined handling, background class deduplication, and empty args.

### Card Component Update (`web/src/components/ui/Card.tsx`)
Replaced template-literal class concatenation with cn(). Same public interface (CardProps unchanged), same visual output, improved readability and proper Tailwind class conflict handling.

### AnimationDemo Component (`web/src/components/ui/AnimationDemo.tsx`)
Verification component proving framer-motion, react-use-measure, and cn() all work together. Uses motion.div with spring animation, useMeasure for dimension tracking, cn() for class merging. Not added to any route -- exists as a verification artifact.

## Deviations from Plan

### Pre-existing Build Failure (Out of Scope)

`next build` fails at the TypeScript check step due to pre-existing Supabase type errors in `upload/actions.ts` and `api/jobs/` routes (type `never` from untyped Supabase tables). The compilation step itself succeeds ("Compiled successfully in 2.8s"). All files created/modified in this plan have zero TypeScript errors. This is a pre-existing issue unrelated to animation foundation work.

## Decisions Made

1. **Standard cn() pattern**: Used the widely-adopted clsx + tailwind-merge composition, same as shadcn/ui and most React+Tailwind projects.
2. **AnimationDemo as verification artifact**: Created as a non-routed component to prove the animation stack works without modifying any existing routes.

## Verification Results

- All 4 npm packages importable via Node.js require()
- 6/6 cn() unit tests passing
- Zero TypeScript errors in all created/modified files
- Next.js compilation succeeds (pre-existing type errors in unrelated files are out of scope)

## Self-Check: PASSED

All 4 created/modified files exist. All 3 task commits verified.
