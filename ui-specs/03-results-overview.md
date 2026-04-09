# Results Overview

## Screen: Results Overview

Primary results view showing summary metrics, activation timeline, and video preview after analysis completes. This is the first screen a user sees when their video analysis is finished. It provides a high-level summary of neural engagement data and an interactive timeline for quick orientation before drilling into the detail view.

## Source Files

The following Stitch variants were analyzed to produce this consolidated spec. `analysis_results/code.html` is the CORE variant; others contribute cherry-picked improvements.

| Source File | Element | Disposition | Target Spec | Notes |
|---|---|---|---|---|
| analysis_results/code.html | Sidebar nav, top bar, metric cards (5), multi-track timeline, AI recommendations, export panel | **keep** (sidebar, metrics, timeline), **drop** (A/B comparison layout, "Winner" badges) | Overview | CORE variant. Dual-video A/B layout stripped to single video per user decision. Metric cards and timeline are the strongest implementation. |
| analysis_results/code.html | Dual video players (Variant A / Variant B), "Winner B" badges, comparison delta labels | **drop** | Deferred (v2) | A/B comparison is v2-deferred. Single video only for v1. |
| single_video_neural_analysis/code.html | Single video player with HUD, engagement waveform, auto-tags on timeline, summary cards sidebar, recommendations panel, benchmark section | **keep** (single video layout, waveform style, hook zone marker), **change** (benchmarks moved to aspirational) | Overview | Best single-video layout. Cherry-pick video player positioning (8-col/4-col split) and hook zone markers. |
| final_results_neural_analysis/code.html | Large video comparison, stacked timelines with tooltips, 5 metric cards row, AI recommendations, winner banner | **keep** (tooltip on timeline hover), **drop** (A/B comparison, winner banner) | Overview | Tooltip interaction pattern (score + region breakdown on hover) is best-in-class. A/B layout dropped. |
| results_section_a_refined/code.html | Refined video comparison section, multi-track timeline, metric cards, AI insights | **drop** (entire file is a refined A/B variant) | N/A | Purely a styling refinement of the A/B comparison. No unique elements beyond analysis_results. |
| results_with_emotional_tags_export/code.html | Emotional tags on timeline, neural intensity track, focus regions grid, export/share panel, collaborator avatars | **change** (emotional tags noted as aspirational), **keep** (export button concept) | Overview (export button), Detail (tags, focus regions) | Emotional tags and focus regions move to Detail spec. Export button presence noted here. |
| results_with_neural_moments_tagging/code.html | Moment tags on waveform (Strong Hook, Peak Engagement, Emotional Spike, Attention Drop, Social Moment), tag styling | **change** (tags noted as aspirational) | Detail | Tagging UX moves entirely to Detail spec. Tag types documented there. |
| neural_analysis_full_detail/code.html | 12-col grid layout (8+4), brain region tracks (Attention, Reward, Emotional, Social), segment detail panel with per-region breakdown, frame preview | **keep** (brain region tracks concept for Detail), **drop** (A/B layout) | Detail | All deep-dive elements belong in Detail spec. Brain region tracks are the key unique contribution. |

## Layout

```
+------------------+------------------------------------------------------+
|                  |  TOP BAR                                             |
|                  |  [< Back to Dashboard]  Video Title     [Export v]   |
|    SIDEBAR       +------------------------------------------------------+
|    NAV           |                                                      |
|                  |  +----------------------------------+  +-----------+ |
|  - Upload        |  |                                  |  | SUMMARY   | |
|  - Processing    |  |     VIDEO PLAYER PLACEHOLDER     |  | METRIC    | |
|  - Results (*)   |  |     (16:9 aspect ratio)          |  | CARDS     | |
|  - Dashboard     |  |     ~60% width                   |  |           | |
|                  |  +----------------------------------+  | - Overall | |
|                  |                                        | - Hook    | |
|                  |                                        | - Retain  | |
|                  |                                        | - Peak    | |
|  [Settings]      |                                        | - Engage  | |
|  [Support]       |                                        +-----------+ |
|                  |                                                      |
|  [User Profile]  |  +------------------------------------------------+ |
|  [New Analysis]  |  |  NEURAL ACTIVATION TIMELINE (full width)        | |
|                  |  |  X: time (seconds)  Y: activation score         | |
|                  |  |  Color-coded segments: High/Stable/Drop-off     | |
|                  |  |  Playhead + hover tooltips                      | |
|                  |  +------------------------------------------------+ |
|                  |                                                      |
|                  |  +-------------------------------+  +-------------+  |
|                  |  |  AI RECOMMENDATIONS PANEL     |  | EXPORT      |  |
|                  |  |  (aspirational)               |  | CONTROLS    |  |
|                  |  +-------------------------------+  +-------------+  |
+------------------+------------------------------------------------------+
```

Grid system: 12-column layout within the main content area (right of sidebar).
- Video player: `col-span-8` (top-left)
- Summary metric cards: `col-span-4` (top-right, stacked vertically)
- Neural activation timeline: `col-span-12` (full width, below player)
- AI recommendations: `col-span-8` (below timeline)
- Export controls: `col-span-4` (below timeline, right)

## Components

### Sidebar Nav (shared)
Standard left-side navigation bar, fixed position, 256px (w-64) width.
- **Items:** Upload, Processing, Results (active), Dashboard
- **Active state:** Left border accent (2px, primary color), highlighted background
- **Footer:** Settings, Support, user profile card, "New Analysis" CTA button
- **Props:** `activeItem: string` (which nav item is highlighted)
- **States:** Default (all items visible), collapsed (mobile/responsive -- not in v1 scope)

### Top Bar (shared)
Horizontal bar above main content, spanning full width minus sidebar.
- **Left:** Back navigation arrow + video title (e.g., "campaign_v4_final.mp4")
- **Right:** Search input, notification icon, user avatar
- **Props:** `videoTitle: string`, `projectName: string`
- **States:** Default

### Video Player Placeholder
Placeholder element where a video player will eventually render. Not functional in v1.
- **Aspect ratio:** 16:9
- **Size:** ~60% of content width (col-span-8 in 12-col grid)
- **Visual:** Dark surface background with centered play icon overlay, optional thumbnail image
- **HUD overlay (bottom):** Timestamp display (e.g., "00:42 / 02:15"), playback status
- **Props:** `thumbnailUrl?: string`, `duration: float` (from OutputSchema.duration_seconds)
- **States:** Default (static thumbnail + play icon), Playing (future), Error (broken thumbnail)

### Summary Metric Cards
Five cards displayed in a vertical stack to the right of the video player (col-span-4).

| Card | Value Display | Schema Source | Tag | Notes |
|------|--------------|---------------|-----|-------|
| Overall Score | Large number (e.g., "78") with "/100" suffix and progress bar | `Summary.overall` | real | Primary metric. Scale 0-100 from model output. |
| Hook Score | Large number (e.g., "84") | `Summary.hook_score` | real | Derived from first segment(s) activation. |
| Retention Score | Percentage display (e.g., "72%") with mini sparkline | `Summary.retention_score` | real | Aggregate retention metric. |
| Peak Moment | Timestamp + score (e.g., "0:42 / Score 91") | `Summary.peak_second` + `Summary.peak_score` | real | Shows when and how high the peak was. |
| Engagement IQ | Letter grade (e.g., "S+") with label (e.g., "ELITE") | Not in schema | aspirational | No current computation. Placeholder card -- display "Coming Soon" or omit in v1. |

- **Props per card:** `label: string`, `value: string | number`, `subtitle?: string`, `tag: "real" | "aspirational"`, `accentColor: string`
- **Variants:** Standard (with value), Loading (skeleton shimmer), Unavailable (grayed, "Coming Soon")
- **Interactions:** Hover shows tooltip with additional context; click scrolls to relevant timeline section (future)

### Neural Activation Timeline
The primary data visualization component. Full-width below the video player.

- **X-axis:** Time in seconds, derived from `Segment.start` / `Segment.end` values
- **Y-axis:** Activation score (`Segment.activation_score`), scale 0-1 or 0-100 normalized
- **Visualization:** Continuous waveform or bar chart with color-coded segments:
  - High engagement (tertiary green, #9bffce): activation_score > 0.7
  - Stable engagement (secondary cyan, #5af8fb): activation_score 0.4-0.7
  - Drop-off (error red, #ff6e84): activation_score < 0.4
- **Color strip:** Thin strip below the waveform showing engagement quality per segment
- **Playhead:** Vertical line indicating current position, draggable
- **Hook zone marker:** Dashed vertical boundary at ~5s mark indicating the "hook zone"
- **Time markers:** Labels at regular intervals (0:00, 0:15, 0:30, etc.)
- **Hover tooltip:** On segment hover, shows:
  - Time range (e.g., "0:34 - 0:36")
  - Activation score
  - Region breakdown (attention, reward, emotional_processing, social_cognition)
- **Props:** `segments: Segment[]`, `duration: float`, `currentTime?: float`
- **States:** Default (data loaded), Loading (skeleton bar), Empty (no segments -- should not occur)

### AI Recommendations Panel
Displays AI-generated optimization suggestions.

- **Layout:** Card list with icon + title + description per recommendation
- **Content:** Hardcoded/placeholder suggestions (e.g., "Aggressive Trimming Suggested", "Visual Contrast Advantage")
- **Tag:** aspirational -- no recommendation engine exists in the current pipeline
- **Props:** `recommendations: Array<{icon: string, title: string, description: string}>`
- **States:** Default (show placeholder content), Empty ("No recommendations available")

### Emotional Tags (aspirational)
Small chip/pill elements overlaid on the timeline indicating emotional moments.
- **Tag types found in variants:** "Viral Potential", "Hook Decay", "High Saturation", "Quick Cuts", "Gen Z Appeal"
- **Tag:** aspirational -- no tagging API or emotion classification exists in the schema
- **Notes:** Visual concept documented in `results_with_emotional_tags_export`. Implementation deferred until a tagging system is built.

## Interactions

| Interaction | Trigger | Behavior | Notes |
|---|---|---|---|
| Timeline scrubbing | Hover/click on timeline segment | Shows tooltip with time range, activation score, and region breakdown values | Real data from Segment[] |
| Video-timeline sync | Click timeline segment | Seeks video player to that segment's start timestamp | Placeholder behavior in v1 (no real player) |
| Metric card click | Click on a summary metric card | Scrolls to or highlights the relevant timeline section (e.g., Peak Moment highlights the peak segment) | Future enhancement |
| Navigate to Detail | Click "View Full Analysis" or "Deep Dive" button | Routes to Results Detail screen (04-results-detail) | Primary drill-down path |
| Navigate back | Click back arrow in top bar | Returns to Dashboard | Standard navigation |
| Export button | Click export control | Opens export options (JSON/CSV download) | Behavior specified in Detail spec; button is present here as a shortcut |
| Playhead drag | Drag the vertical playhead line along the timeline | Updates current time position; video player seeks accordingly | Placeholder sync in v1 |

## States

| State | Condition | Visual Treatment |
|---|---|---|
| **Default** | All data loaded from OutputSchema | Full render: video thumbnail, all metric cards populated, timeline drawn with segments |
| **Loading** | Analysis response is being fetched or parsed | Skeleton cards (shimmer animation), timeline placeholder bar, video thumbnail area grayed |
| **Error** | Analysis failed or API returned ErrorResponse | Error message card with error type and retry button. Timeline and metrics hidden. |
| **Empty** | Should not occur -- user is redirected here only on successful analysis completion | Redirect to Dashboard if no data |

## Data Requirements

| UI Field | Schema Field | Tag | Notes |
|---|---|---|---|
| Overall Score | `Summary.overall` | real | Float, display as integer 0-100 |
| Hook Score | `Summary.hook_score` | real | Float, display as decimal or integer |
| Retention Score | `Summary.retention_score` | real | Float, display as percentage |
| Peak Moment (timestamp) | `Summary.peak_second` | real | Float seconds, format as MM:SS |
| Peak Moment (score) | `Summary.peak_score` | real | Float, display alongside timestamp |
| Video Duration | `OutputSchema.duration_seconds` | real | Float seconds, format as MM:SS |
| Video URL | `OutputSchema.video_url` | real | Used for video player source / thumbnail |
| Timeline segments | `OutputSchema.segments[]` | real | Array of Segment objects |
| Segment time range | `Segment.start`, `Segment.end` | real | Float seconds per segment |
| Segment activation | `Segment.activation_score` | real | Float, drives timeline waveform height |
| Segment arousal | `Segment.arousal` | real | Float, shown in timeline tooltip |
| Segment valence | `Segment.valence` | real | Float, shown in timeline tooltip |
| Region: Attention | `Segment.regions.attention` | real | Float, shown in tooltip region breakdown |
| Region: Reward | `Segment.regions.reward` | real | Float, shown in tooltip region breakdown |
| Region: Emotional Processing | `Segment.regions.emotional_processing` | real | Float, shown in tooltip region breakdown |
| Region: Social Cognition | `Segment.regions.social_cognition` | real | Float, shown in tooltip region breakdown |
| Engagement IQ grade | Not in schema | aspirational | No computation exists. Display placeholder or omit. |
| AI Recommendations | Not in schema | aspirational | No recommendation engine. Show placeholder content. |
| Emotional Tags | Not in schema | aspirational | No emotion tagging API. Visual concept only. |
| Benchmark comparisons | Not in schema | aspirational | No benchmark database exists (seen in single_video variant). |
| Credits remaining | Not in schema | aspirational | Shown in top bar of some variants. No credit system. |

## Deferred

The following features appear in one or more Stitch variants but are explicitly deferred from v1:

- **A/B comparison view**: The dual-video layout from `analysis_results/code.html`, `final_results_neural_analysis/code.html`, and `neural_analysis_full_detail/code.html` is entirely deferred to v2. The inference pipeline only supports single video analysis. All "Variant A vs Variant B" UI, winner badges, comparison deltas, and side-by-side players are out of scope.
- **Real-time collaboration**: Collaborator avatars and "Active Collaborators" section from `results_with_emotional_tags_export/code.html` are deferred.
- **PDF export generation**: "Download PDF Report" button from `results_with_emotional_tags_export/code.html` is deferred. JSON/CSV export is in scope (Detail spec).
- **Benchmark database**: "Creative Intelligence Benchmarking" section from `single_video_neural_analysis/code.html` (Audio Dynamics, Pacing Density, Color Emotionality metrics) requires a benchmark dataset that does not exist.
- **AI Auto-Correction**: "Apply AI Auto-Correction" button from `single_video_neural_analysis/code.html` is deferred -- no auto-correction engine exists.
- **Ask NeuroAI floating button**: AI chat assistant from `analysis_results/code.html` is deferred.
- **Heatmap frame export**: "Heatmap Frames (Zip)" export option is deferred -- no heatmap generation pipeline exists.
