# Interaction Patterns Reference

## Purpose

Reusable interaction pattern catalog for NeuroCut v1 UI. Interactions are grouped by pattern type -- not by screen -- so shared behaviors are defined once. Each pattern documents trigger, behavior, components involved, screens, edge cases, and v1 implementation status.

**Component references:** Interactions reference components defined in `components.md`. Component names (Sidebar Nav, Top Bar, Video Drop Zone, Neural Activation Timeline, etc.) are used consistently across both documents.

---

## 1. Timeline Interactions

### 1.1 Timeline Scrubbing (Hover)

| Field | Value |
|-------|-------|
| **Pattern** | Timeline Scrubbing |
| **Trigger** | Mouse hover on a timeline segment |
| **Behavior** | Tooltip appears showing segment details. Tooltip content format: time range (e.g., "0:34 - 0:36"), activation score, and region breakdown (Attention, Reward, Emotional Processing, Social Cognition). On the Results Overview single-track timeline, the tooltip shows activation score plus all 4 regions. On the Results Detail multi-track timeline, hovering any track at a time position shows ALL region values at that timestamp. |
| **Components** | Neural Activation Timeline (Overview), Multi-Track Timeline (Detail) |
| **Screens** | Results Overview, Results Detail |
| **Edge cases** | Hover near segment boundary: snap to nearest segment, do not show split tooltip. Hover on gap between segments (if any): show no tooltip or show interpolated position. Hover at timeline start/end: tooltip positions to avoid clipping off-screen (shift left/right as needed). |
| **v1 notes** | Real -- tooltip data comes from `Segment.regions.*` and `Segment.activation_score`. Tooltip rendering is client-side from OutputSchema data. |

### 1.2 Timeline Click (Seek)

| Field | Value |
|-------|-------|
| **Pattern** | Timeline Click Seek |
| **Trigger** | Click on a timeline position |
| **Behavior** | Video player seeks to the clicked timestamp. Detail panel updates to reflect the selected segment. On Results Overview, the corresponding segment highlights. On Results Detail, all tracks highlight at the clicked time position. |
| **Components** | Neural Activation Timeline (Overview), Multi-Track Timeline (Detail), Video Player Placeholder |
| **Screens** | Results Overview, Results Detail |
| **Edge cases** | Click on a position with no segment data: seek to nearest segment boundary. Click at exact boundary between two segments: prefer the segment starting at that point. |
| **v1 notes** | Placeholder behavior -- video player is not functional in v1. Timeline highlight and segment selection are real. Video seek is aspirational until a real player is integrated. |

### 1.3 Playhead Drag

| Field | Value |
|-------|-------|
| **Pattern** | Playhead Drag |
| **Trigger** | Mousedown on playhead + drag along timeline |
| **Behavior** | Scrubs video position in real-time. Current time display updates continuously during drag. Timeline tooltip follows the playhead position showing segment data at the current drag point. Key interactions guide note: "Drag playhead - Scrub both videos simultaneously" (adapted to single video for v1). |
| **Components** | Neural Activation Timeline (Overview), Multi-Track Timeline (Detail), Video Player Placeholder |
| **Screens** | Results Overview, Results Detail |
| **Edge cases** | Drag beyond timeline start (0:00): clamp to 0:00. Drag beyond timeline end: clamp to video duration. Drag vertically outside timeline bounds while holding mouse: continue horizontal tracking, ignore vertical offset. Release mouse outside timeline area: commit to last valid position. |
| **v1 notes** | Timeline playhead drag is real. Video scrubbing sync is placeholder until a real player is integrated. |

### 1.4 Region Track Filtering

| Field | Value |
|-------|-------|
| **Pattern** | Region Track Filter |
| **Trigger** | Click on a region track label (Attention, Reward, Emotional Processing, or Social Cognition) in the Detail view |
| **Behavior** | Filters the main timeline to show only that region's data. Other tracks dim or collapse. A second click on the same label restores all tracks. Key interactions guide: "Click region track - Filters main timeline to show only that region." |
| **Components** | Multi-Track Timeline (Detail) |
| **Screens** | Results Detail |
| **Edge cases** | Click multiple region labels in sequence: each click replaces the filter (only one region active at a time), or implement toggle behavior where clicking a second region adds it. Recommend single-selection for v1 simplicity. |
| **v1 notes** | Real -- filtering is client-side from existing segment data. No additional API calls needed. |

### 1.5 Track Collapse/Expand

| Field | Value |
|-------|-------|
| **Pattern** | Track Section Toggle |
| **Trigger** | Click track section header toggle (details/summary pattern) |
| **Behavior** | Shows or hides the brain region tracks section. Collapsed state shows only the section header with a disclosure triangle. Expanded state shows all 4 region tracks. |
| **Components** | Multi-Track Timeline (Detail) |
| **Screens** | Results Detail |
| **Edge cases** | Collapse while a region filter is active: when re-expanded, the filter state persists. Collapse during playback: playhead continues advancing on the overview timeline if visible. |
| **v1 notes** | Real -- pure UI toggle with no data dependency. |

### 1.6 Hook Zone Marker

| Field | Value |
|-------|-------|
| **Pattern** | Hook Zone Marker |
| **Trigger** | None -- static visual element |
| **Behavior** | Dashed vertical boundary displayed at the ~5-second mark on the timeline indicating the "hook zone." Not interactive but provides visual context for the critical first-5-seconds engagement window. |
| **Components** | Neural Activation Timeline (Overview), Multi-Track Timeline (Detail) |
| **Screens** | Results Overview, Results Detail |
| **Edge cases** | Video shorter than 5 seconds: marker still appears but may overlap with end-of-video. Consider hiding marker if video duration < 5s. |
| **v1 notes** | Real -- static element positioned from known 5-second threshold. |

---

## 2. Video Playback Interactions

### 2.1 Play/Pause

| Field | Value |
|-------|-------|
| **Pattern** | Play/Pause Toggle |
| **Trigger** | Click play button on Video Player Placeholder, OR press Spacebar keyboard shortcut |
| **Behavior** | Toggles video playback between playing and paused states. Key interactions guide: "Play/pause - Both videos sync" (adapted to single video for v1). When playing, the timeline playhead advances in sync with video position. |
| **Components** | Video Player Placeholder, Neural Activation Timeline (Overview), Multi-Track Timeline (Detail) |
| **Screens** | Results Overview, Results Detail |
| **Edge cases** | Spacebar pressed while focus is on a text input (e.g., search): should NOT trigger play/pause -- only when no text input is focused. Video at end: play button resets to beginning or shows replay icon. |
| **v1 notes** | Placeholder -- video player is non-functional in v1. Spacebar shortcut and play button are wired but produce no video output. Timeline playhead advancement during "play" could be simulated for demo purposes. |

### 2.2 Keyboard Seek

| Field | Value |
|-------|-------|
| **Pattern** | Arrow Key Seek |
| **Trigger** | Press Left Arrow or Right Arrow key |
| **Behavior** | Seeks video position by +/- 2 seconds. Key interactions guide: "Arrow keys - Seek +/- 2 seconds." Timeline playhead updates to reflect new position. |
| **Components** | Video Player Placeholder, Neural Activation Timeline (Overview), Multi-Track Timeline (Detail) |
| **Screens** | Results Overview, Results Detail |
| **Edge cases** | Seek before 0:00: clamp to 0:00. Seek past video end: clamp to video duration. Arrow key pressed while focus is on a text input: should NOT trigger seek. Rapid repeated presses: debounce or accumulate (seek by 2s per keypress without waiting for animation). |
| **v1 notes** | Placeholder for video seek. Timeline playhead movement from arrow keys is implementable in v1. |

### 2.3 Video-Timeline Sync

| Field | Value |
|-------|-------|
| **Pattern** | Bidirectional Video-Timeline Sync |
| **Trigger** | Automatic -- whenever video position or timeline position changes |
| **Behavior** | When video plays, the playhead on the timeline advances in sync. When the timeline is clicked or playhead is dragged, the video seeks to the corresponding position. Bidirectional binding between video currentTime and timeline playhead position. |
| **Components** | Video Player Placeholder, Neural Activation Timeline (Overview), Multi-Track Timeline (Detail) |
| **Screens** | Results Overview, Results Detail |
| **Edge cases** | Sync drift: if video buffering causes position mismatch, re-sync on next frame update. Timeline data has 2-second segments but video is continuous: interpolate playhead position within segments. |
| **v1 notes** | Placeholder for video side. Timeline playhead can update independently as a time cursor even without a functional video player. |

---

## 3. Drag-and-Drop Interactions

### 3.1 File Drop

| Field | Value |
|-------|-------|
| **Pattern** | Video File Drop |
| **Trigger** | Drag file over the Video Drop Zone area |
| **Behavior** | On dragover: drop zone border transitions to primary/50 (#ba9eff at 50% opacity), background brightens to surface-container. Visual feedback that the zone is an active drop target. On drop: validate the file (format, size, duration), then begin upload. Drop zone updates to show file name, file size, and upload progress bar. |
| **Components** | Video Drop Zone, Upload Progress Indicator |
| **Screens** | Upload |
| **Edge cases** | **Wrong format:** Show error "Unsupported format. Please upload .mp4, .mov, or .mkv" with red border accent. **File too large:** Show error "File exceeds maximum size limit" with red border. **File too long:** Show error "Video exceeds maximum duration" (if duration limit applies). **Multiple files dropped:** Reject all but the first file; show message "Only one video can be analyzed at a time." **Drag leaves zone without drop:** Revert border and background to default state. **Browser does not support drag-and-drop:** Fall back to browse button only. |
| **v1 notes** | Real -- uses browser File API and drag events. Validation rules (format check via file extension and MIME type, size check) are client-side. |

### 3.2 File Browse Fallback

| Field | Value |
|-------|-------|
| **Pattern** | File Browse Button |
| **Trigger** | Click "Browse Files" button inside the Video Drop Zone |
| **Behavior** | Native OS file picker opens, filtered to video formats (.mp4, .mov, .mkv via `accept` attribute). On file selection: same validation and upload flow as drag-and-drop. File picker cancellation returns to empty state with no error. |
| **Components** | Video Drop Zone, Upload Progress Indicator |
| **Screens** | Upload |
| **Edge cases** | User selects a file with a video extension but corrupt content: validation passes on extension but upload/processing may fail later -- handle at the Processing stage. User cancels file picker: no state change, drop zone remains in current state. |
| **v1 notes** | Real -- standard `<input type="file" accept=".mp4,.mov,.mkv">` pattern. |

---

## 4. Navigation Interactions

### 4.1 Sidebar Nav

| Field | Value |
|-------|-------|
| **Pattern** | Sidebar Navigation |
| **Trigger** | Click a nav item (Upload, Processing, Results, Dashboard) |
| **Behavior** | Navigate to the target screen. Active item displays with left border accent (2px, primary #ba9eff) and surface-container background. Icon fills/bolds for active state. Inactive items show on-surface-variant color. |
| **Components** | Sidebar Nav |
| **Screens** | All screens (Upload, Processing, Results Overview, Results Detail, Dashboard) |
| **Edge cases** | Navigate to Processing with no active job: show empty/error state on Processing screen. Navigate to Results with no completed job: redirect to Dashboard or show empty state. Click already-active nav item: no-op (do not re-navigate). |
| **v1 notes** | Real -- standard client-side routing. |

### 4.2 Back Navigation

| Field | Value |
|-------|-------|
| **Pattern** | Top Bar Back Arrow |
| **Trigger** | Click back arrow (left-pointing) in the Top Bar |
| **Behavior** | Navigate to the logical parent screen. From Results Overview: back to Dashboard. From Results Detail: back to Results Overview. From Processing: back to Upload (or Dashboard). Context-dependent based on current screen. |
| **Components** | Top Bar |
| **Screens** | Processing, Results Overview, Results Detail |
| **Edge cases** | Back from Processing while job is running: job continues in background (RunPod async). Show brief confirmation or note "Job will continue processing." Back from Results with unsaved state (e.g., tag edits in v2): no unsaved state concern in v1. |
| **v1 notes** | Real -- standard navigation. No unsaved state concerns in v1. |

### 4.3 "New Analysis" CTA

| Field | Value |
|-------|-------|
| **Pattern** | New Analysis Button |
| **Trigger** | Click "New Analysis" button in sidebar footer or Dashboard header area |
| **Behavior** | Navigate to the Upload screen. Any previous upload state is cleared -- drop zone resets to empty. |
| **Components** | Sidebar Nav (footer CTA button), Dashboard header |
| **Screens** | All screens (sidebar), Dashboard (header button) |
| **Edge cases** | Click while on Upload screen already: reset upload state (clear any selected file, reset progress). Click while a job is processing: navigate to Upload; existing job continues in background. |
| **v1 notes** | Real -- standard navigation with state reset. |

### 4.4 Summary Card Click

| Field | Value |
|-------|-------|
| **Pattern** | Metric Card Jump |
| **Trigger** | Click a summary metric card on Results Overview (Overall Score, Hook Score, Retention Score, Peak Moment, Engagement IQ) |
| **Behavior** | Scrolls to the relevant timeline section and highlights the corresponding segment. For example: Peak Moment card jumps to the peak segment on the timeline. Hook Score card jumps to the first ~5 seconds (hook zone). Key interactions guide: "Click summary card - Jumps to relevant moment." |
| **Components** | Summary Metric Cards, Neural Activation Timeline |
| **Screens** | Results Overview |
| **Edge cases** | Click on Engagement IQ card (aspirational): no jump target -- show tooltip "Coming Soon" or no-op. Click on Overall Score: no single segment to jump to -- could highlight the entire timeline or no-op. |
| **v1 notes** | Partially real for Peak Moment (known timestamp from `Summary.peak_second`). Hook Score jump to hook zone (~5s) is derivable. Overall Score and Retention Score have no single jump target -- these are aggregate metrics. Engagement IQ is aspirational. |

### 4.5 Moments Tag Click

| Field | Value |
|-------|-------|
| **Pattern** | Moment Tag Jump |
| **Trigger** | Click a tagged moment pill on the timeline or in a tag list |
| **Behavior** | Jump to that labeled moment's position on the timeline. Video seeks to the moment's timestamp. Timeline playhead repositions. Key interactions guide: "Click 'Moments' tag - Jump to that labeled moment." |
| **Components** | Neural Moment Tags (aspirational), Neural Activation Timeline, Multi-Track Timeline |
| **Screens** | Results Detail |
| **Edge cases** | Tag references a segment that no longer exists (data mismatch): show error tooltip or ignore click. Multiple tags at the same timestamp: jump to the shared position. |
| **v1 notes** | Aspirational -- no tag storage API or tag data model exists in v1. The interaction pattern is documented for future implementation when tagging is built. |

---

## 5. Data Export Interactions

### 5.1 JSON Export

| Field | Value |
|-------|-------|
| **Pattern** | Export as JSON |
| **Trigger** | Click JSON export button in the Top Bar action area (Results Detail) or Export Controls section |
| **Behavior** | Client-side serialization of the full `OutputSchema` object. Triggers browser download of a `.json` file named `{video_filename}_neural_analysis.json`. Brief spinner on the button during generation (typically < 1 second for client-side serialization). Button shows checkmark flash on completion. |
| **Components** | Export Controls (Detail Top Bar) |
| **Screens** | Results Detail (primary), Results Overview (shortcut button) |
| **Edge cases** | OutputSchema is very large (long video, many segments): generation may take slightly longer but should remain sub-second. Browser download blocked by popup blocker: use `<a download>` pattern to avoid popup issues. File already exists in download folder: browser handles naming (appends number). |
| **v1 notes** | Real -- client-side only, no server round-trip needed. OutputSchema data is already in memory from the results fetch. |

### 5.2 CSV Export

| Field | Value |
|-------|-------|
| **Pattern** | Export as CSV |
| **Trigger** | Click CSV export button in the Top Bar action area (Results Detail) or Export Controls section |
| **Behavior** | Flattens segment data to tabular rows: one row per segment with columns for start, end, activation_score, arousal, valence, attention, reward, emotional_processing, social_cognition. Includes a header row with summary metrics. Triggers browser download as `{video_filename}_neural_analysis.csv`. Brief spinner during generation. |
| **Components** | Export Controls (Detail Top Bar) |
| **Screens** | Results Detail (primary), Results Overview (shortcut button) |
| **Edge cases** | Segment values contain commas or special characters: use proper CSV escaping (quote fields). Very long video with many segments: file may be large but CSV is lightweight. |
| **v1 notes** | Real -- client-side flattening of segment data. No server dependency. |

### 5.3 Share Link (Aspirational)

| Field | Value |
|-------|-------|
| **Pattern** | Generate Share Link |
| **Trigger** | Click share button |
| **Behavior** | Would generate a shareable URL to the results that others can view without authentication. |
| **Components** | Export Controls |
| **Screens** | Results Detail |
| **Edge cases** | N/A for v1. |
| **v1 notes** | Aspirational -- no sharing backend or persistent result storage exists. Button may be hidden or shown as disabled with "Coming Soon" tooltip. |

---

## 6. Search and Filter Interactions

### 6.1 Search Analyses

| Field | Value |
|-------|-------|
| **Pattern** | Job History Search |
| **Trigger** | Type in the search input field on the Dashboard Top Bar |
| **Behavior** | Filters the Job History Grid by filename substring match (case-insensitive). Filtering is instant (client-side) as the user types. Matching cards remain visible; non-matching cards are hidden. |
| **Components** | Top Bar (Dashboard variant), Job History Grid, Job Card |
| **Screens** | Dashboard |
| **Edge cases** | **No matches:** Show "No analyses match your search" empty state with option to clear search. **Empty search (clear input):** Show all job cards. **Special characters in search:** Treat as literal string match, no regex. **Very long search string:** Truncate input display but match fully. |
| **v1 notes** | Derived -- requires a job store/database to have a list of past analyses to filter. The search itself is client-side filtering once the list is loaded. The job store is an architectural dependency (see Dashboard spec). |

### 6.2 Sort Job History

| Field | Value |
|-------|-------|
| **Pattern** | Job History Sort |
| **Trigger** | Click sort control (dropdown or toggle buttons for date, score, status) |
| **Behavior** | Re-orders the Job History Grid cards by the selected criterion. Default sort: by date (newest first). By score: highest Overall Score first. By status: group completed first, then processing, then failed. |
| **Components** | Job History Grid, Job Card |
| **Screens** | Dashboard |
| **Edge cases** | Sort by score when some jobs are still processing (no score): place processing jobs at the end of the sorted list. All jobs have the same score: maintain date-based secondary sort. |
| **v1 notes** | Derived -- requires populated job store. Sort is client-side. |

### 6.3 Pagination

| Field | Value |
|-------|-------|
| **Pattern** | Job History Pagination |
| **Trigger** | Scroll to bottom of Job History Grid, or click "Load More" button |
| **Behavior** | Loads the next batch of job cards (e.g., 10 at a time). Loading indicator shows briefly during fetch. New cards append below existing ones. |
| **Components** | Job History Grid, Job Card |
| **Screens** | Dashboard |
| **Edge cases** | All jobs already loaded: hide "Load More" button. Network error during load: show retry option inline. Zero total jobs: show Empty State component instead of grid. |
| **v1 notes** | Derived -- depends on job store volume. For initial v1 with few analyses, pagination may not be needed. Include the pattern for scalability. |

---

## 7. Polling and Auto-Update Interactions

### 7.1 Job Status Polling

| Field | Value |
|-------|-------|
| **Pattern** | Async Job Status Poll |
| **Trigger** | Automatic on Processing screen load when a `job_id` is present in route or state |
| **Behavior** | Initiates GET `/status/{job_id}` polling every 3-5 seconds. Polls the RunPod async status endpoint. Response contains `{ status, output }`. Status transitions: `IN_QUEUE` -> `IN_PROGRESS` -> `COMPLETED` or `FAILED`. Progress percentage is derived from elapsed time vs historical average (~12 minutes for a 60-second video), since RunPod async mode does not provide granular progress. Stage checklist updates based on estimated progress milestones (0-10%: Uploading, 10-30%: Analyzing Audio, 30-70%: Encoding Video, 70-100%: Predicting Brain Activation). |
| **Components** | Progress Indicator, Status Label, Stage Checklist, Estimated Time Remaining |
| **Screens** | Processing |
| **Edge cases** | **Network failure during poll:** Retry silently on next interval; after 3 consecutive failures show "Connection lost -- retrying..." warning. **RunPod returns unexpected status:** Log and continue polling. **Poll response is slow (> 5s):** Skip that interval, wait for next cycle. |
| **v1 notes** | Real -- uses RunPod's async status endpoint. Progress percentage is estimated (derived), not real-time from the model. |

### 7.2 Auto-Redirect on Completion

| Field | Value |
|-------|-------|
| **Pattern** | Completion Auto-Redirect |
| **Trigger** | Polling returns `status: COMPLETED` with output data |
| **Behavior** | Progress bar fills to 100%. Brief "Complete" animation: green flash on progress bar, checkmark icon appears, all stage checklist items show "Done." After a 1-2 second delay, auto-redirect to Results Overview screen. Output data (`OutputSchema`) is passed to the Results screen via state/context. |
| **Components** | Progress Indicator, Status Label, Stage Checklist |
| **Screens** | Processing (triggers redirect to Results Overview) |
| **Edge cases** | User clicks away during the 1-2 second animation: navigation takes priority, results are still available via Dashboard. Output data is extremely large: ensure transfer to Results screen handles large payloads (pass by reference/store, not URL params). |
| **v1 notes** | Real -- redirect is client-side routing. Output data transfer depends on state management approach. |

### 7.3 Resume Polling

| Field | Value |
|-------|-------|
| **Pattern** | Poll Resume on Return |
| **Trigger** | User navigates away from Processing screen and returns (via browser back, sidebar nav, or direct URL) |
| **Behavior** | `job_id` is persisted in URL or local storage. On return to Processing screen with a valid `job_id`, polling resumes from current state. If the job already completed while the user was away, immediate redirect to Results Overview (no animation delay). |
| **Components** | Progress Indicator, Status Label |
| **Screens** | Processing |
| **Edge cases** | `job_id` in URL is invalid or expired: show error "Job not found" with option to return to Dashboard. `job_id` refers to a job from a different user (future multi-user): RunPod does not enforce user scoping in v1 -- handle in v2 with auth. |
| **v1 notes** | Real -- RunPod status endpoint is stateless and can be polled at any time with a valid `job_id`. |

### 7.4 Client-Side Timeout

| Field | Value |
|-------|-------|
| **Pattern** | Processing Timeout Warning |
| **Trigger** | 30 minutes elapsed with no `COMPLETED` or `FAILED` status from polling |
| **Behavior** | Show timeout warning overlay or banner: "Processing is taking longer than expected. You can continue waiting or return to Dashboard." Provide two actions: "Keep Waiting" (dismiss warning, continue polling) and "Return to Dashboard" (navigate away, job continues in background). |
| **Components** | Progress Indicator, Status Label |
| **Screens** | Processing |
| **Edge cases** | User clicks "Keep Waiting": reset the 30-minute timer and continue. Job completes during timeout warning display: dismiss warning, proceed with normal completion flow. Network was down for part of the 30 minutes: timer should count actual polling time, not wall clock -- or keep it simple and use wall clock. |
| **v1 notes** | Real -- client-side timer. No server dependency. The 30-minute threshold is based on expected worst-case processing time (historically ~12 minutes for 60s video, with buffer for cold starts and queue time). |

---

## 8. Hover and Feedback Interactions

### 8.1 Button Hover

| Field | Value |
|-------|-------|
| **Pattern** | Button Hover Effects |
| **Trigger** | Mouse hover on interactive buttons |
| **Behavior** | **Neural-gradient CTA buttons** (Analyze Video, New Analysis): Scale-on-hover effect (`transform: scale(1.02-1.05)` with transition). Subtle glow intensification. **Secondary/tertiary buttons** (Browse Files, Export JSON/CSV, Upgrade): Border brightening -- border color shifts from muted to more visible on hover. **Text buttons** (Settings, Support, Back): Underline or color shift to primary on hover. |
| **Components** | Upload CTA Button, Sidebar Nav (New Analysis CTA), Export Controls, all interactive buttons |
| **Screens** | All screens |
| **Edge cases** | Touch devices: hover effects do not apply; use active/pressed states instead. Disabled buttons: no hover effect -- cursor shows `not-allowed`. |
| **v1 notes** | Real -- CSS-only interactions, no JavaScript needed for basic hover effects. |

### 8.2 Card Hover

| Field | Value |
|-------|-------|
| **Pattern** | Card Hover Lift |
| **Trigger** | Mouse hover on interactive cards (Job Cards on Dashboard, Summary Metric Cards on Results Overview) |
| **Behavior** | Card border color shifts to `primary/30` (#ba9eff at 30% opacity). Subtle elevation increase (shadow deepens or border brightens). Cursor changes to pointer to indicate clickability. |
| **Components** | Job Card (Dashboard), Summary Metric Cards (Results Overview) |
| **Screens** | Dashboard, Results Overview |
| **Edge cases** | Non-interactive cards (AI Engine Stats, VRAM Load): no hover effect -- these are informational only. Card in loading/skeleton state: no hover effect. |
| **v1 notes** | Real -- CSS-only. |

### 8.3 Nav Item Hover

| Field | Value |
|-------|-------|
| **Pattern** | Navigation Hover Highlight |
| **Trigger** | Mouse hover on inactive Sidebar Nav items |
| **Behavior** | Inactive nav items brighten on hover -- text and icon color shift from `on-surface-variant` to a slightly brighter tone. Background shows subtle `surface-container` tint. Active item does not change on hover (already highlighted). |
| **Components** | Sidebar Nav |
| **Screens** | All screens |
| **Edge cases** | Hover on active item: no additional visual change. Hover on footer links (Settings, Support): same brightening effect. |
| **v1 notes** | Real -- CSS-only. |

### 8.4 Tooltip Pattern

| Field | Value |
|-------|-------|
| **Pattern** | Contextual Tooltip |
| **Trigger** | Hover on elements that have additional context (timeline segments, metric cards, aspirational badges) |
| **Behavior** | Small floating tooltip appears near the cursor or anchored to the element. Tooltip contains supplementary information: for timeline segments, shows score and region breakdown; for metric cards, shows additional context or methodology note; for aspirational elements, may show "Coming Soon." Tooltip appears after a brief delay (~200ms) and disappears on mouse leave. |
| **Components** | Neural Activation Timeline, Multi-Track Timeline, Summary Metric Cards, various UI elements |
| **Screens** | Results Overview, Results Detail, Dashboard (card tooltips) |
| **Edge cases** | Tooltip near screen edge: reposition to stay within viewport. Multiple tooltips: only one visible at a time. Rapid mouse movement across many elements: debounce tooltip display to prevent flickering. Touch devices: tooltips may be triggered by long-press or omitted. |
| **v1 notes** | Real for timeline tooltips (data from OutputSchema). Aspirational element tooltips ("Coming Soon") are static text. |

---

## Screen-to-Interaction Matrix

| Interaction Pattern | Upload | Processing | Results Overview | Results Detail | Dashboard |
|---|:---:|:---:|:---:|:---:|:---:|
| **1. Timeline Interactions** | | | | | |
| 1.1 Timeline Scrubbing (Hover) | | | X | X | |
| 1.2 Timeline Click (Seek) | | | X | X | |
| 1.3 Playhead Drag | | | X | X | |
| 1.4 Region Track Filtering | | | | X | |
| 1.5 Track Collapse/Expand | | | | X | |
| 1.6 Hook Zone Marker | | | X | X | |
| **2. Video Playback** | | | | | |
| 2.1 Play/Pause | | | X | X | |
| 2.2 Keyboard Seek | | | X | X | |
| 2.3 Video-Timeline Sync | | | X | X | |
| **3. Drag-and-Drop** | | | | | |
| 3.1 File Drop | X | | | | |
| 3.2 File Browse Fallback | X | | | | |
| **4. Navigation** | | | | | |
| 4.1 Sidebar Nav | X | X | X | X | X |
| 4.2 Back Navigation | | X | X | X | |
| 4.3 "New Analysis" CTA | X | X | X | X | X |
| 4.4 Summary Card Click | | | X | | |
| 4.5 Moments Tag Click | | | | X | |
| **5. Data Export** | | | | | |
| 5.1 JSON Export | | | X | X | |
| 5.2 CSV Export | | | X | X | |
| 5.3 Share Link (aspirational) | | | | X | |
| **6. Search and Filter** | | | | | |
| 6.1 Search Analyses | | | | | X |
| 6.2 Sort Job History | | | | | X |
| 6.3 Pagination | | | | | X |
| **7. Polling and Auto-Update** | | | | | |
| 7.1 Job Status Polling | | X | | | |
| 7.2 Auto-Redirect on Completion | | X | | | |
| 7.3 Resume Polling | | X | | | |
| 7.4 Client-Side Timeout | | X | | | |
| **8. Hover and Feedback** | | | | | |
| 8.1 Button Hover | X | X | X | X | X |
| 8.2 Card Hover | | | X | | X |
| 8.3 Nav Item Hover | X | X | X | X | X |
| 8.4 Tooltip Pattern | | | X | X | X |
