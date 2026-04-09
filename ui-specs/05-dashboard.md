# 05 Dashboard

## Screen: Dashboard

Main landing screen showing analysis history, quick stats, and new analysis entry point. This is the user's home base after login -- a high-density overview of past analyses with a prominent CTA to start new work.

---

## Source Files

| Source File | Element | Disposition | Notes |
|-------------|---------|-------------|-------|
| dashboard_history/code.html | Bento grid card layout | **Keep** | More visual, better for video thumbnails; aligns with "Neural Architect" editorial aesthetic |
| dashboard_history/code.html | A/B dual-thumbnail cards | **Change** | Strip to single video per card (v1 is single-video only) |
| dashboard_history/code.html | Grid/List toggle buttons | **Drop** | Recommend grid-only for v1; toggle adds complexity without value |
| dashboard_history/code.html | Floating credit widget (bottom-right) | **Drop** | Credits belong in top bar or sidebar, not floating overlay |
| dashboard_history/code.html | Sidebar nav with "New Analysis" CTA | **Keep** | Consistent shared sidebar pattern |
| dashboard_job_history/code.html | Data table with columns (Name, Neural Score, Hook Score, Date) | **Change** | Cherry-pick column structure for potential list/compact view in v2 |
| dashboard_job_history/code.html | Search input in top bar | **Keep** | Useful for finding past analyses by filename |
| dashboard_job_history/code.html | Credit display in top bar (47 Credits) | **Keep** | Compact credit indicator in header is appropriate |
| dashboard_job_history/code.html | Neural Processing Load chart | **Drop** | Decorative; no real GPU telemetry data to display |
| dashboard_job_history/code.html | System Nodes panel (Vision-Alpha-9, etc.) | **Drop** | Aspirational; no real system node data |
| dashboard_job_history/code.html | Footer bar (Engine version, API Status) | **Drop** | Not needed for v1 |

---

## Layout

```
+------------------+------------------------------------------------------+
|                  |  Top Bar                                             |
|  Sidebar Nav     |  [Search...] [Credits: NN] [Notifications] [Avatar] |
|                  +------------------------------------------------------+
|  [NeuroCut]      |                                                      |
|  [Neural         |  Analysis History                          [+ New    |
|   Analytics]     |  "Review your past neural analyses"        Analysis] |
|                  |                                                      |
|  [+ New Analysis]|  Quick Stats Row                                     |
|                  |  +------------+ +------------+ +------------+        |
|  Upload          |  | Total      | | Credits    | | Avg Score  |        |
|  Processing      |  | Analyses   | | Remaining  | | (overall)  |        |
|  Results         |  +------------+ +------------+ +------------+        |
|  Dashboard (*)   |                                                      |
|                  |  Job History Grid                                     |
|                  |  +-------------------+  +-------------------+        |
|  ----------      |  | [Thumbnail]       |  | [Thumbnail]       |        |
|  Settings        |  | filename.mp4      |  | filename.mp4      |        |
|  Support         |  | Oct 24 - Score 84 |  | Oct 22 - Proc 45% |        |
|                  |  | [View Results]    |  | [Processing...]   |        |
|                  |  +-------------------+  +-------------------+        |
|                  |  +-------------------+  +-------------------+        |
|                  |  | [Thumbnail]       |  | [Thumbnail]       |        |
|                  |  | filename.mp4      |  | filename.mp4      |        |
|                  |  | Oct 18 - Score 96 |  | Oct 15 - Score 78 |        |
|                  |  | [View Results]    |  | [View Results]    |        |
|                  |  +-------------------+  +-------------------+        |
+------------------+------------------------------------------------------+
```

- **Sidebar** (left, 256px): Shared nav component, NeuroCut branding, "New Analysis" CTA button, flow links, settings/support at bottom
- **Top Bar** (full width minus sidebar): Search input, credit indicator, notification bell, user avatar
- **Main Content** (scrollable):
  - Page header with title "Analysis History" and inline "New Analysis" button
  - Quick Stats row (3 stat cards)
  - Job History grid (2-column responsive, cards)

---

## Components

### Sidebar Nav (shared)

Shared across all screens. See Upload/Processing/Results specs for full definition.

- **Props:** `activeScreen: "dashboard" | "upload" | "processing" | "results"`
- **Contains:** NeuroCut logo, "New Analysis" gradient CTA button, nav links (Upload, Processing, Results, Dashboard), settings/support links at bottom
- **Active state:** Left border accent in primary (#ba9eff), filled icon, bold text

### Top Bar (shared, dashboard variant)

- **Props:** `creditCount: number`, `searchPlaceholder: string`
- **Contains:** Search input (left), credit badge, notification icon, user avatar (right)
- **Dashboard-specific:** Search placeholder reads "Search analyses..."
- **Credit badge:** `{count} Credits` with bolt icon, pill-shaped bg on `surface-container-highest`

### Quick Stats Bar

Row of 3 stat cards in `surface-container-low` with subtle border.

| Stat | Source | Tag | Notes |
|------|--------|-----|-------|
| Total Analyses | Count of past jobs | **derived** | Requires a job store/database to persist job list |
| Credits Remaining | Billing system | **aspirational** | No billing system exists; display placeholder or hide |
| Average Score | Mean of all `Summary.overall` values | **derived** | Computed from stored job results |

- **Card props:** `label: string`, `value: string | number`, `icon: string`, `trend?: string`
- **Variants:** Default (value shown), Empty (dash or "0"), Loading (skeleton pulse)

### Job History Grid

2-column responsive grid (`grid-cols-1 xl:grid-cols-2`) of Job Cards. Cherry-picked from `dashboard_history` bento grid layout.

- **Props:** `jobs: JobSummary[]`, `isLoading: boolean`, `isEmpty: boolean`
- **Sorting:** By date (default, newest first), by score, by status
- **Pagination:** Load more button or infinite scroll for large history

### Job Card

Individual card in the Job History Grid. Based on `dashboard_history` card pattern but adapted for single-video (not A/B).

- **Props:**
  - `title: string` -- Video filename
  - `date: string` -- Analysis date
  - `status: "completed" | "processing" | "failed"`
  - `overallScore?: number` -- `Summary.overall` (only when completed)
  - `thumbnailUrl?: string` -- Video thumbnail (aspirational)
- **Layout:**
  - Header row: title + status badge
  - Subtitle: date, video format metadata
  - Single thumbnail (aspect-video, rounded) or placeholder gradient
  - Score bar: "Neural Score" label + percentage + progress bar
  - Footer: "View Results" button
- **Status variants:**
  - **Completed:** Tertiary (#9bffce) badge, score bar visible, "View Results" enabled
  - **Processing:** Secondary (#5af8fb) badge, thumbnail greyed/blurred with spinner, progress bar with percentage
  - **Failed:** Error (#ff6e84) badge, "Retry" action, no score shown
- **Interactions:** Hover lifts border to `primary/30`, click navigates to Results Overview

### Empty State

Shown when the user has zero past analyses.

- **Layout:** Centered illustration/icon, "No analyses yet" headline, descriptive text, prominent "New Analysis" CTA button
- **Design:** Large `psychology` icon or illustration, `headline-lg` text, gradient CTA matching sidebar button

### System Nodes Visualization

- **Disposition:** Aspirational (decorative)
- **Source:** `dashboard_job_history` -- "Vision-Alpha-9", "Hook-Predictor-X", etc.
- **Decision:** **Dropped for v1.** No real system telemetry data. If re-added later, would show RunPod worker status.

---

## Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Start new analysis | Click "New Analysis" button (sidebar or header) | Navigate to Upload screen |
| View analysis results | Click job card or "View Results" button | Navigate to Results Overview for that job |
| Search analyses | Type in search input | Filter job history grid by filename match |
| Sort job history | Click sort control (date, score, status) | Re-order grid cards by selected criterion |
| Delete analysis | Click delete/archive action on card (context menu) | Confirmation dialog, then remove from list |
| Paginate | Scroll to bottom or click "Load More" | Load next batch of job history cards |

---

## States

| State | Condition | Behavior |
|-------|-----------|----------|
| **Default** | User has 1+ past analyses | Show Quick Stats + populated Job History Grid |
| **Empty** | User has zero analyses | Hide Quick Stats row, show Empty State with onboarding prompt and "New Analysis" CTA |
| **Loading** | Fetching job history | Skeleton grid: 4 placeholder cards with pulse animation, skeleton stat cards |
| **Error** | Failed to load job history | Error banner at top of content area: "Failed to load analyses. Retry?" with retry button |
| **Single Processing** | One or more jobs still processing | Those cards show processing variant (spinner, progress bar), completed cards show normally |

---

## Data Requirements

| UI Field | Schema Field | Tag | Notes |
|----------|-------------|-----|-------|
| Job list | Collection of `OutputSchema` results | **derived** | Requires a persistent job store (database) to list past analyses -- does not exist yet. **Architectural dependency.** |
| Overall score | `Summary.overall` | **real** | Directly from RunPod inference output per job |
| Hook score | `Summary.hook_score` | **real** | Available in OutputSchema, could show in card or table view |
| Retention score | `Summary.retention_score` | **real** | Available in OutputSchema |
| Job status | RunPod job status | **real** | From RunPod `/status/{job_id}` polling (completed/failed/in_progress) |
| Video filename | Original upload filename | **real** | Must be stored at upload time alongside job ID |
| Video thumbnail | Generated frame from video | **aspirational** | No thumbnail generation service exists; use gradient placeholder |
| Analysis date | Job completion timestamp | **derived** | From job metadata, requires job store to persist |
| Total analyses count | Count of stored jobs | **derived** | Requires job store |
| Average score | Mean of all `Summary.overall` | **derived** | Computed client-side from job store data |
| Credits remaining | Billing/credit system | **aspirational** | No billing system; display placeholder or omit |
| Search results | Filtered job list by filename | **derived** | Client-side filtering of job store data |

**Architectural dependency:** The Dashboard requires a persistent job store (database) to list past analyses. The current RunPod endpoint is stateless -- it processes a video and returns results but does not persist them. A job persistence layer (e.g., Supabase, Postgres) is needed before this screen is functional.

---

## Deferred

The following features appear in the Stitch variants but are deferred beyond v1:

- **A/B comparison cards** -- `dashboard_history` shows dual-thumbnail A/B cards; v1 is single-video only
- **Real-time collaboration** -- Team avatars ("AI", "ML" badges) shown in `dashboard_history` card footers
- **System node visualization** -- GPU cluster status from `dashboard_job_history`; no telemetry data source
- **Neural Processing Load chart** -- Bar chart from `dashboard_job_history`; decorative with no real data
- **Credit purchase flow** -- "Buy Credits" button in `dashboard_history` floating widget; no billing system
- **Team/organization features** -- "Pro Plan" badge and upgrade button; no account system
- **Archive/tag management** -- "Archived" badge and tag chips in `dashboard_history`; future feature
- **PDF report export from dashboard** -- Not present in variants but logical future addition
