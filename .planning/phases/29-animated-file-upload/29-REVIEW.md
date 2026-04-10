---
phase: 29-animated-file-upload
reviewed: 2026-04-10T12:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - web/src/components/upload/AnimatedFileUpload.tsx
  - web/src/components/upload/VideoThumbnail.tsx
  - web/src/app/(app)/upload/page.tsx
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 29: Code Review Report

**Reviewed:** 2026-04-10T12:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the animated file upload component suite: the drop zone with drag-and-drop handling, a video thumbnail generator, and the upload page that orchestrates file selection, upload, and job creation. The code is generally well-structured with good UX patterns (drag counter for nested elements, shake animation on validation errors, proper cleanup in effects). However, there are several issues around error path handling, a potential division-by-zero in thumbnail generation, and a missing interval cleanup that could leak resources.

## Warnings

### WR-01: Division by zero in thumbnail scaling when video dimensions are zero

**File:** `web/src/components/upload/VideoThumbnail.tsx:59-60`
**Issue:** If `video.videoWidth` or `video.videoHeight` is 0 (which can happen for some video formats or when metadata is incomplete), the expression `Math.max(96 / vw, 96 / vh)` produces `Infinity`. This causes `sw` and `sh` to become `Infinity`, and `ctx.drawImage()` will either fail silently or throw an exception. The catch block on line 72 will handle the throw, but the silent failure case would leave the component in a permanent loading state.
**Fix:**
```typescript
const vw = video.videoWidth;
const vh = video.videoHeight;
if (vw === 0 || vh === 0) {
  setError(true);
  return;
}
const scale = Math.max(96 / vw, 96 / vh);
```

### WR-02: Progress interval not cleared on upload error

**File:** `web/src/app/(app)/upload/page.tsx:76-82`
**Issue:** The `setInterval` for simulating progress is only cleared on the success path (line 82). If `uploadVideo()` or `createJob()` throws, the interval continues running, calling `updateFileProgress` on a stale item. This is a resource leak and will cause unnecessary re-renders until the component unmounts.
**Fix:**
```typescript
const interval = setInterval(() => {
  progress = Math.min(progress + 5, 90);
  updateFileProgress(item.id, progress);
}, 200);

try {
  const videoUrl = await uploadVideo(item.file);
  clearInterval(interval);
  updateFileProgress(item.id, 100);
  updateFileStatus(item.id, "complete");

  const jobId = await createJob(videoUrl);
  lastJobId = jobId;
} catch (err) {
  clearInterval(interval);  // <-- add this
  updateFileStatus(
    item.id,
    "error",
    err instanceof Error ? err.message : "Upload failed."
  );
  setError(err instanceof Error ? err.message : "Upload failed.");
  setUploading(false);
  return;
}
```

### WR-03: Only last job ID used for navigation when multiple files uploaded

**File:** `web/src/app/(app)/upload/page.tsx:68-101`
**Issue:** When multiple files are uploaded, each creates a job via `createJob()`, but only `lastJobId` is used for navigation. All previously created jobs are silently abandoned from the user's perspective -- they have no way to find or monitor those jobs. If multi-file upload is intentional, the navigation should account for all jobs. If single-file is the expected use case, the UI should enforce it.
**Fix:** Either navigate to a dashboard that shows all jobs, or pass all job IDs as query parameters:
```typescript
const jobIds: string[] = [];
// ... in loop:
jobIds.push(jobId);
// ... after loop:
router.push(`/processing?jobIds=${jobIds.join(",")}`);
```

### WR-04: Upload cannot be cancelled once started

**File:** `web/src/app/(app)/upload/page.tsx:63-98`
**Issue:** The `handleAnalyze` function runs a sequential loop over all files with no cancellation mechanism. Once uploading starts, the user has no way to cancel. If the component unmounts during the async operation (e.g., user navigates away), the function continues running and calls state setters on an unmounted component. Consider using an `AbortController` or a ref-based cancellation flag.
**Fix:** Add an AbortController pattern:
```typescript
const abortRef = useRef<AbortController | null>(null);

async function handleAnalyze() {
  const controller = new AbortController();
  abortRef.current = controller;
  // ... pass controller.signal to uploadVideo
  // ... check controller.signal.aborted before state updates
}

// cleanup on unmount
useEffect(() => {
  return () => abortRef.current?.abort();
}, []);
```

## Info

### IN-01: File input accept attribute is broader than validated types

**File:** `web/src/components/upload/AnimatedFileUpload.tsx:218`
**Issue:** The `<input accept="video/*">` allows any video type in the file browser, but `validateFiles` only accepts `video/mp4`, `video/webm`, and `video/quicktime`. Users can select files like `.avi` or `.mkv` through the browser dialog, only to see a validation error after selection.
**Fix:** Match the accept attribute to the validated types:
```tsx
<input
  accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
  // ...
/>
```

### IN-02: Hardcoded max size string in validation error

**File:** `web/src/components/upload/AnimatedFileUpload.tsx:91`
**Issue:** The error message says "Maximum size is 2GB" but `maxSizeBytes` is configurable via props. If a consumer passes a different `maxSizeBytes`, the error message would be incorrect.
**Fix:**
```typescript
if (file.size > maxSizeBytes) {
  setValidationError(`File too large. Maximum size is ${formatSize(maxSizeBytes)}.`);
  triggerShake();
  continue;
}
```

---

_Reviewed: 2026-04-10T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
