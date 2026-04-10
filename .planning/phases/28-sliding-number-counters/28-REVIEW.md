---
phase: 28-sliding-number-counters
reviewed: 2026-04-10T12:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - web/src/components/ui/SlidingNumber.tsx
  - web/src/components/results/MetricCard.tsx
  - web/src/components/results/BenchmarkCards.tsx
  - web/src/app/(app)/results/page.tsx
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 28: Code Review Report

**Reviewed:** 2026-04-10T12:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files were reviewed covering the SlidingNumber animated counter component, its integration into MetricCard and BenchmarkCards, and the results page. The SlidingNumber component is well-structured with clean spring animation via framer-motion. Two warnings relate to inconsistent value/suffix handling in MetricCard usage that could confuse users, and a potential runtime issue in SlidingNumber when the value changes from non-zero back to zero. Two informational items note minor code quality concerns.

## Warnings

### WR-01: SlidingNumber does not animate back to zero when value changes

**File:** `web/src/components/ui/SlidingNumber.tsx:57-59`
**Issue:** When `value === 0`, the effect returns early and sets display directly without calling `motionVal.set(0)`. This works fine on initial render. However, if the component first receives a non-zero value (e.g., 75) and later receives `value = 0` (e.g., data reloads or props change), the spring will never animate back to zero -- the display snaps instantly while the internal `motionVal` stays at 75. On a subsequent update to a new non-zero value, the spring will animate from 75 instead of from 0.
**Fix:** Remove the early return for `value === 0` and let the spring handle it naturally, or explicitly call `motionVal.set(0)` before the early return:
```tsx
if (value === 0) {
  motionVal.set(0);
  return;
}
```

### WR-02: Inconsistent suffix usage between MetricCard value and SlidingNumber

**File:** `web/src/app/(app)/results/page.tsx:211-227`
**Issue:** The "Hook Score" MetricCard (line 211-217) passes `animate` and `numericValue` but no `suffix`, so the animated number renders without a `%` sign. Meanwhile the static `value` is just a plain number (`Math.round(summary.hook_score * 100)`). The "Retention" card (line 218-227) correctly passes `suffix="%"` but its static `value` already includes the `%` (`${...}%`). If `animate` is ever false or `numericValue` is undefined, Hook Score shows a bare number (no unit), and Retention shows `XX%` -- inconsistent presentation. Additionally, the "Overall Score" card (line 201-209) also lacks a suffix, so there is no unit indicator for what is clearly a percentage.
**Fix:** Add `suffix="%"` to the Hook Score and Overall Score MetricCards for consistency:
```tsx
<MetricCard
  label="Hook Score"
  value={`${Math.round(summary.hook_score * 100)}%`}
  // ...
  suffix="%"
/>
```

## Info

### IN-01: Unused React import

**File:** `web/src/components/results/MetricCard.tsx:3`
**Issue:** `import React from "react"` is not needed in modern React (17+ with the new JSX transform) and Next.js projects. It is unused.
**Fix:** Remove the import: `import React from "react";`

### IN-02: Duplicated MetricCard value computation

**File:** `web/src/app/(app)/results/page.tsx:202-209`
**Issue:** `Math.round(summary.overall * 100)` is computed twice -- once for `value` and once for `numericValue`. Same pattern for Hook Score and Retention. When `animate` is true, only `numericValue` is used (the static `value` is ignored), making the `value` prop redundant in these cases.
**Fix:** Consider extracting the computed value to a local variable to avoid duplication:
```tsx
const overallPct = Math.round(summary.overall * 100);
<MetricCard label="Overall Score" value={overallPct} numericValue={overallPct} ... />
```

---

_Reviewed: 2026-04-10T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
