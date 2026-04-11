---
phase: 40-ui-subtraction-component-consolidation
reviewed: 2026-04-10T00:00:00Z
depth: quick
files_reviewed: 3
files_reviewed_list:
  - web/src/components/results/BrainViewer.tsx
  - web/src/components/results/BrainViewerCanvas.tsx
  - web/src/components/results/BrainGlowMesh.tsx
findings:
  critical: 0
  warning: 0
  info: 2
  total: 2
status: issues_found
---

# Phase 40: Code Review Report

**Reviewed:** 2026-04-10T00:00:00Z
**Depth:** quick
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three React/Three.js components reviewed at quick depth using pattern scanning. No secrets, dangerous function usage, debug artifacts, or empty catch blocks were found. Two low-severity Info items were identified: a duplicated `useGLTF.preload` call across two files, and an unused prop in the `BrainViewerProps` interface. No critical or warning-level issues.

## Info

### IN-01: Duplicate `useGLTF.preload` Call

**File:** `web/src/components/results/BrainViewerCanvas.tsx:42` and `web/src/components/results/BrainGlowMesh.tsx:74`
**Issue:** `useGLTF.preload('/models/brain-fsaverage5-unified.glb')` is called at module level in both files. While `useGLTF` internally deduplicates cache entries, the duplicate call is misleading — it implies both files independently own the preload responsibility. This is a side-effect of the component split and will cause confusion when either file is moved or refactored.
**Fix:** Remove the `useGLTF.preload` call from `BrainGlowMesh.tsx` (line 74). Ownership of the preload side-effect belongs at the highest component that knows the model is needed — `BrainViewerCanvas.tsx` is the right place since it orchestrates the scene.

### IN-02: Unused `currentTimeRef` Prop in `BrainViewerProps`

**File:** `web/src/components/results/BrainViewer.tsx:12-16`
**Issue:** The `BrainViewerProps` interface declares `currentTimeRef: React.RefObject<number>` but the component destructuring on line 16 omits it (`{ segments, currentTime }`). The prop is accepted in the type contract but never read, and no downstream component receives it. This is dead interface surface area that misleads callers into thinking the ref is used for something (e.g., high-frequency time reads) when it is not.
**Fix:** Remove `currentTimeRef` from the `BrainViewerProps` interface and from any call sites that pass it. If high-frequency ref-based time access is needed in the future, re-add it then.

```typescript
// Before
interface BrainViewerProps {
  segments: SegmentData[];
  currentTimeRef: React.RefObject<number>; // remove this line
  currentTime: number;
}

// After
interface BrainViewerProps {
  segments: SegmentData[];
  currentTime: number;
}
```

---

_Reviewed: 2026-04-10T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: quick_
