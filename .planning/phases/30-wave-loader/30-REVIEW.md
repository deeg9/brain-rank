---
phase: 30-wave-loader
reviewed: 2026-04-10T12:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - web/src/components/ui/WaveLoader.tsx
  - web/src/app/(app)/processing/page.tsx
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 30: Code Review Report

**Reviewed:** 2026-04-10T12:00:00Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed the WaveLoader component and the processing page. Both files are well-structured React components with proper use of Suspense boundaries, polling logic, and animation. No critical security or correctness issues found. One warning related to polling not stopping after job completion, and two minor informational items.

## Warnings

### WR-01: Polling continues after navigation to results page

**File:** `web/src/app/(app)/processing/page.tsx:100-102`
**Issue:** When the job completes, `router.push` is called to navigate to the results page, but the polling interval created on line 115 continues running. Each subsequent poll will detect completion and call `router.push` again. While Next.js handles duplicate pushes gracefully, this results in unnecessary network requests and potential state updates on an unmounted component.
**Fix:** Track completion in a ref and skip polling once complete:
```tsx
const completedRef = useRef(false);

const poll = useCallback(async () => {
  if (!jobId || completedRef.current) return;
  try {
    const data = await fetchJobStatus(jobId);
    setStatus(data);
    setError(null);

    if (data.status === "completed" || data.stage === "complete") {
      completedRef.current = true;
      router.push(`/results/${jobId}`);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to fetch status");
  }
}, [jobId, router]);
```

## Info

### IN-01: Division by zero when bars=1 in WaveLoader

**File:** `web/src/components/ui/WaveLoader.tsx:19`
**Issue:** When `bars` is 1, `center` is 0 (line 13), so `distFromCenter = Math.abs(i - center) / center` divides by zero, producing `NaN` for opacity. Current call sites all use the default value of 10, so this is not triggered in practice.
**Fix:** Guard against zero center:
```tsx
const distFromCenter = center > 0 ? Math.abs(i - center) / center : 0;
```

### IN-02: Hardcoded decorative values could confuse users

**File:** `web/src/app/(app)/processing/page.tsx:345-373`
**Issue:** The VRAM usage card displays hardcoded values ("14.2 GB", "24.0 GB", "88%") that are purely decorative. This is clearly intentional for the premium UI aesthetic, but there is no comment in the code explaining these are decorative/fake values. A future developer might mistake them for values that should be wired to real data.
**Fix:** Add a brief comment above the VRAM card section:
```tsx
{/* Decorative VRAM card -- hardcoded values for visual effect, not real telemetry */}
```

---

_Reviewed: 2026-04-10T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
