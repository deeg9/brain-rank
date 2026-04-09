# NeuroCut -- Stitch Generation Brief

## Purpose

This document is the single input for Google Stitch to generate production-ready UI screens for NeuroCut v1. It consolidates all design specifications from 12 source files (5 canonical screen specs, 1 component catalog, 1 design token reference, 1 interaction catalog, and 3 gap analysis documents) into a self-contained generation brief.

Each screen section is self-contained and can be generated independently. All screens share the same design system tokens and shared components defined in Sections 1 and 2 below.

**Product context:** NeuroCut is a neural A/B testing tool for content creators. Users upload a video, it is processed through a brain-activation prediction model (TRIBE v2 on RunPod), and they receive per-segment neural engagement scores. The UI has 5 core screens (Upload, Processing, Results Overview, Results Detail, Dashboard) and 10 gap screens (Auth, Onboarding, Settings, Error pages, Profile).

---

## Design System

### Colors -- Surface Hierarchy

The palette uses **Tonal Layering** to create depth without borders. Each surface level creates visual separation through background shifts.

| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `surface` | `#0e0e10` | The canvas | Base page background, top bar background |
| `surface-container-lowest` | `#000000` | Recessed elements | Creates "recessed" feel when placed on `surface-container-low` |
| `surface-container-low` | `#131315` | Navigation, sidebars | Sidebar nav background, timeline track background |
| `surface-container` | `#19191c` | Primary editor/timeline area | Main content area, active nav item background |
| `surface-container-high` | `#1f1f22` | Floating/actionable elements | Card backgrounds, elevated panels, skeleton shimmer highlight |
| `surface-container-highest` | `#262528` | Most elevated elements | Secondary button fills, credit badge background, disabled CTA |
| `surface-bright` | 60% opacity + 20px backdrop blur | Glassmorphism | Glass panels (Upload cost estimate, Processing progress), active list item states |

### Colors -- Accents

| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `primary` | `#ba9eff` | Electric Purple -- main brand accent | Active nav border, CTA gradient start, primary button text-on-dark, attention track color |
| `primary-dim` | `#8455ef` | Gradient endpoint | Neural-gradient end, playhead color, CTA gradient end |
| `primary-container` | (derived from primary) | Neural chip backgrounds | Tag/chip backgrounds for AI categories |
| `on-primary-container` | (derived) | Neural chip text | Text on `primary-container` backgrounds |
| `secondary` | `#5af8fb` | Cyan/Teal -- AI processing | Stable engagement segments, input focus border, processing stage icon |
| `tertiary` | `#9bffce` | Emerald green -- success/high engagement | High engagement timeline, complete states, Upgrade button pill |
| `error` | `#ff6e84` | Crimson -- low engagement/errors | Drop-off segments, failed states, validation errors |

### Colors -- Text

| Token | Hex | Role |
|-------|-----|------|
| `on-surface` | `#f6f3f5` | Primary text -- headlines, body, active labels. NOT 100% white. |
| `on-surface-variant` | `#acaaad` | Secondary/muted text -- inactive nav, timestamps, metadata |
| `on-background` | 4% opacity shadow | Ambient shadow tint for floating menus |

### Colors -- Outline

| Token | Value | Role |
|-------|-------|------|
| `outline-variant` | 15% opacity (ghost border) | Subtle boundaries on secondary buttons, card edges when separator needed |

### Design Rules

1. **No-Line Rule:** 1px solid borders are strictly prohibited for sectioning content. Use background shifts between surface tiers. Exceptions: active nav left border (2px `primary`), input field bottom border.
2. **Glass and Gradient Rule:** Main CTAs and AI Insight cards use glassmorphism (`surface-bright` at 60% opacity with 20px backdrop blur). Neural-gradient (from `primary` to `primary-dim`) for progress bars and primary action buttons.
3. **Ghost Border Rule:** If a separator is absolutely required for accessibility, use `outline-variant` at 15% opacity.
4. **No Pure White Text:** Always use `on-surface` (`#f6f3f5`) or `on-surface-variant` (`#acaaad`). Never `#ffffff`.
5. **No Standard Blue:** Use `primary` or `secondary` for links and actions, never standard blue.

### Neural-Gradient

- **Definition:** `linear-gradient(primary, primary-dim)` = `linear-gradient(#ba9eff, #8455ef)`
- **Used for:** Progress bar fills, CTA button backgrounds, energy flow visual motif
- **Screens:** Upload (CTA, upload progress), Processing (job progress bar), Sidebar (New Analysis CTA)

### Typography

| Token | Font | Role |
|-------|------|------|
| `font-display` | Space Grotesk | Technical Editorial -- display and headlines, numerical data readouts |
| `font-body` | Inter | Workhorse -- body text, labels, descriptions, timestamps |
| `font-mono` | (system monospace) | Inference log panel timestamps and messages |

| Token | Role | Usage |
|-------|------|-------|
| `display-lg` | Hero metrics | Large score values in metric cards ("78", "84") |
| `headline-lg` | Major titles | Page titles ("Upload Analysis", "Analysis History") |
| `headline-sm` | Section headers | Panel headers, card group labels |
| `body-md` | Descriptions | Body text, recommendations, supporting paragraphs |
| `body-sm` | Compact information | Dense data labels, card subtitles |
| `label-sm` | Timestamps, metadata | Log timestamps, timeline time markers, small metadata |

**Typography Rules:**
- **Leaps of Scale:** Never use two font sizes only 2px apart. Create hierarchy through deliberate jumps.
- **Numerical Data:** Use `font-display` (Space Grotesk) for all scores, percentages, timestamps in metric cards.
- **High-Density:** Use `body-sm` and `label-sm` for maximum data density.

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `sidebar-width` | 256px (w-64) | Fixed sidebar nav width |
| `content-max-width-wide` | max-w-7xl | Upload screen main content |
| `content-max-width-narrow` | max-w-4xl | Processing screen centered content |
| `grid-columns` | 12 | Results screens column grid |
| `card-padding-sm` | 16px | Compact card internal padding |
| `card-padding-md` | 24px | Standard card internal padding |
| `section-gap` | 16-24px | Vertical gaps between major sections |

**Cards and Lists Rule:** No divider lines between list items. Use `card-padding-sm` or `card-padding-md` vertical padding and subtle background shifts.

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 2px | Neural chips/tags -- technical feel |
| `rounded-md` | 6px | Internal UI elements, small buttons |
| `rounded-lg` | 8px | Standard buttons, progress bars, most interactive elements |
| `rounded-xl` | 12px | Video preview, glass panels, cards, drop zones |
| `rounded-full` | 9999px | Status badge pills, credit pills |

### Elevation

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-ambient` | 32px blur, 0px offset, `on-background` at 4% opacity | Floating menus, elevated panels |
| `shadow-glow` | Neural-gradient tint with blur | Active progress bar, CTA hover state |

**No Heavy Shadows.** Rely on tonal shifts between surface tiers. Only floating menus use `shadow-ambient`.

### Semantic Mappings

**Timeline Engagement Colors:**
- High engagement: `tertiary` (`#9bffce`) when `activation_score > 0.7`
- Stable engagement: `secondary` (`#5af8fb`) when `activation_score 0.4-0.7`
- Drop-off: `error` (`#ff6e84`) when `activation_score < 0.4`

**Brain Region Track Colors:**
- Attention: `primary` (`#ba9eff`)
- Reward: `tertiary` (`#9bffce`)
- Emotional Processing: `secondary` (`#5af8fb`)
- Social Cognition: `on-surface-variant` (`#acaaad`, muted)

**Status Semantic Colors:**
- Success / Complete: `tertiary`
- Processing / Active: `secondary`
- Warning / Queued: `outline-variant` (muted)
- Error / Failed: `error`
- Brand / Primary: `primary`

**Input Fields:**
- Background: `surface-container-low`
- Border: Bottom-only 1px (exception to No-Line Rule)
- Focus: Bottom border illuminates to `secondary`
- No traditional box borders

**Active Navigation Item:**
- Left border: 2px solid `primary`
- Background: `surface-container`
- Icon: Filled variant
- Text: Bold, `on-surface`

---

## Shared Components

Components that appear on 2+ screens. Reference these by name in screen sections below.

### 1. Sidebar Nav

Fixed left navigation, 256px wide, `surface-container-low` background. Appears on all screens within the main app shell (not on Auth or Error pages).

- **Items:** Upload, Processing, Results, Dashboard
- **Footer:** "New Analysis" CTA (neural-gradient), Settings link, Support link, user profile card
- **Active state:** Left 2px border `primary`, `surface-container` background, filled icon, bold `on-surface` text
- **Inactive state:** `on-surface-variant` text, unfilled icon, hover brightens toward `on-surface`

### 2. Top Bar

Full-width horizontal bar above content (minus sidebar width). `surface` background.

- **Default variant** (Upload, Processing): Logo left; credits display + plan badge + Upgrade (`tertiary` pill) + notification bell + avatar right
- **Results variant** (Overview): Back arrow + video title left; search input + notification + avatar right
- **Detail variant** (Detail): Back arrow + video title left; Export JSON/CSV buttons + share button right
- **Dashboard variant**: Search input ("Search analyses...") left-center; credit badge (bolt icon, `surface-container-highest` bg) + notification + avatar right

### 3. Video Player Placeholder

Non-functional video area with dark `surface` background, centered play icon, optional thumbnail. `rounded-xl`.

- **Standard** (Overview): `col-span-8`, 16:9 aspect ratio
- **Full-width** (Detail): `col-span-12`, 16:9, enhanced HUD (timestamp, controls, fullscreen, "NEURAL SYNC: ACTIVE" label)

### 4. Neural Activation Timeline

Color-coded waveform showing activation scores over time.

- **Single-track** (Overview): One combined waveform, full width. Color-coded by engagement level. Includes playhead, hook zone marker at ~5s, time markers, hover tooltips.
- **Multi-track** (Detail): 4 parallel tracks per brain region. Same time axis. Collapsible. Shared playhead.
- **Track background:** `surface-container-low`. Playhead: `primary-dim`. Time markers: `label-sm` `on-surface-variant`.

### 5. Summary Metric Cards

Compact metric cards. `surface-container-high` background. Score values in `font-display` `headline-lg`. Labels in `font-body` `label-sm` `on-surface-variant`.

- **Results variant:** 5 cards stacked in `col-span-4` (Overall, Hook, Retention, Peak Moment, Engagement IQ)
- **Dashboard variant:** 3 cards horizontal row (Total Analyses, Credits Remaining, Average Score)
- **States:** Default, Loading (skeleton shimmer), Unavailable ("Coming Soon" grayed)

### 6. Glass Panel

`surface-bright` at 60% opacity, 20px backdrop blur. `rounded-xl`. Ghost border if needed.

- **Cost Estimate** (Upload): Token icon, credit cost, "Analyze Video" CTA, fine print
- **Progress Container** (Processing): Progress bar, stage checklist, filename, percentage. Primary accent bar on left edge.

### 7. Progress Bar (Neural-Gradient)

`neural-gradient` fill (primary to primary-dim). Track: `surface-container-low`. `rounded-lg`. Shadow glow on active fill.

- **States:** Uploading, Queued (indeterminate pulse), Processing (determinate), Complete (`tertiary`, checkmark), Failed (`error`)

### 8. Status Badge / Pill

`rounded-full`. `label-sm` text. Color-coded per status.

- Queued: `outline-variant` border, muted text
- Processing: `primary` border
- Complete: `tertiary` background
- Failed: `error` background

### 9. Export Controls

Secondary button style: `surface-container-highest` fill, ghost border. Icon + label. Hover brightens.

- **Overview:** Single export shortcut in bottom-right
- **Detail:** JSON + CSV in top bar. Share/PDF aspirational.

### 10. Empty State

Centered icon (`headline-lg`, `on-surface-variant`) + headline (`font-display`) + description (`body-md`, `on-surface-variant`) + CTA (`neural-gradient`).

### 11. Neural-Gradient CTA Button

`neural-gradient` fill, `rounded-lg`, bold `on-surface` text, `shadow-glow` on hover, scale-on-hover.

- **Disabled:** `surface-container-highest` bg, muted text, `cursor-not-allowed`
- **Loading:** Spinner + "Submitting..." text
- **Variants:** Large (Upload, py-5, full-width max-w-md), Sidebar (compact), Inline (Dashboard header)

### 12. Skeleton Loading State

Shimmer animation. Base: `surface-container`. Highlight: `surface-container-high`. ~1.5s pulse cycle. Corners match replaced component.

---

## Screen: Upload

**Flow position:** User starts new analysis here. Entry from Dashboard or "New Analysis" CTA.

### Layout

Sidebar (256px) + main content (`content-max-width-wide` centered). Single-column content: page title + drop zone + cost panel + stats cards.

- **Page title:** "Upload Analysis" (`headline-lg`, `font-display`). Subtitle: supported formats, resolution limit (`body-md`, `on-surface-variant`).
- **Video Drop Zone:** Full-width. Dashed border `outline-variant` at 30% opacity. Radial dot-grid background texture. `rounded-xl`. Icon + "Drag video here or click to browse" + Browse Files button.
- **Cost Estimate Glass Panel:** Below drop zone. Centered layout. Token icon + "Estimated Credit Cost: 10" + "Analyze Video" CTA + fine print "Credits deducted after processing".
- **AI Engine Stats Cards:** 3-column grid below cost panel. Cards: Turbo Processing, Neural Engine, Encrypted Transit. Aspirational marketing copy.

### What to Keep

- Drag-and-drop zone with radial dot-grid background texture (from upload_analysis_refined)
- Glass panel cost summary with centered layout and large CTA button
- Neural-gradient "Analyze Video" CTA with scale-on-hover
- AI Engine Stats 3-card grid for visual weight and credibility
- Clean top bar with inline credits display
- Decorative background blur element for ambient branding

### What to Change

- Strip all A/B dual drop zones to a single video drop zone
- CTA label from "Analyze Both Videos" or "Confirm & Start Analysis" to "Analyze Video"
- Simplify glass panel from dual-file "Total Payload" to single video cost
- Update AI Engine Stats card copy to match actual capabilities (avoid false promises)

### What to Add

- **Upload network error state:** Progress bar turns `error`, message "Upload failed. Check your connection and try again." with Retry link. Drop zone retains file selection.
- **Submission error state:** Red error banner below cost panel: "Failed to start analysis. Please try again." with Retry button. Auto-dismisses after 10 seconds.
- **Disabled CTA states:** Disabled during upload (0-99%), during validation error, when insufficient credits (aspirational tooltip: "Insufficient Credits")
- **File selected state:** Drop zone shows filename, size, duration preview
- **Upload progress:** Neural-gradient progress bar within drop zone, filename + percentage
- **Validation errors:** Red border + inline messages for wrong format, file too large, file too long

### Interactions

- Drag file over drop zone: border to `primary` at 50% opacity, background brightens to `surface-container`
- Drop: validate (format, size, duration), begin upload
- Browse Files click: native file picker filtered to .mp4, .mov, .mkv
- Upload progress: neural-gradient bar advances, filename + percentage shown
- Upload complete: green accent, CTA enables
- "Analyze Video" click: loading spinner, POST /run, navigate to Processing with job_id

### Design Token References

- Drop zone: `surface-container-high` bg, `outline-variant` at 30% dashed border, `rounded-xl`
- Dragover: border shifts to `primary` at 50% opacity, bg to `surface-container`
- Progress bar: `neural-gradient` fill, `surface-container-low` track
- CTA enabled: `neural-gradient`, `on-surface` text, `shadow-glow` on hover
- CTA disabled: `surface-container-highest`, muted `on-surface-variant` text
- Error: `error` border, `error` text for validation messages
- AI Stats cards: `surface-container-high` bg, `rounded-xl`

---

## Screen: Processing

**Flow position:** After Upload submits video. Auto-redirects to Results Overview on completion.

### Layout

Sidebar (256px) + centered content (`content-max-width-narrow`). Vertically centered in viewport.

- **Page title:** "Analyzing your video..." (`headline-lg`). Status pill below title.
- **Glass Panel:** Contains progress bar (neural-gradient fill), filename, percentage, and Stage Checklist (Uploading, Analyzing Audio, Encoding Video, Predicting Brain Activation).
- **Time estimate pill:** Centered below panel. Clock icon + "Est. time remaining: ~8 min" (`tertiary`). GPU Acceleration badge below.
- **Bottom grid (3-col):** Inference Engine Logs (2-col span, monospace, glass panel) + VRAM Load Card (1-col, memory icon + "14.2 GB").

### What to Keep

- Centered progress layout with glass panel container
- Neural-gradient progress bar with shadow glow
- Stage Checklist with done/processing/waiting per-stage states
- Estimated time remaining pill with clock icon
- GPU Acceleration badge ("US-EAST-NEURAL-01") for tech credibility
- Inference Engine Logs panel (aspirational but visually strong)
- VRAM Load card for visual weight
- Decorative background blurs (`primary` + `tertiary`)

### What to Change

- Strip dual A/B progress panels to single video progress
- Title from "Analyzing your videos..." to "Analyzing your video..."
- Remove "Dual-stream video synchronization" subtitle
- Use neural-gradient only (remove secondary/cyan for Video B)
- "Neural Processing Cluster #09-F" becomes decorative subtitle, not main heading

### What to Add

- **Resume from navigation state:** "Checking job status..." spinner with skeleton shimmer for progress bar and checklist while first poll completes
- **Polling network failure:** Yellow warning banner below progress panel after 3 consecutive failed polls: "Connection interrupted. Retrying..." with animated dots. Polling continues at reduced 10s interval.
- **Invalid job_id state:** Error card replacing progress panel: "Analysis not found. It may have expired or been deleted." with "Start New Analysis" and "Back to Dashboard" CTAs.
- **Cancel/Back button disabled state:** Disabled during 1-2s completion animation to prevent navigation conflicts
- **Inference logs placeholder:** When no log data available, panel shows "Inference logs will appear here in a future update" with dimmed background, no green pulse dot
- **Completion animation:** 100% fill, `tertiary` accent, all stages "Done", auto-redirect after 1-2s delay

### Interactions

- Page loads with queued state: indeterminate progress bar, "Waiting for GPU..."
- Polling every 3-5 seconds: GET /status/{job_id}, status transitions IN_QUEUE -> IN_PROGRESS -> COMPLETED/FAILED
- Progress percentage: derived from elapsed time vs ~12 minute historical average
- Stage checklist updates at milestones: 0-10% upload, 10-30% audio, 30-70% video, 70-100% brain prediction
- Completion: green flash, checkmark, all stages done, auto-redirect to Results Overview
- Failure: `error` styling, error message, Retry button
- 30-minute timeout: warning overlay with "Keep Waiting" and "Return to Dashboard" options
- User can navigate away; job_id persists in URL/localStorage for resume

### Design Token References

- Glass panel: `surface-bright` 60% opacity, 20px backdrop blur, `rounded-xl`, `primary` accent bar left edge
- Progress bar: `neural-gradient` fill, `shadow-glow` on active, `surface-container-low` track
- Stage done: `tertiary` check_circle icon, full opacity
- Stage processing: `secondary` sync icon, animated pulse
- Stage waiting: `on-surface-variant` pending icon, 30% opacity
- Status pill: `rounded-full`, `label-sm`, color per status semantic mapping
- Time estimate: `tertiary` bold text for minutes, clock icon
- Logs panel: `font-mono`, `surface-bright` glass, green pulse dot in header

---

## Screen: Results Overview

**Flow position:** First screen after analysis completes. High-level summary before drilling into Detail.

### Layout

Sidebar (256px) + 12-column grid content area.

- **Row 1:** Video Player Placeholder (`col-span-8`) + Summary Metric Cards stack (`col-span-4`)
- **Row 2:** Neural Activation Timeline (`col-span-12`)
- **Row 3:** AI Recommendations Panel (`col-span-8`) + Export Controls (`col-span-4`)

Top bar: Back arrow + video title left, search + notification + avatar right.

### What to Keep

- 12-column grid layout with 8/4 split for video and metrics
- 5 Summary Metric Cards (Overall Score, Hook Score, Retention Score, Peak Moment, Engagement IQ)
- Full-width Neural Activation Timeline with color-coded segments
- Hover tooltips on timeline showing time range + activation score + region breakdown
- Hook zone marker at ~5s dashed vertical line
- Playhead (vertical draggable line)
- Export shortcut button in bottom-right
- Video player with 16:9 aspect ratio and HUD timestamp overlay

### What to Change

- Strip all A/B comparison layout, dual video players, "Winner" badges, comparison deltas
- Remove "Ask NeuroAI" floating button
- AI Recommendations content tagged as aspirational (placeholder suggestions)
- Engagement IQ card shows "Coming Soon" with `on-surface-variant` styling
- Remove all collaboration avatars and "Active Collaborators" sections

### What to Add

- **Loading state:** Skeleton shimmer on metric cards, skeleton bar for timeline, video thumbnail area grayed
- **Error state:** Error message card with error type and Retry button. Timeline and metrics hidden.
- **Disabled export button:** Disabled while data loading. `surface-container-highest`, muted text, `cursor-not-allowed`.
- **Disabled "View Full Analysis" button:** Disabled during loading
- **Disabled timeline interactions:** No scrubbing/clicking during skeleton state
- **Disabled metric card click:** Non-interactive during loading. Engagement IQ always non-interactive with "Coming Soon" tooltip.
- **Partial state -- timeline fails:** Metric cards render normally, timeline shows "Unable to load timeline data. Try refreshing the page." with Retry. Export disabled.
- **Partial state -- thumbnail fails:** Dark `surface` bg with broken image icon. All other components render normally.
- **"View Full Analysis" / "Deep Dive" button** to navigate to Results Detail screen

### Interactions

- Timeline hover: tooltip with time range, activation score, region breakdown (attention, reward, emotional_processing, social_cognition)
- Timeline click: seeks video player to segment start (placeholder in v1)
- Playhead drag: scrubs video position, tooltip follows
- Metric card click: scrolls to relevant timeline section (Peak Moment -> peak segment, Hook Score -> ~5s hook zone)
- Export button: opens JSON/CSV download
- Back arrow: returns to Dashboard
- "View Full Analysis" navigates to Results Detail

### Design Token References

- Video player: `surface` bg, `rounded-xl`, centered play icon overlay
- Metric cards: `surface-container-high` bg, scores in `font-display` `display-lg`, labels in `label-sm` `on-surface-variant`
- Overall Score: `primary` accent on progress bar
- Hook Score: `tertiary` accent
- Timeline: `surface-container` bg, track `surface-container-low`
- High engagement segments: `tertiary`
- Stable segments: `secondary`
- Drop-off segments: `error`
- Playhead: `primary-dim` vertical line
- Hook zone: dashed vertical line at 5s
- AI Recommendations: `surface-container-high` cards, aspirational content
- Export button: `surface-container-highest` fill, ghost border

---

## Screen: Results Detail

**Flow position:** Deep dive reached from Results Overview. Full granularity of TRIBE v2 output.

### Layout

Sidebar (256px) + 12-column grid content area.

- **Row 1:** Large Video Player Placeholder (`col-span-12`, full width, enhanced HUD)
- **Row 2:** Multi-Track Timeline (`col-span-12`) -- 4 parallel region tracks
- **Row 3:** Region Breakdown Panel (`col-span-5`) + Segment Explorer Table (`col-span-7`)
- **Row 4:** Tag Management (`col-span-12`, aspirational)

Top bar: Back arrow + video title left, Export JSON + Export CSV buttons right.

### What to Keep

- Full-width video player with enhanced HUD (timestamp, controls, fullscreen, "NEURAL SYNC: ACTIVE")
- Multi-track timeline: 4 region tracks (Attention `primary`, Reward `tertiary`, Emotional `secondary`, Social `on-surface-variant`)
- Shared vertical playhead across all tracks
- Hook zone marker at ~5s on all tracks
- Region Breakdown Panel with average + peak scores per region, progress bar visualizations
- Segment Explorer table: sortable by any column, clickable rows
- Export JSON/CSV in top bar action area
- Tag type taxonomy: Strong Hook (`tertiary`, bolt), Peak Engagement (`primary`, star), Emotional Spike (`secondary`, heart), Attention Drop (`error`, trending_down), Social Moment (`on-surface-variant`, groups)

### What to Change

- Strip all A/B comparison elements from source variants
- Remove winner banners, variant labels, comparison deltas
- Remove collaborator avatars and shared tag editing
- Tag management marked as aspirational (no tag storage API)
- Share link, PDF export, capture image all aspirational (disabled with "Coming Soon")
- Focus regions grid (Central Gaze, Motion Lock, Color Pull) removed -- requires gaze tracking data not available

### What to Add

- **Loading state:** Skeleton bars for timeline tracks, skeleton rows for segment table, export buttons disabled
- **Error state:** Error card with back button to Dashboard. All data components hidden.
- **Empty segment explorer:** "No segment data available" with psychology icon. Multi-track shows flat zero-line. Region Breakdown shows zeros. Export still functional.
- **Disabled export buttons:** Disabled during loading. Disabled during active export (spinner). Share/PDF always disabled ("Coming Soon").
- **Disabled sort headers:** Non-interactive during skeleton state
- **Disabled track collapse toggle:** Disabled during loading
- **Disabled "Add Tag" button:** Always disabled in v1 with "Coming in a future update" tooltip
- **Partial state -- some region tracks null:** Affected track shows flat line with "No data" label in `on-surface-variant`. Other tracks render normally. Region Breakdown shows "N/A" for missing region.
- **Partial state -- video fails, data loads:** Player shows error (dark bg, broken icon). All timeline, region, table components render normally.

### Interactions

- Multi-track hover: tooltip shows ALL 4 region values at that timestamp
- Timeline click: seeks video to timestamp (placeholder v1), highlights segment
- Region card click: highlights/pulses that region's track
- Segment explorer row click: seeks video + highlights timeline segment
- Track collapse/expand: details/summary toggle
- Region track filtering: click region label to filter timeline to that region only
- Export JSON: client-side download of OutputSchema as .json
- Export CSV: flattened segment data as .csv
- Column sort: ascending/descending toggle on click
- Back arrow: to Results Overview

### Design Token References

- Video player: `surface` bg, `rounded-xl`, HUD in `font-display` monospace feel
- Track backgrounds: `surface-container-low`
- Attention track: `primary`
- Reward track: `tertiary`
- Emotional track: `secondary`
- Social track: `on-surface-variant`
- Playhead: `primary-dim`
- Region Breakdown: `surface-container-high` cards, progress bars per region in region color
- Segment Explorer: alternating `surface-container` / `surface-container-low` rows, `body-sm` text, `label-sm` for time
- Tag pills: `rounded-sm`, color-coded by type, icon + label

---

## Screen: Dashboard

**Flow position:** Main landing screen. User home base. Shows job history and entry to new analysis.

### Layout

Sidebar (256px) + scrollable main content.

- **Page header:** "Analysis History" (`headline-lg`) + "Review your past neural analyses" (`body-md`, `on-surface-variant`) + "New Analysis" inline CTA
- **Quick Stats Row:** 3 metric cards (Total Analyses, Credits Remaining, Average Score) in horizontal grid
- **Job History Grid:** 2-column responsive grid (`grid-cols-1 xl:grid-cols-2`) of Job Cards

Top bar: Search input ("Search analyses...") + credit badge (bolt icon) + notification + avatar.

### What to Keep

- Bento grid card layout for job history (from dashboard_history) -- more visual, better for thumbnails
- Visual card design with thumbnail area, filename, date, score bar, status badge
- "View Results" button on completed job cards
- Search input in top bar for filtering analyses by filename
- Credit display in top bar (compact badge)
- "New Analysis" CTA in both sidebar footer and page header
- Empty State with large icon, "No analyses yet" headline, gradient CTA

### What to Change

- Strip dual-thumbnail A/B cards to single video per card
- Drop Grid/List toggle (grid-only for v1)
- Drop floating credit widget (credits belong in top bar)
- Drop Neural Processing Load chart (no real GPU telemetry)
- Drop System Nodes panel (aspirational, no real data)
- Drop footer bar (engine version, API status)

### What to Add

- **Loading state:** 4 skeleton cards with pulse animation, skeleton stat cards
- **Error state:** Error banner at top: "Failed to load analyses. Retry?" with Retry button
- **Job card status variants:** Completed (`tertiary` badge, score bar, "View Results"), Processing (`secondary` badge, spinner, progress bar), Failed (`error` badge, "Retry")
- **Disabled "View Results":** Shows "Processing..." for in-progress jobs
- **Disabled search:** During initial skeleton loading. Enabled once job list loads.
- **Disabled sort controls:** During loading. Disabled with 0-1 jobs.
- **Partial -- thumbnails fail:** Gradient placeholder (neural-gradient) instead of thumbnail. Other card content renders normally.
- **Partial -- credits API fails:** Total Analyses and Average Score render, Credits shows "Unavailable" with retry icon.
- **Empty state:** Quick Stats row hidden. Large psychology icon + "No analyses yet" + description + "New Analysis" CTA.

### Interactions

- "New Analysis" click: navigates to Upload, clears any previous upload state
- Job card click / "View Results": navigates to Results Overview for that job
- Job card hover: border shifts to `primary` at 30% opacity, pointer cursor
- Search: client-side filtering by filename substring as user types
- Sort: by date (default, newest first), score, status
- Pagination: "Load More" button or infinite scroll

### Design Token References

- Job cards: `surface-container-high` bg, `rounded-xl`, thumbnail area `rounded-xl` with object-cover
- Score bar: `neural-gradient` fill on `surface-container-low` track, score in `font-display`
- Status badges: `rounded-full`, `label-sm`, color per status
- Card hover: border to `primary` at 30% opacity
- Quick Stats: `surface-container-low` card bg, value in `font-display` `headline-lg`
- Credit badge (top bar): `surface-container-highest` bg, bolt icon, `rounded-full`
- Empty state: psychology icon in `on-surface-variant`, headline in `font-display`, CTA in `neural-gradient`

---

## Screen: Auth / Login

**Flow position:** Entry point for returning users. Outside main app shell (no sidebar).

### Layout

Centered card on `surface` background. No sidebar. Card max-width 420px, vertically and horizontally centered.

- NeuroCut logo + wordmark above card
- AuthCard: `surface-container-high` bg, `rounded-xl`, `card-padding-md`
- Title: "Welcome back" (`headline-lg`, `font-display`)
- Subtitle: "Sign in to your account" (`body-md`, `on-surface-variant`)
- Email input + Password input (bottom-border style, `surface-container-low` bg, focus to `secondary`)
- "Forgot password?" link (`primary` color)
- "Sign In" CTA (`neural-gradient`, full-width)
- "Don't have an account? Sign up" (`on-surface-variant` + `primary` link)

### What to Keep

- N/A (new screen, no existing Stitch output)

### What to Change

- N/A (new screen)

### What to Add

- **Loading state:** After submit, CTA shows spinner + "Signing in...". Inputs become read-only. Card shows 0.9 opacity.
- **Error -- invalid credentials:** Red message below password: "Invalid email or password" in `error` color. Both inputs gain `error` bottom border. Clears on edit.
- **Error -- account locked:** "Account temporarily locked. Try again in 15 minutes."
- **Error -- network:** "Unable to connect. Check your internet connection." with retry link.
- **Disabled CTA:** Disabled when email or password empty. Disabled during submission.

### Design Token References

- Background: `surface`
- Card: `surface-container-high`, `rounded-xl`, `card-padding-md`
- Inputs: `surface-container-low` bg, bottom border, focus `secondary`
- CTA: `neural-gradient` full-width
- Links: `primary` color (not blue)
- Error text: `error` color
- Title: `font-display` `headline-lg` `on-surface`
- Subtitle: `font-body` `body-md` `on-surface-variant`

---

## Screen: Auth / Sign Up

**Flow position:** New user registration. Linked from Login screen.

### Layout

Same centered card as Login, slightly taller. Max-width 420px.

- NeuroCut logo + wordmark
- AuthCard title: "Create your account" / "Start analyzing videos"
- Email input + Password input + PasswordStrengthIndicator + Confirm Password input
- Terms checkbox: "I agree to Terms"
- "Create Account" CTA (`neural-gradient`)
- "Already have an account? Sign in" link

### What to Keep

- N/A (new screen)

### What to Change

- N/A (new screen)

### What to Add

- **PasswordStrengthIndicator:** 4-segment bar below password. Weak: `error`, Fair: `on-surface-variant`, Good: `secondary`, Strong: `tertiary`. Updates in real time as user types.
- **Password match validation:** Inline error on confirm field blur: "Passwords do not match" in `error`.
- **Loading state:** CTA spinner + "Creating account...". Inputs read-only. Card 0.9 opacity.
- **Error -- email taken:** "An account with this email already exists. Sign in instead?" with `primary` link.
- **Error -- password too weak:** "Password must be at least 8 characters."
- **Error -- terms:** "You must agree to the Terms of Service."
- **Disabled CTA:** Disabled when any field empty, passwords mismatch, terms unchecked.

### Design Token References

- Same as Login (AuthCard, inputs, CTA, links)
- PasswordStrengthIndicator segments: `error` / `on-surface-variant` / `secondary` / `tertiary`
- Checkbox: `primary` when checked

---

## Screen: Auth / Forgot Password

**Flow position:** Password reset flow. Linked from Login.

### Layout

Same centered card, minimal content. Transitions to confirmation state after submission.

- **Form state:** Title "Reset your password", email input, "Send Reset Link" CTA, "Back to Sign In" link
- **Confirmation state:** Checkmark icon (`tertiary`), "Check your email" headline, "We sent a reset link to user@example.com", "Resend email" link, "Back to Sign In" link

### What to Keep

- N/A (new screen)

### What to Change

- N/A (new screen)

### What to Add

- **ConfirmationMessage component:** Checkmark icon in `tertiary`, headline in `font-display`, description echoing submitted email, "Resend email" action link.
- **Transition animation:** 300ms fade-out form, 300ms fade-in confirmation.
- **Loading state:** CTA spinner during submit. Email read-only.
- **Error -- email not found:** "No account found with this email address."
- **Error -- rate limited:** "Reset link already sent. Check your email or wait 5 minutes to resend."
- **Disabled CTA:** Disabled when email empty or invalid format.
- **Disabled resend:** 60-second cooldown. Shows "Resend in 45s" countdown.

### Design Token References

- Same AuthCard pattern as Login/Sign Up
- Confirmation checkmark: `tertiary` color, `headline-lg` size
- "Resend email": `primary` color link

---

## Screen: Onboarding / Welcome

**Flow position:** First-run after signup. Introduces NeuroCut and guides to first analysis.

### Layout

Full-width, no sidebar (not yet in main app shell). Single-column centered.

- NeuroCut logo top-left. "Skip" link top-right (`on-surface-variant`).
- HeroIllustrationPlaceholder: Large centered area (16:9, max-width 600px, `surface-container` bg) with brain/video icon.
- "Welcome to NeuroCut" (`headline-lg`, `font-display`)
- Description copy (`body-md`, `on-surface-variant`)
- "Upload Your First Video" CTA (`neural-gradient`, large variant)
- StepIndicator dots: `primary` for current, `on-surface-variant` for others

### What to Keep

- N/A (new screen)

### What to Change

- N/A (new screen)

### What to Add

- **Entrance animation:** Logo immediate, illustration fade-in, copy + CTA staggered 200ms per element.
- **Skip link navigates to Dashboard**
- **CTA navigates to Upload**
- All content is static, no loading state needed.

### Design Token References

- Background: `surface`
- Illustration placeholder: `surface-container` bg, `rounded-xl`
- Headline: `font-display` `headline-lg` `on-surface`
- Description: `font-body` `body-md` `on-surface-variant`
- CTA: `neural-gradient`, large variant
- Skip link: `on-surface-variant`
- Step dots: `primary` (active), `on-surface-variant` (inactive)

---

## Screen: Settings / Account

**Flow position:** Accessed from Settings link in sidebar footer. Uses standard app shell.

### Layout

Sidebar + content (max-width 640px). Three FormSections stacked vertically.

- **Profile Information:** Display Name input + Email input (read-only) + "Save Changes" button
- **Change Password:** Current Password + New Password + Confirm New Password + "Update Password" button
- **Notifications:** Toggle switches for Analysis Complete, Processing Failed, Product Updates

### What to Keep

- N/A (new screen)

### What to Change

- N/A (new screen)

### What to Add

- **FormSection component:** `surface-container` bg, `rounded-xl`, `card-padding-md`. Title in `headline-sm` `font-display`.
- **Toggle component:** On: `tertiary` track. Off: `on-surface-variant` track. Minimum 44px tap target.
- **Loading state:** Skeleton shimmer for input values. Section titles render immediately. Toggles show neutral.
- **Save in progress:** Spinner + "Saving..." on buttons. Inputs read-only.
- **Empty -- new user:** Placeholder "Enter your display name". Email from auth. Toggles default ON.
- **Error -- save failed:** Red banner below section: "Failed to save changes. Please try again." with Retry.
- **Error -- password update:** "Current password is incorrect." below Change Password section.
- **Error -- load failed:** Error card: "Unable to load settings. Please try again."
- **Disabled email:** Always read-only.
- **Disabled "Save Changes":** Disabled when no changes (dirty state detection).
- **Disabled "Update Password":** Disabled when fields empty or passwords mismatch.
- **Partial -- notifications fail:** Profile and password sections render. Notifications shows "Unable to load notification preferences" with Retry.

### Design Token References

- FormSection: `surface-container` bg, `rounded-xl`, `card-padding-md`
- Section titles: `font-display` `headline-sm`
- Inputs: `surface-container-low` bg, bottom border, focus `secondary`
- Buttons: `surface-container-highest` fill, ghost border (secondary style)
- Toggle on: `tertiary` track
- Toggle off: `on-surface-variant` track
- Error banners: `error` text

---

## Screen: Settings / Billing

**Flow position:** Sibling to Account settings. Displays plan, credits, purchase options, transactions.

### Layout

Sidebar + content. Same shell as Account settings.

- **Stats Row:** 3 metric cards (Current Plan, Credits Balance, Total Spent)
- **Purchase Credits:** 3-column grid of CreditPackageCards (100/$9.99, 500/$39.99, 1000/$69.99)
- **Transaction History:** Scrollable table (Date, Type, Amount, Running Balance)

### What to Keep

- N/A (new screen)

### What to Change

- N/A (new screen)

### What to Add

- **CreditPackageCard:** `surface-container-high` bg, `rounded-xl`. "Popular" variant has `primary` border. "Buy" button secondary style.
- **TransactionHistoryTable:** Alternating `surface-container` / `surface-container-low` rows. Sortable by date.
- **Loading:** Skeleton cards for stats, skeleton cards for packages, 4 skeleton rows for transactions.
- **Purchase loading:** Clicked "Buy" shows spinner. Confirmation dialog during payment.
- **Empty transactions:** "No transactions yet. Purchase credits to get started." Table header visible, no rows.
- **Error -- purchase failed:** Dialog: "Payment failed. Please check your payment method and try again."
- **Error -- load failed:** Error card: "Unable to load billing information. Please try again."
- **Disabled "Buy" buttons:** Disabled during any active purchase. Other packages dim, `cursor-not-allowed`.

### Design Token References

- Stats cards: same as Dashboard Quick Stats (`surface-container-low`, `font-display` values)
- Package cards: `surface-container-high`, `rounded-xl`. Popular: `primary` border.
- Transaction table: alternating `surface-container` / `surface-container-low` rows
- "Buy" button: secondary style (`surface-container-highest`, ghost border)

---

## Screen: Error / 404

**Flow position:** Unmatched route. Standalone (no sidebar).

### Layout

Centered, minimal. NeuroCut logo top-left.

- ErrorIllustrationPlaceholder: max-width 300px, 1:1 aspect, `surface-container` bg, lost/confused icon
- "404" in `display-lg` `font-display` `primary` color
- "Page not found" in `headline-lg` `font-display`
- Description: "The page you're looking for doesn't exist or has been moved." (`body-md`, `on-surface-variant`)
- "Back to Dashboard" CTA (`neural-gradient`)

### What to Keep

- N/A (new screen)

### What to Change

- N/A (new screen)

### What to Add

- Full screen spec as described above. Static content, renders immediately.

### Design Token References

- Background: `surface`
- "404" text: `font-display` `display-lg` `primary`
- Headline: `font-display` `headline-lg` `on-surface`
- Description: `font-body` `body-md` `on-surface-variant`
- CTA: `neural-gradient`, centered
- Illustration: `surface-container` bg, `rounded-xl`

---

## Screen: Error / 500

**Flow position:** Unhandled server error. Standalone.

### Layout

Same centered pattern as 404.

- ErrorIllustrationPlaceholder with broken/error icon
- "Something went wrong" (`headline-lg`)
- "We hit an unexpected error. Our team has been notified." (`body-md`, `on-surface-variant`)
- "Try Again" CTA (`neural-gradient`)
- "Back to Dashboard" text link (`on-surface-variant`)

### What to Keep

- N/A (new screen)

### What to Change

- N/A (new screen)

### What to Add

- **Retry logic:** "Try Again" shows loading spinner. After 3 consecutive failures, button text changes to "Contact Support" with link.
- Full screen spec as described above.

### Design Token References

- Same pattern as 404
- Headline: `font-display` `headline-lg` `on-surface`
- CTA: `neural-gradient`
- Secondary link: `on-surface-variant`

---

## Screen: Error / Offline

**Flow position:** Network loss detected. Standalone.

### Layout

Same centered pattern as other error pages.

- ErrorIllustrationPlaceholder with disconnected/wifi-off icon
- "You're offline" (`headline-lg`)
- "Check your internet connection. We'll reconnect automatically when you're back online." (`body-md`, `on-surface-variant`)
- ConnectionStatusIndicator: checking (spinner, `on-surface-variant`), offline (red dot, `error`), reconnecting (pulsing `secondary` dot), online (`tertiary` dot, auto-redirect)
- "Retry Now" button (secondary style)

### What to Keep

- N/A (new screen)

### What to Change

- N/A (new screen)

### What to Add

- **ConnectionStatusIndicator:** Live status with checking/offline/reconnecting/online states
- **Auto-retry:** Browser `online` event triggers reconnection. "Reconnected" message with `tertiary` checkmark, auto-redirect to previous page.
- **Manual retry:** "Retry Now" triggers connection check with spinner.

### Design Token References

- Checking: spinner + `on-surface-variant` text
- Offline: `error` dot + text
- Reconnecting: `secondary` pulsing dot
- Online: `tertiary` dot + checkmark
- "Retry Now": secondary button (`surface-container-highest`, ghost border)

---

## Screen: Profile

**Flow position:** Accessed from avatar click or sidebar footer. Uses standard app shell. Low priority.

### Layout

Sidebar + content (max-width 640px).

- **Profile Card:** Large avatar placeholder (96px circle, `surface-container-high`), display name, email, "Member since" date, "Edit Profile" button
- **Analysis Stats Row:** 3 metric cards (Total Analyses, Average Score, Best Score)
- **Recent Activity:** List of recent analyses (date + filename + score) in `surface-container` card

### What to Keep

- N/A (new screen)

### What to Change

- N/A (new screen)

### What to Add

- **AvatarUpload:** 96px circle, `surface-container-high` bg, person icon default. Hover: camera overlay for upload.
- **Loading:** Avatar shows generic icon. Name/email show skeleton bars. Stats shimmer. Activity shows 3 skeleton rows.
- **Empty -- no analyses:** Stats show 0/"--"/"--". Activity: "No analyses yet. Upload your first video..." with "New Analysis" link.
- **Error -- profile fails:** Error card: "Unable to load profile. Please try again."
- **Error -- stats fail, profile loads:** Avatar/name/email render. Stats show "Unavailable" with retry icon.
- **Disabled activity item:** `cursor-default` for failed jobs. Tooltip: "Analysis failed -- no results available."

### Design Token References

- Avatar: `surface-container-high` bg, `rounded-full`, `on-surface-variant` icon
- Name: `font-display` `headline-sm` `on-surface`
- Email/date: `font-body` `body-sm` `on-surface-variant`
- Stats: same horizontal card pattern as Dashboard
- Activity: `surface-container` card bg, `rounded-xl`, `body-sm` text

---

## States

Per-screen state summary covering loading, empty, error, and disabled states.

| Screen | Loading | Empty | Error | Key Disabled Elements |
|--------|---------|-------|-------|-----------------------|
| **Upload** | Static content, no fetch needed (future: skeleton for credit balance) | Default = no file (dashed drop zone) | Validation inline (red border), upload network error (retry), submission error (banner) | CTA disabled until upload complete; disabled during upload/error |
| **Processing** | Queued = indeterminate pulse; resume = "Checking job status..." skeleton | N/A | Job failed (red, Retry), poll failure (yellow warning), invalid job_id (error card) | Cancel disabled during completion animation |
| **Results Overview** | Skeleton cards + timeline bar + grayed thumbnail | Redirect to Dashboard (should not occur) | Error card with Retry. Timeline/metrics hidden. | Export, "View Full Analysis", timeline interactions, metric clicks all disabled during loading. Engagement IQ always disabled. |
| **Results Detail** | Skeleton bars for tracks, skeleton rows for table | "No segment data available" with icon | Error card, back to Dashboard | Export during loading/export. Share/PDF always ("Coming Soon"). Sort, collapse, "Add Tag" during loading. |
| **Dashboard** | 4 skeleton cards + skeleton stats | Empty State: icon + "No analyses yet" + CTA. Stats row hidden. | Error banner with Retry | "View Results" disabled for processing jobs. Search/sort disabled during loading. |
| **Auth / Login** | Spinner on CTA, inputs read-only, 0.9 opacity | N/A | Invalid credentials, locked, network, rate limit -- inline below fields | CTA disabled when fields empty or submitting |
| **Auth / Sign Up** | Spinner on CTA, inputs read-only | N/A | Email taken, weak password, mismatch, terms, network | CTA disabled when validation fails or submitting |
| **Auth / Forgot** | Spinner on CTA, fade transition | N/A | Email not found, rate limited, network | CTA disabled when email empty/invalid. Resend disabled 60s cooldown. |
| **Onboarding** | Staggered fade-in entrance | N/A | N/A | N/A |
| **Settings / Account** | Skeleton inputs, neutral toggles | Placeholder display name | Save/password errors, load error | Email read-only. Save disabled without changes. Password disabled when empty/mismatch. |
| **Settings / Billing** | Skeleton cards and rows | "No transactions yet" | Purchase failed dialog, load error | "Buy" disabled during active purchase |
| **Error / 404** | N/A (static) | N/A | IS the error state | N/A |
| **Error / 500** | N/A (static) | N/A | IS the error state | "Try Again" becomes "Contact Support" after 3 failures |
| **Error / Offline** | N/A (cached) | N/A | IS the error state | N/A |
| **Profile** | Skeleton avatar/name/stats/activity | 0/--/-- stats, "No analyses yet" activity | Profile error, stats error (partial) | Activity items disabled for failed jobs |

---

## Responsive

### Breakpoints

| Breakpoint | Range | Columns | Input | Layout Strategy |
|------------|-------|---------|-------|-----------------|
| **Mobile** | 320px - 767px | 1 | Touch-first | Single column, stacked, bottom tab bar |
| **Tablet** | 768px - 1023px | 2-8 | Touch + pointer | Flexible columns, collapsible sidebar drawer |
| **Desktop** | 1024px+ | 12 | Pointer-first | Multi-column, persistent sidebar (canonical spec) |

### Global Navigation Adaptation

**Sidebar Nav:**
- Desktop: Fixed 256px, always visible
- Tablet: Collapsible drawer (hamburger in top bar). Slides from left, 256px, scrim overlay.
- Mobile: Replaced entirely by bottom tab bar (56px, 4 icon-only tabs, `surface-container-low` bg). Active: `primary`. "New Analysis" as FAB or prominent tab. Settings/Support in "More" menu.

**Top Bar:**
- Desktop: Full elements visible
- Tablet: Hamburger added. Credits collapse to icon-only. Search collapses to icon.
- Mobile: Compact 48px. Left: hamburger/back. Center: truncated title (20 chars + ellipsis). Right: 2 icons max.

### Per-Screen Mobile Adaptations

| Screen | Key Mobile Changes |
|--------|--------------------|
| **Upload** | Drop zone full-width 12px padding. "Tap to select video" replaces drag text. AI Stats 1-col stack. Cost panel full-width. CTA full-width 100%. |
| **Processing** | Glass panel full-width 12px padding. Stage labels compact (icon + name only). Logs full-width, max-height 150px with "Show More". VRAM stacks below logs. |
| **Results Overview** | Video player edge-to-edge. Metric cards: 140px-wide horizontal scroll strip with snap. Timeline: horizontal scroll, pinch-to-zoom, tap-for-tooltip. Recommendations + export stack below. |
| **Results Detail** | Video edge-to-edge. Multi-track: accordion (1 track visible, swipe between). Region panel: 2x2 mini-cards. Segment explorer: card view instead of table. Export in overflow menu (bottom sheet). |
| **Dashboard** | Stats: horizontal scroll strip. Job grid: 1-col. Cards compact (~200px height). Search behind icon (expands to overlay). "New Analysis" as FAB (56px, `neural-gradient`, `shadow-ambient`). |
| **Auth screens** | Card full-width 16px padding, top-third alignment (keyboard concern). Inputs 48px min height. |
| **Onboarding** | Illustration edge-to-edge. CTA full-width. "Skip" 44px tap target. Text sizes reduce. |
| **Settings** | FormSections full-width, standalone cards. Buttons full-width. Toggles 44px height. |
| **Billing** | Package cards 1-col stack. Transaction table becomes card view. Stats horizontal scroll. |
| **Error pages** | Illustration max 200px. CTA full-width. Headline to `headline-sm`. |
| **Profile** | Avatar centered 80px. Stats stack or scroll. Activity compact rows 44px height. |

### Global Touch and Accessibility Rules

1. Minimum tap target: 44px x 44px (Apple HIG)
2. Hover tooltips become tap-to-show, tap-elsewhere-to-dismiss on touch
3. Vertical scroll for page, horizontal only for contained elements (stats, timeline)
4. Keyboard avoidance: scroll to keep active input above virtual keyboard
5. Portrait + landscape support on all screens
6. Respect device safe areas (iOS notch, home indicator)
7. Honor `prefers-reduced-motion`: replace animations with instant state changes
8. Logical tab order at all breakpoints; skip-to-content for keyboard nav

---

## Generation Notes

### Priority Order

Generate screens in this order for optimal workflow (core screens first, then gap screens):

1. **Upload** -- Entry point, establishes drop zone and CTA patterns
2. **Processing** -- Follows Upload flow, establishes progress and status patterns
3. **Results Overview** -- Primary data display, establishes timeline and metric card patterns
4. **Results Detail** -- Deep dive, builds on timeline and adds multi-track + table patterns
5. **Dashboard** -- Landing page, reuses metric cards and status badges
6. **Auth / Login** -- Establishes AuthCard pattern for all auth screens
7. **Auth / Sign Up** -- Extends Login with strength indicator
8. **Auth / Forgot Password** -- Extends Login with confirmation state
9. **Error / 404** -- Establishes error page pattern
10. **Error / 500** -- Reuses error pattern with retry
11. **Error / Offline** -- Reuses error pattern with connection indicator
12. **Onboarding / Welcome** -- Standalone welcome flow
13. **Settings / Account** -- Establishes FormSection pattern
14. **Settings / Billing** -- Extends settings with package cards and transaction table
15. **Profile** -- Combines patterns from Dashboard and Settings

### Cross-Screen Consistency

- **Sidebar Nav** appears identically on all 5 core screens + Settings + Profile. Only the active item changes.
- **Top Bar** appears on all screens within the app shell. Variant changes per screen but structure is consistent.
- **Design tokens** must be used consistently. Never introduce new hex values -- reference token names.
- **Neural-gradient** (primary to primary-dim) is the signature visual motif. Use consistently for CTAs, progress bars, and brand accent elements.
- **Surface hierarchy** creates all depth. No heavy shadows except `shadow-ambient` on floating menus.
- **Status colors** are semantic and consistent: `tertiary` = success, `secondary` = processing, `error` = failure, `primary` = brand.
- **Typography pairing:** `font-display` (Space Grotesk) for all numerical data and headlines. `font-body` (Inter) for everything else.
- **Skeleton loading** pattern is consistent: `surface-container` base, `surface-container-high` highlight, ~1.5s pulse cycle, corners match replaced component.
- **Auth screens** share the same AuthCard centered pattern without sidebar.
- **Error screens** share the same centered pattern with illustration placeholder without sidebar.
