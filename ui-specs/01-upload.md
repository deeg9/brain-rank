# Upload Flow Canonical Spec

## Screen: Upload

Single-video upload screen where the user provides a video URL or file for neural activation analysis.

## Source Files

| Source File | Element | Disposition | Notes |
|---|---|---|---|
| upload_videos/code.html | Sidebar Nav (4 items + New Analysis CTA) | keep | Identical across both variants |
| upload_videos/code.html | Top Bar (credits, plan, upgrade, notifications, account) | keep | Cleaner layout — credits inline |
| upload_videos/code.html | Dual A/B Drop Zones (Video A + Video B) | drop | v2-deferred per CONTEXT.md — single video only |
| upload_videos/code.html | Glass Panel cost summary (Total Payload + Credit Cost) | change | Keep glass panel style, simplify to single video cost |
| upload_videos/code.html | "Confirm & Start Analysis" CTA (disabled state) | change | Rename to "Analyze Video", enable after single upload |
| upload_videos/code.html | AI Engine Stats (3-card grid: Turbo, Visual Similarity, Encrypted) | change | Keep layout, update copy to match actual capabilities |
| upload_videos/code.html | Decorative background blur element | keep | Ambient branding element |
| upload_analysis_refined/code.html | Sidebar Nav | keep | Identical to other variant |
| upload_analysis_refined/code.html | Top Bar (credits balance stacked label) | drop | More cluttered than upload_videos layout |
| upload_analysis_refined/code.html | Dual A/B Drop Zones with radial dot grid background | drop | A/B is v2-deferred; keep radial gradient texture for single zone |
| upload_analysis_refined/code.html | Glass Panel centered cost summary (bold "20 total" CTA) | change | Stronger visual — adopt centered layout and larger CTA button |
| upload_analysis_refined/code.html | "Analyze Both Videos" CTA (neural-gradient, large) | change | Rename to "Analyze Video", keep neural-gradient style and scale-on-hover |
| upload_analysis_refined/code.html | AI Engine Stats (3-card grid) | keep | Same as upload_videos |

## Layout

```
+---------------------------------------------------------------+
| Top Bar                                                       |
| [NeuroCut logo]          Credits: 450 | Pro Plan | [Upgrade]  |
|                                         [bell] [avatar]       |
+----------+----------------------------------------------------+
|          |                                                    |
| Sidebar  |  Page Title: "Upload Analysis"                     |
| ------   |  Subtitle: supported formats, resolution limit     |
| Upload * |                                                    |
| Process  |  +----------------------------------------------+  |
| Results  |  |                                              |  |
| Dashbrd  |  |         Video Drop Zone (single)             |  |
|          |  |                                              |  |
| ------   |  |   [video_library icon]                       |  |
| New      |  |   "Drag video here or click to browse"       |  |
| Analysis |  |   [ Browse Files ]                           |  |
|          |  |                                              |  |
| ------   |  +----------------------------------------------+  |
| Settings |                                                    |
| Support  |  +----------------------------------------------+  |
|          |  | Glass Panel: Cost Summary                    |  |
|          |  | [token icon] Estimated Credit Cost: 10       |  |
|          |  |                                              |  |
|          |  |      [ Analyze Video  -->  ]                 |  |
|          |  | "Credits deducted after processing"          |  |
|          |  +----------------------------------------------+  |
|          |                                                    |
|          |  +------------+ +------------+ +------------+      |
|          |  | Turbo      | | Neural     | | Encrypted  |      |
|          |  | Processing | | Engine     | | Transit    |      |
|          |  +------------+ +------------+ +------------+      |
|          |                                                    |
+----------+----------------------------------------------------+
```

**Grid:** Sidebar fixed 256px left. Main content area with max-width 7xl, centered. Drop zone is full-width within content area (no 2-column split).

## Components

### Sidebar Nav

- **Props:** `items: NavItem[]`, `activeRoute: string`
- **NavItem:** `{ icon: string, label: string, href: string }`
- **Items:** Upload, Processing, Results, Dashboard
- **Variants:** Default (4 nav items + footer links)
- **States:** Active item highlighted with left border accent (#ba9eff) and surface-container background. Inactive items show on-surface-variant color with hover brightening.
- **Footer:** "New Analysis" CTA button (neural-gradient), Settings link, Support link

### Top Bar

- **Props:** `credits: number`, `planName: string`, `notifications: number`
- **Variants:** Default (single row with logo, credits, plan badge, action buttons)
- **States:** Default, notification-badge-visible (red dot on bell icon)
- **Elements:** NeuroCut logo + wordmark, credits display, plan name badge, Upgrade button (tertiary/green pill), notification bell, account avatar

### Video Drop Zone

- **Props:** `file: File | null`, `isUploading: boolean`, `progress: number`, `error: string | null`
- **Variants:**
  - Empty: dashed border, icon + "Drag video here" text + Browse button
  - Hover/Dragover: border changes to primary/50, background shifts to surface-container
- **States:**
  - Empty: no file selected
  - File Selected: show file name, size, duration preview
  - Uploading: progress bar overlaid
  - Error: red border, error message displayed
- **Styling:** Radial dot-grid background texture (from upload_analysis_refined), dashed border with outline-variant/30, rounded-xl

### Upload Progress Indicator

- **Props:** `progress: number` (0-100), `fileName: string`
- **Variants:** Determinate progress bar (neural-gradient fill)
- **States:** Uploading (animated), Complete (100%, green accent), Failed (red accent with retry)

### Cost Estimate Display

- **Props:** `creditCost: number`, `creditsAvailable: number`
- **Variants:** Glass panel with centered layout (adopted from upload_analysis_refined)
- **States:** Default (shows cost), Insufficient Credits (warning styling)
- **Elements:** Token icon, "Estimated Credit Cost" label, cost value, fine print about deduction timing

### Upload CTA Button

- **Props:** `disabled: boolean`, `loading: boolean`
- **Variants:** neural-gradient background, large (py-5), full-width (max-w-md centered)
- **States:**
  - Disabled: surface-container-highest background, muted text, cursor-not-allowed (no file uploaded)
  - Enabled: neural-gradient, bold text, scale-on-hover (file ready)
  - Loading: spinner, "Submitting..." text
- **Label:** "Analyze Video" (not "Analyze Both Videos" or "Confirm & Start Analysis")

### AI Engine Stats Cards

- **Props:** `stats: StatCard[]`
- **StatCard:** `{ icon: string, iconColor: string, title: string, description: string }`
- **Variants:** 3-column grid on sm+, single column on mobile
- **States:** Static informational — no interactive states
- **Note:** Content is aspirational marketing copy, not live data

## Interactions

1. **Drag-and-drop file onto drop zone**
   - User drags video file over drop zone
   - Drop zone border transitions to primary/50, background brightens
   - On drop: file is validated (format, size, duration), then upload begins
   - Drop zone updates to show file name, size, and upload progress

2. **Click to browse file picker**
   - User clicks "Browse Files" button inside drop zone
   - Native file picker opens, filtered to video formats (.mp4, .mov, .mkv)
   - On file selection: same validation and upload flow as drag-and-drop

3. **Upload progress feedback**
   - Progress bar fills with neural-gradient (purple)
   - File name and percentage displayed
   - On completion: progress bar turns green, CTA button becomes enabled

4. **Validation errors**
   - Wrong format: "Unsupported format. Please upload .mp4, .mov, or .mkv"
   - File too large: "File exceeds maximum size limit"
   - File too long: "Video exceeds maximum duration" (if applicable)
   - Error displayed inline within drop zone, red border accent

5. **"Analyze Video" button behavior after upload**
   - Disabled until upload is complete
   - On click: submits video_url to RunPod endpoint (POST /run)
   - Navigates to Processing screen with job_id in state
   - Button shows loading state during submission

## States

| State | Drop Zone | CTA Button | Cost Panel | Description |
|---|---|---|---|---|
| Empty | Dashed border, icon + prompt | Disabled (grey) | Shows default cost | No file selected |
| File Selected | Shows file preview/name | Disabled (uploading) | Shows cost | File chosen, upload in progress |
| Uploading | Progress bar visible | Disabled (uploading) | Shows cost | Upload in progress |
| Upload Complete | Green checkmark, file info | Enabled (neural-gradient) | Shows cost | Ready to analyze |
| Error | Red border, error message | Disabled | Shows cost | Validation or upload failed |

## Data Requirements

| UI Field | Source | Tag | Notes |
|---|---|---|---|
| video_url | InputSchema.video_url | real | HTTP(S) URL sent to RunPod endpoint |
| file name | File metadata (File.name) | real | From browser File API on upload |
| file size | File metadata (File.size) | real | From browser File API on upload |
| video duration | File metadata (extracted) | real | Extracted from video file client-side or server-side |
| supported formats | Static config | real | .mp4, .mov, .mkv — hardcoded in validation |
| credit cost | Static placeholder | aspirational | No billing/credit system exists yet; show static "10 credits" |
| credits balance | Static placeholder | aspirational | No user account or credit system; show static "450" |
| plan name | Static placeholder | aspirational | No subscription system; show static "Pro Plan" |
| "Turbo Processing" stat | Marketing copy | aspirational | No multi-GPU acceleration feature exists |
| "Visual Similarity Engine" stat | Marketing copy | aspirational | Does not reflect actual TRIBE v2 capabilities |
| "Encrypted Transit" stat | Marketing copy | aspirational | No encryption/purge infrastructure exists yet |
| upload progress % | Browser upload API | real | XMLHttpRequest or fetch progress events |

## Deferred

The following elements appear in one or both Stitch variants but are excluded from the canonical v1 spec:

- **A/B Dual Drop Zones** (v2-deferred): Both upload_videos and upload_analysis_refined show side-by-side "Video A" / "Video B" drop zones with "Primary Channel" and "Reference Channel" labels. The inference pipeline processes single videos only. A/B comparison is deferred to v2 when multi-video inference is supported.
- **"Analyze Both Videos" CTA** (v2-deferred): Replaced with single "Analyze Video" CTA.
- **"Upload both videos to enable neural engine" helper text** (v2-deferred): Implies dual upload requirement.
- **Real-time collaboration avatars** (deferred): Not present in upload variants but noted in CONTEXT.md as deferred across all screens.
- **"Total Payload" dual-file size counter** (v2-deferred): Only relevant for A/B dual upload.
