# Shared Component Catalog

Single-source-of-truth reference for every reusable UI component across NeuroCut's 5 canonical screens. Components reference design tokens by name -- see [design-tokens.md](design-tokens.md) for exact values.

---

## Shared Components

Components that appear on 2 or more screens. Each entry defines props, variants, states, and usage locations.

---

### 1. Sidebar Nav

Primary navigation element, fixed on the left side of every screen.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `items` | `NavItem[]` | Yes | Array of navigation items (Upload, Processing, Results, Dashboard) |
| `activeRoute` | `string` | Yes | Currently active route identifier |

**NavItem type:** `{ icon: string, label: string, href: string }`

**Variants:**

- **Default:** 4 nav items (Upload, Processing, Results, Dashboard) with footer section containing Settings, Support, user profile card, and "New Analysis" CTA button

**States:**

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Active item | Left border accent (2px, `primary`), `surface-container` background, filled icon, bold text | Route matches item href |
| Inactive item | `on-surface-variant` text color, unfilled icon | Route does not match |
| Hover (inactive) | Text brightens toward `on-surface` | Mouse enter on inactive item |

**Usage Locations:**

| Screen | Differences |
|--------|------------|
| Upload (01) | Upload item active |
| Processing (02) | Processing item active |
| Results Overview (03) | Results item active; footer includes user profile card |
| Results Detail (04) | Results item active (same as Overview) |
| Dashboard (05) | Dashboard item active; NeuroCut branding logo at top |

**Styling:** Width 256px (w-64). Background `surface-container-low`. "New Analysis" CTA uses `neural-gradient` fill. Footer links (Settings, Support) in `on-surface-variant`.

---

### 2. Top Bar

Horizontal bar spanning full width minus sidebar, positioned at the top of every screen.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `credits` | `number` | No | Credits balance (aspirational) |
| `planName` | `string` | No | Subscription plan name (aspirational) |
| `notifications` | `number` | No | Unread notification count |
| `videoTitle` | `string` | No | Current video filename (Results screens) |
| `searchPlaceholder` | `string` | No | Search input placeholder text (Dashboard) |
| `showBackArrow` | `boolean` | No | Whether to show back navigation |
| `backTarget` | `string` | No | Navigation target for back arrow |
| `rightActions` | `ReactNode` | No | Custom right-side action buttons |

**Variants:**

- **Default (Upload, Processing):** Logo left, credits display + plan badge + Upgrade button + notification bell + avatar right
- **Results Overview:** Back arrow + video title left; search input + notification icon + avatar right
- **Results Detail:** Back arrow + video title left; Export JSON/CSV buttons + share button right
- **Dashboard:** Search input left-center; credit badge + notification icon + avatar right

**States:**

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Default | Standard layout | Page load |
| Notification badge visible | Red dot on bell icon | `notifications > 0` |

**Usage Locations:**

| Screen | Variant | Key Differences |
|--------|---------|-----------------|
| Upload (01) | Default | Credits inline, plan badge, Upgrade pill (`tertiary`) |
| Processing (02) | Default | Same as Upload |
| Results Overview (03) | Results | Back arrow to Dashboard, video title, search input |
| Results Detail (04) | Results (modified) | Back arrow to Overview, JSON/CSV export buttons |
| Dashboard (05) | Dashboard | Search input with "Search analyses..." placeholder, credit badge with bolt icon |

**Styling:** Background `surface`. Text `on-surface`. Credit badge uses `surface-container-highest` background. Upgrade button uses `tertiary` pill styling.

---

### 3. Video Player Placeholder

Non-functional video player area showing a thumbnail or dark surface with play icon overlay.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `thumbnailUrl` | `string` | No | Video thumbnail image URL |
| `duration` | `float` | Yes | Video duration in seconds (from OutputSchema.duration_seconds) |
| `currentSegmentIndex` | `number` | No | Currently highlighted segment (Detail only) |

**Variants:**

- **Standard (Overview):** 60% content width (`col-span-8` in 12-col grid), 16:9 aspect ratio
- **Full-width (Detail):** 100% content width (`col-span-12`), 16:9 aspect ratio, HUD overlay with timestamp, playback controls, fullscreen toggle, "NEURAL SYNC: ACTIVE" label

**States:**

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Default | Dark `surface` background, centered play icon, optional thumbnail | Page load |
| Playing (future) | Video playback active | User clicks play (not implemented in v1) |
| Error | Broken thumbnail indicator | Image load failure |
| Synced (Detail) | Highlights current segment position | Timeline interaction |

**Usage Locations:**

| Screen | Size | Notes |
|--------|------|-------|
| Results Overview (03) | `col-span-8` (~60% width) | Standard variant, HUD shows timestamp |
| Results Detail (04) | `col-span-12` (full width) | Full-width variant with enhanced HUD |

**Styling:** Rounded `xl` (12px). Dark `surface` background. Play icon overlay centered. HUD timestamp in `Space Grotesk` monospace feel.

---

### 4. Neural Activation Timeline

Primary data visualization showing activation scores over time as a color-coded waveform.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `segments` | `Segment[]` | Yes | Array of segment objects from OutputSchema |
| `duration` | `float` | Yes | Total video duration in seconds |
| `currentTime` | `float` | No | Current playhead position |
| `expandedTracks` | `string[]` | No | Which region tracks are expanded (Detail only) |

**Variants:**

- **Single-track (Overview):** One combined waveform. X-axis = time, Y-axis = `activation_score`. Color-coded segments by engagement level. Full width (`col-span-12`). Includes playhead, hook zone marker, time markers, hover tooltips.
- **Multi-track (Detail):** Four parallel tracks (one per brain region), aligned on same time axis. Each track color-coded by region. Collapsible via toggle. Shared vertical playhead across all tracks.

**States:**

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Default | Data loaded, waveform rendered | Segments available |
| Loading | Skeleton bar with shimmer animation | Data fetching |
| Empty | Should not occur (redirect if no data) | No segments |
| Collapsed (Detail) | Tracks hidden behind toggle | User collapses section |

**Color coding (single-track):**
- High engagement: `tertiary` when `activation_score > 0.7`
- Stable engagement: `secondary` when `activation_score 0.4-0.7`
- Drop-off: `error` when `activation_score < 0.4`

**Track colors (multi-track):**
- Attention: `primary`
- Reward: `tertiary`
- Emotional Processing: `secondary`
- Social Cognition: `on-surface-variant` (muted)

**Shared elements:** Playhead (vertical draggable line), hook zone marker (dashed vertical at ~5s), time markers at regular intervals, color strip below waveform.

**Hover tooltip:** Time range, activation score, region breakdown (attention, reward, emotional_processing, social_cognition).

**Usage Locations:**

| Screen | Variant | Notes |
|--------|---------|-------|
| Results Overview (03) | Single-track | Combined activation waveform, `col-span-12` |
| Results Detail (04) | Multi-track | 4 region tracks, collapsible, `col-span-12` |

**Styling:** Background `surface-container`. Track backgrounds `surface-container-low`. Playhead uses `primary-dim`. Time markers in `label-sm` `on-surface-variant`.

---

### 5. Summary Metric Cards

Compact metric display cards showing key scores from analysis output.

**Props (per card):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Metric name |
| `value` | `string \| number` | Yes | Metric value |
| `subtitle` | `string` | No | Additional context |
| `tag` | `"real" \| "aspirational"` | Yes | Data availability indicator |
| `accentColor` | `string` | No | Token name for accent color |
| `icon` | `string` | No | Icon identifier |
| `trend` | `string` | No | Trend indicator (Dashboard) |

**Variants:**

- **Results vertical stack (Overview):** 5 cards stacked in `col-span-4`. Cards: Overall Score, Hook Score, Retention Score, Peak Moment, Engagement IQ (aspirational).
- **Dashboard horizontal row (Quick Stats):** 3 cards in horizontal row. Cards: Total Analyses, Credits Remaining (aspirational), Average Score.
- **Loading:** Skeleton shimmer animation
- **Unavailable:** Grayed out, "Coming Soon" label

**States:**

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Default | Value displayed with accent color | Data available |
| Loading | Skeleton pulse animation | Data fetching |
| Unavailable | Grayed, "Coming Soon" | Aspirational metric |

**Usage Locations:**

| Screen | Layout | Card Count | Cards |
|--------|--------|------------|-------|
| Results Overview (03) | Vertical stack, `col-span-4` | 5 | Overall, Hook, Retention, Peak Moment, Engagement IQ |
| Dashboard (05) | Horizontal row, 3-col grid | 3 | Total Analyses, Credits Remaining, Average Score |

**Styling:** Background `surface-container-high`. Score values in `Space Grotesk` `headline-lg`. Labels in `Inter` `label-sm` `on-surface-variant`. Hover shows tooltip with additional context.

---

### 6. Glass Panel

Elevated container using glassmorphism effect for important grouped content.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | Yes | Panel content |
| `variant` | `string` | No | Layout variant name |

**Variants:**

- **Cost Estimate (Upload):** Centered layout with token icon, credit cost value, "Analyze Video" CTA, fine print
- **Progress Container (Processing):** Contains single-video progress bar, stage checklist, filename, percentage

**States:**

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Default | Glass blur active, content visible | Page load |

**Usage Locations:**

| Screen | Content | Notes |
|--------|---------|-------|
| Upload (01) | Cost estimate display + "Analyze Video" CTA | Centered layout from upload_analysis_refined |
| Processing (02) | Progress bar + stage checklist + file info | Primary accent bar on left edge |

**Styling:** `surface-bright` at 60% opacity, `20px` backdrop blur. Rounded `xl` (12px). No solid borders -- uses ghost border (`outline-variant` at 15% opacity) if boundary needed.

---

### 7. Progress Bar (Neural-Gradient)

Animated progress bar with the signature purple gradient fill.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `progress` | `number` | Yes | Progress value 0-100 |
| `fileName` | `string` | No | Associated file name |
| `variant` | `"determinate" \| "indeterminate"` | No | Animation type |

**Variants:**

- **Determinate:** Fixed-width fill with percentage label, `neural-gradient` (`primary` to `primary-dim`)
- **Indeterminate:** Pulsing animation for unknown progress states (queued)

**States:**

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Uploading | Neural-gradient fill advancing | Upload in progress |
| Queued | Indeterminate pulse | Job queued, progress unknown |
| Processing | Determinate bar with percentage | Job in progress |
| Complete | 100% fill, `tertiary` accent, checkmark | Upload/job complete |
| Failed | `error` accent, error icon | Upload/job failed |

**Usage Locations:**

| Screen | Context | Notes |
|--------|---------|-------|
| Upload (01) | Upload progress within drop zone | Determinate, shows file upload % |
| Processing (02) | Job progress in glass panel | Determinate/indeterminate, neural-gradient with shadow glow |

**Styling:** Fill uses `neural-gradient` (linear-gradient from `primary` to `primary-dim`). Track background `surface-container-low`. Rounded `lg` (8px). Shadow glow on active fill.

---

### 8. Status Badge / Pill

Small badge indicating the current state of a job or process.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `string` | Yes | Status identifier |
| `label` | `string` | No | Override display text |

**Variants:**

- **Processing status pill:** Below page title on Processing screen
- **Job card badge:** Inline in job card header on Dashboard

**States:**

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Queued | `outline-variant` border, muted text, "Waiting for GPU" | Job in queue |
| Processing | `primary` border, "Neural analysis in progress" | Job running |
| Complete | `tertiary` background, "Analysis complete" | Job finished |
| Failed | `error` background, "Processing failed" | Job errored |
| Cancelled | `outline-variant`, "Cancelled" | Job cancelled |

**Usage Locations:**

| Screen | Context | Notes |
|--------|---------|-------|
| Processing (02) | Status pill below page title | Full status text |
| Dashboard (05) | Badge in job card header | Compact label (Completed/Processing/Failed) |

**Styling:** Pill-shaped (`rounded-full`). Text `label-sm`. Color-coded per status using semantic accent tokens.

---

### 9. Export Controls

Buttons for downloading analysis data in machine-readable formats.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `outputData` | `OutputSchema` | Yes | Full analysis output for export |
| `onExportJSON` | `() => void` | Yes | JSON export handler |
| `onExportCSV` | `() => void` | Yes | CSV export handler |

**Variants:**

- **Shortcut button (Overview):** Single export button in bottom-right area (`col-span-4`)
- **Full controls (Detail):** JSON and CSV buttons integrated into top bar action area, plus aspirational Share/PDF options

**States:**

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Default | Buttons enabled | Data available |
| Exporting | Brief spinner on clicked button | Export triggered |
| Done | Checkmark flash (1-2s) | Export complete |

**Usage Locations:**

| Screen | Placement | Controls |
|--------|-----------|----------|
| Results Overview (03) | Bottom-right area, `col-span-4` | Single export shortcut button |
| Results Detail (04) | Top bar right side | JSON button, CSV button (Share/PDF aspirational) |

**Styling:** Secondary button style -- `surface-container-highest` fill with ghost border. Icon + label. Hover brightens background.

---

### 10. Empty State

Placeholder shown when a list or content area has no data.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | `string` | No | Large centered icon (e.g., "psychology") |
| `headline` | `string` | Yes | Main message |
| `description` | `string` | No | Supporting text |
| `ctaLabel` | `string` | No | Action button text |
| `ctaHref` | `string` | No | Action button navigation target |

**Variants:**

- **Dashboard empty:** Large icon, "No analyses yet" headline, descriptive text, "New Analysis" CTA button with neural-gradient
- **Generic:** Reusable for any empty list/content area

**States:**

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Default | Centered icon + text + CTA | No data available |

**Usage Locations:**

| Screen | Context | Notes |
|--------|---------|-------|
| Dashboard (05) | No past analyses | "No analyses yet" + "New Analysis" CTA |
| Results (03/04) | Edge case: no data | Redirect to Dashboard (should not occur normally) |

**Styling:** Icon in `headline-lg` size, `on-surface-variant` color. Headline in `headline-lg` `Space Grotesk`. Description in `body-md` `on-surface-variant`. CTA uses `neural-gradient`.

---

### 11. Neural-Gradient CTA Button

Primary call-to-action button with the signature purple gradient background.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Button text |
| `disabled` | `boolean` | No | Whether button is disabled |
| `loading` | `boolean` | No | Whether button shows loading spinner |
| `onClick` | `() => void` | Yes | Click handler |
| `size` | `"sm" \| "md" \| "lg"` | No | Button size variant |

**Variants:**

- **Large CTA (Upload):** Full-width (max-w-md centered), `py-5`, "Analyze Video" label
- **Sidebar CTA:** Compact, fits sidebar width, "New Analysis" label
- **Inline CTA (Dashboard):** Standard button size, "New Analysis" label in page header

**States:**

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Enabled | `neural-gradient` background, bold text, scale-on-hover | Default enabled state |
| Disabled | `surface-container-highest` background, muted text, `cursor-not-allowed` | `disabled=true` (e.g., no file uploaded) |
| Loading | Spinner icon, "Submitting..." text | `loading=true` |
| Hover | Scale up slightly (transform scale) | Mouse enter on enabled button |

**Usage Locations:**

| Screen | Label | Context |
|--------|-------|---------|
| Upload (01) | "Analyze Video" | Large CTA in cost glass panel |
| Sidebar (all screens) | "New Analysis" | Footer CTA in sidebar nav |
| Dashboard (05) | "New Analysis" | Inline button in page header + empty state CTA |

**Styling:** Fill `neural-gradient` (linear-gradient from `primary` to `primary-dim`). Rounded `lg` (8px). No border. Bold text `on-surface`. Shadow glow on hover.

---

### 12. Skeleton Loading State

Placeholder animation shown while content is loading.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `variant` | `string` | Yes | Shape variant (card, bar, row, text) |
| `count` | `number` | No | Number of skeleton items to render |

**Variants:**

- **Card skeleton:** Rectangular shimmer matching card dimensions
- **Bar skeleton:** Horizontal bar matching timeline height
- **Row skeleton:** Table row shimmer for segment explorer
- **Text skeleton:** Inline text placeholder

**States:**

| State | Visual Treatment | Trigger |
|-------|-----------------|---------|
| Loading | Shimmer/pulse animation on `surface-container-high` | Data not yet available |

**Usage Locations:**

| Screen | Elements | Notes |
|--------|----------|-------|
| Results Overview (03) | Metric cards, timeline bar, video thumbnail area | Shown while OutputSchema is fetching |
| Results Detail (04) | Timeline tracks, segment table rows | Shown while computing derived data |
| Dashboard (05) | Job cards (4 placeholder cards), stat cards | Shown while job history loads |

**Styling:** Base color `surface-container`. Shimmer highlight `surface-container-high`. Pulse animation ~1.5s cycle. Rounded corners match the component being replaced.

---

## Screen-Specific Components

Components that appear on only one screen. Brief entries with references to their full definitions in the respective screen specs.

---

### Video Drop Zone
- **Screen:** Upload (01)
- **Description:** Drag-and-drop area for video file upload with dashed border, icon, browse button, and radial dot-grid background texture.
- **Full definition:** [01-upload.md](01-upload.md) -- "Video Drop Zone" section

### Cost Estimate Display
- **Screen:** Upload (01)
- **Description:** Glass panel showing estimated credit cost with token icon, cost value, and fine print about deduction timing.
- **Full definition:** [01-upload.md](01-upload.md) -- "Cost Estimate Display" section

### AI Engine Stats Cards
- **Screen:** Upload (01)
- **Description:** 3-column grid of informational cards (Turbo Processing, Neural Engine, Encrypted Transit) -- aspirational marketing copy.
- **Full definition:** [01-upload.md](01-upload.md) -- "AI Engine Stats Cards" section

### Stage Checklist
- **Screen:** Processing (02)
- **Description:** Vertical list of pipeline stages (Uploading, Analyzing Audio, Encoding Video, Predicting Brain Activation) with per-stage done/processing/waiting states.
- **Full definition:** [02-processing.md](02-processing.md) -- "Stage Checklist" section

### Inference Log Panel
- **Screen:** Processing (02)
- **Description:** Glass panel with monospace font showing timestamped log entries. Aspirational -- RunPod async mode does not expose step-by-step logs.
- **Full definition:** [02-processing.md](02-processing.md) -- "Inference Log Panel" section

### Estimated Time Remaining
- **Screen:** Processing (02)
- **Description:** Centered pill with clock icon displaying estimated minutes remaining and GPU acceleration badge.
- **Full definition:** [02-processing.md](02-processing.md) -- "Estimated Time Remaining" section

### VRAM Load Card
- **Screen:** Processing (02)
- **Description:** Small card showing VRAM usage (e.g., "14.2 GB") with memory icon. Aspirational -- no per-job VRAM metrics available.
- **Full definition:** [02-processing.md](02-processing.md) -- "VRAM Load Card" section

### AI Recommendations Panel
- **Screen:** Results Overview (03)
- **Description:** Card list of AI-generated optimization suggestions. Aspirational -- no recommendation engine exists.
- **Full definition:** [03-results-overview.md](03-results-overview.md) -- "AI Recommendations Panel" section

### Multi-Track Timeline
- **Screen:** Results Detail (04)
- **Description:** Extension of the base Neural Activation Timeline with 4 parallel region tracks (Attention, Reward, Emotional, Social). See shared component #4 for base definition.
- **Full definition:** [04-results-detail.md](04-results-detail.md) -- "Multi-Track Timeline" section

### Region Breakdown Panel
- **Screen:** Results Detail (04)
- **Description:** Summary of aggregate region performance showing average and peak scores per brain region with progress bar visualizations.
- **Full definition:** [04-results-detail.md](04-results-detail.md) -- "Region Breakdown Panel" section

### Segment Explorer Table
- **Screen:** Results Detail (04)
- **Description:** Scrollable, sortable data table showing all segments with activation, arousal, valence, and per-region scores.
- **Full definition:** [04-results-detail.md](04-results-detail.md) -- "Segment Explorer" section

### Neural Moment Tags (aspirational)
- **Screen:** Results Detail (04)
- **Description:** User-applied labels on timeline segments (Strong Hook, Peak Engagement, Emotional Spike, Attention Drop, Social Moment). No tag storage API exists.
- **Full definition:** [04-results-detail.md](04-results-detail.md) -- "Neural Moment Tags" section

### Job History Grid
- **Screen:** Dashboard (05)
- **Description:** 2-column responsive grid of Job Cards showing past analyses with thumbnails, scores, and status.
- **Full definition:** [05-dashboard.md](05-dashboard.md) -- "Job History Grid" section

### Job Card
- **Screen:** Dashboard (05)
- **Description:** Individual card in Job History Grid showing video thumbnail, filename, date, status badge, score bar, and "View Results" button.
- **Full definition:** [05-dashboard.md](05-dashboard.md) -- "Job Card" section

---

## Cross-Reference Matrix

| Component | Upload (01) | Processing (02) | Results Overview (03) | Results Detail (04) | Dashboard (05) |
|-----------|:-----------:|:----------------:|:---------------------:|:-------------------:|:--------------:|
| **Shared Components** | | | | | |
| Sidebar Nav | x | x | x | x | x |
| Top Bar | x | x | x | x | x |
| Video Player Placeholder | - | - | x | x | - |
| Neural Activation Timeline | - | - | x (single) | x (multi) | - |
| Summary Metric Cards | - | - | x (5, vertical) | - | x (3, horizontal) |
| Glass Panel | x | x | - | - | - |
| Progress Bar (Neural-Gradient) | x | x | - | - | - |
| Status Badge / Pill | - | x | - | - | x |
| Export Controls | - | - | x (shortcut) | x (full) | - |
| Empty State | - | - | - | - | x |
| Neural-Gradient CTA Button | x | - | - | - | x |
| Skeleton Loading State | - | - | x | x | x |
| **Screen-Specific** | | | | | |
| Video Drop Zone | x | - | - | - | - |
| Cost Estimate Display | x | - | - | - | - |
| AI Engine Stats Cards | x | - | - | - | - |
| Stage Checklist | - | x | - | - | - |
| Inference Log Panel | - | x | - | - | - |
| Estimated Time Remaining | - | x | - | - | - |
| VRAM Load Card | - | x | - | - | - |
| AI Recommendations Panel | - | - | x | - | - |
| Multi-Track Timeline | - | - | - | x | - |
| Region Breakdown Panel | - | - | - | x | - |
| Segment Explorer Table | - | - | - | x | - |
| Neural Moment Tags | - | - | - | x | - |
| Job History Grid | - | - | - | - | x |
| Job Card | - | - | - | - | x |
