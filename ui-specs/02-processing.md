# Processing Flow Canonical Spec

## Screen: Processing

Status screen shown while RunPod processes the uploaded video, displaying job progress and estimated time remaining.

## Source Files

| Source File | Element | Disposition | Notes |
|---|---|---|---|
| processing_refined/code.html | Sidebar Nav (Processing active) | keep | Shared component, identical to Upload |
| processing_refined/code.html | Top Bar (credits, plan, upgrade, notifications, avatar) | keep | Shared component |
| processing_refined/code.html | Centered page title "Analyzing your videos..." | change | Change to singular: "Analyzing your video..." |
| processing_refined/code.html | Dual progress panels (Stream A + Stream B) | change | Collapse to single progress panel for one video |
| processing_refined/code.html | Progress bar with neural-gradient fill and percentage | keep | Strong visual — use for single video progress |
| processing_refined/code.html | Estimated time remaining (pill bar with clock icon) | keep | Good centered layout, keep as-is |
| processing_refined/code.html | GPU Acceleration badge ("US-EAST-NEURAL-01") | keep | Decorative branding, adds tech credibility |
| processing_refined/code.html | Inference Engine Logs panel (2-col span, mono font) | keep | Aspirational but visually strong — keep with data tag |
| processing_refined/code.html | VRAM Load card (14.2 GB, memory icon) | keep | Aspirational but good visual weight |
| processing_refined/code.html | Decorative background blurs (primary + tertiary) | keep | Ambient branding |
| processing_analysis/code.html | Sidebar Nav | keep | Identical |
| processing_analysis/code.html | Top Bar | keep | Identical |
| processing_analysis/code.html | "Neural Processing Cluster #09-F" title | change | Keep as decorative subtitle, not main heading |
| processing_analysis/code.html | Dual progress panels (Video A + Video B) | drop | A/B is v2-deferred |
| processing_analysis/code.html | Stage checklist per video (Uploading, Analyzing Audio, Encoding Video, Predicting Brain Activation) | keep | Adopt for single-video stage list — maps well to actual pipeline stages |
| processing_analysis/code.html | Progress bars with neural-gradient (A) and secondary (B) | change | Use neural-gradient for single video |
| processing_analysis/code.html | Estimated time remaining (rounded pill) | keep | Slightly different pill shape — prefer processing_refined version |
| processing_analysis/code.html | Real-time Inference Logs panel | keep | Same as processing_refined |
| processing_analysis/code.html | VRAM Load card | keep | Same as processing_refined |

## Layout

```
+---------------------------------------------------------------+
| Top Bar                                                       |
| Credits: 450 | Pro Plan         [bell] [Upgrade] [avatar]    |
+----------+----------------------------------------------------+
|          |                                                    |
| Sidebar  |        "Analyzing your video..."                   |
| ------   |        (subtitle text)                             |
| Upload   |                                                    |
| Process *|  +----------------------------------------------+  |
| Results  |  | Glass Panel: Single Video Progress           |  |
| Dashbrd  |  |                                              |  |
|          |  | [primary accent bar left edge]               |  |
| ------   |  | Source Video              68%                |  |
| New      |  | my_video.mp4                                 |  |
| Analysis |  |                                              |  |
|          |  | [====neural-gradient==========--------] 68%  |  |
| ------   |  |                                              |  |
| Settings |  | Stage Checklist:                             |  |
| Support  |  |  [x] Uploading              Done             |  |
|          |  |  [x] Analyzing Audio        Done             |  |
|          |  |  [~] Encoding Video         Processing       |  |
|          |  |  [ ] Predicting Activation  Wait             |  |
|          |  +----------------------------------------------+  |
|          |                                                    |
|          |  +--[clock] Est. time remaining: ~8 min--+         |
|          |  GPU Acceleration Active - Server: US-EAST-01      |
|          |                                                    |
|          |  +------------------------------+ +----------+     |
|          |  | Inference Engine Logs        | | VRAM     |     |
|          |  | [09:24:12] Initializing...   | | 14.2 GB  |     |
|          |  | [09:24:15] Mapping...        | | [memory] |     |
|          |  +------------------------------+ +----------+     |
|          |                                                    |
+----------+----------------------------------------------------+
```

**Grid:** Sidebar fixed 256px left. Main content centered (max-w-4xl), vertically centered in viewport. Bottom info cards in 3-column grid (logs span 2, VRAM spans 1).

## Components

### Sidebar Nav

- **Props:** `items: NavItem[]`, `activeRoute: string`
- **Variants:** Same as Upload screen; Processing item is active
- **States:** Processing nav item highlighted with left border accent and surface-container background
- **Shared:** Identical component to Upload flow sidebar

### Top Bar

- **Props:** `credits: number`, `planName: string`, `notifications: number`
- **Variants:** Same as Upload screen
- **States:** Default, notification-badge-visible
- **Shared:** Identical component to Upload flow top bar

### Progress Indicator

- **Props:** `progress: number` (0-100), `fileName: string`, `status: JobStatus`
- **Variants:**
  - Indeterminate: pulsing animation when progress unknown (queued state)
  - Determinate: neural-gradient fill bar with percentage label
- **States:**
  - Queued: indeterminate pulse, "Waiting for GPU..." label
  - Processing: determinate bar advancing, percentage shown
  - Complete: 100% fill, green accent, checkmark
  - Failed: red accent, error icon
- **Styling:** Glass panel container, primary accent bar on left edge, rounded-xl. Progress bar has neural-gradient fill with shadow glow.

### Status Label

- **Props:** `status: "queued" | "processing" | "complete" | "failed" | "cancelled"`
- **Variants:** Pill badge below page title
- **States:**
  - Queued: outline-variant border, muted text, "Waiting for GPU"
  - Processing: primary border, "Neural analysis in progress"
  - Complete: tertiary/green, "Analysis complete"
  - Failed: error/red, "Processing failed"
  - Cancelled: outline-variant, "Cancelled"

### Stage Checklist

- **Props:** `stages: Stage[]`
- **Stage:** `{ name: string, status: "done" | "processing" | "waiting" }`
- **Stages:** Uploading, Analyzing Audio, Encoding Video, Predicting Brain Activation
- **Variants:** Vertical list inside the progress panel
- **States per stage:**
  - Done: green check_circle (filled), "Done" label, full opacity
  - Processing: secondary sync icon (animated pulse), "Processing" label
  - Waiting: grey pending icon, "Wait" label, 30% opacity
- **Note:** Stage names are aspirational labels that approximate the actual pipeline but do not map 1:1 to real RunPod progress events

### Inference Log Panel

- **Props:** `logs: LogEntry[]`
- **LogEntry:** `{ timestamp: string, message: string, type: "info" | "success" | "error" }`
- **Variants:** Glass panel, monospace font, max-height with overflow hidden
- **States:**
  - Active: green pulse dot in header, new lines appearing
  - Idle: no pulse, static content
- **Note:** Aspirational — RunPod async mode does not expose step-by-step logs. Content will be simulated or omitted in v1.

### Estimated Time Remaining

- **Props:** `remainingMinutes: number | null`
- **Variants:** Centered pill with clock icon and bold time display
- **States:**
  - Known: displays "~N minutes" in tertiary/green
  - Unknown: displays "Estimating..." with pulse animation
- **Sub-element:** "GPU Acceleration Active - Server: US-EAST-NEURAL-01" badge below (decorative)

### VRAM Load Card

- **Props:** `vramGB: number`
- **Variants:** Small card with memory icon, centered text
- **States:** Static display
- **Note:** Aspirational — RunPod does not expose per-job VRAM metrics in async mode

### Cancel/Back Button

- **Props:** `jobId: string`
- **Variants:** Text link or subtle button, not prominent
- **States:** Default (navigates back to upload or dashboard), Confirming (are you sure?)
- **Note:** RunPod async jobs cannot be cancelled via API in most configurations. Button may navigate away without stopping the job, or show "Job will continue processing in background."

## Interactions

1. **Page loads with job in "queued" state**
   - After submitting from Upload, user is redirected here with job_id in route/state
   - Initial state: indeterminate progress bar, "Waiting for GPU..." status
   - Polling begins immediately: GET /status/{job_id} every 3-5 seconds

2. **Progress updates via polling**
   - RunPod async polling: GET /status/{job_id} returns `{ status, output }`
   - Status transitions: IN_QUEUE -> IN_PROGRESS -> COMPLETED | FAILED
   - Progress percentage: derived from elapsed time vs historical average (~12 min) since RunPod does not provide granular progress in async mode
   - Stage checklist updates based on estimated progress milestones

3. **Transition to results on completion**
   - When polling returns status=COMPLETED with output data
   - Brief "Complete" animation (progress fills to 100%, green flash)
   - Auto-redirect to Results screen after 1-2 second delay
   - Output data (OutputSchema) passed to Results screen

4. **Error handling (job failure, timeout)**
   - Status=FAILED: show error message from RunPod response, red styling
   - Offer "Retry" button to resubmit the same video
   - Client-side timeout (e.g., 30 min with no completion): show timeout warning with option to continue waiting or abort

5. **User can navigate away and return**
   - Job_id persisted in URL or local storage
   - Returning to Processing screen with valid job_id resumes polling
   - If job already completed while away, immediate redirect to Results

## States

| State | Progress Indicator | Status Label | Stage Checklist | CTA | Description |
|---|---|---|---|---|---|
| Queued | Indeterminate pulse | "Waiting for GPU" | All stages "waiting" | Cancel/Back | Job submitted, awaiting GPU worker |
| Processing | Determinate bar advancing | "Neural analysis in progress" | Stages updating | Cancel/Back | Inference running on GPU |
| Complete | 100%, green accent | "Analysis complete" | All stages "done" | View Results | Redirecting to Results |
| Failed | Red accent, stopped | "Processing failed" | Last stage shows error | Retry / Back | Job failed, show error details |
| Cancelled | Grey, stopped | "Cancelled" | Stages frozen | New Analysis | User cancelled (job may still run) |

## Data Requirements

| UI Field | Source | Tag | Notes |
|---|---|---|---|
| job_id | RunPod POST /run response `{ id }` | real | Returned when job is submitted; used for all subsequent polling |
| status | RunPod GET /status/{job_id} `{ status }` | real | IN_QUEUE, IN_PROGRESS, COMPLETED, FAILED |
| progress percentage | Elapsed time / estimated total (~12 min) | derived | RunPod async does not provide granular progress; estimate from time elapsed vs historical average |
| stage checklist stages | Estimated from progress % | derived | Map progress ranges to pipeline stages (0-10%: upload, 10-30%: audio, 30-70%: video encoding, 70-100%: brain prediction) |
| file name | Passed from Upload screen state | real | Original file name from upload step |
| estimated time remaining | (estimated total) - (elapsed time) | derived | Based on historical average of ~12 min per 60s video |
| "Neural Processing Cluster" label | Static string | aspirational | Decorative branding — no actual cluster identifier |
| inference engine logs | N/A | aspirational | RunPod async mode does not expose step-by-step inference logs; would need custom logging infrastructure |
| VRAM load (14.2 GB) | N/A | aspirational | RunPod does not expose per-job VRAM metrics in async/serverless mode |
| GPU Acceleration badge | Static string | aspirational | "US-EAST-NEURAL-01" is decorative; RunPod does not expose server identifiers to callers |
| output data | RunPod GET /status/{job_id} `{ output }` | real | OutputSchema JSON returned on COMPLETED status |

## Deferred

The following elements appear in one or both Stitch variants but are excluded from the canonical v1 spec:

- **Dual Video Progress (A/B)** (v2-deferred): Both processing_refined and processing_analysis show parallel "Source Stream A" and "Source Stream B" progress panels with independent progress bars and stage checklists. The inference pipeline processes single videos only. Dual progress is deferred to v2 when multi-video inference is supported.
- **"Dual-stream video synchronization" subtitle** (v2-deferred): Implies two videos being processed simultaneously.
- **Color-coded dual accents** (v2-deferred): Video A uses primary/purple, Video B uses secondary/cyan. Single video uses primary only.
- **Real-time collaboration avatars** (deferred): Not present in processing variants but noted in CONTEXT.md as deferred across all screens.
