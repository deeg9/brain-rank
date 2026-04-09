# Results Detail

## Screen: Results Detail

Deep-dive neural analysis view with per-region breakdown, segment explorer, tagging, and export. This screen is reached by drilling down from the Results Overview. It provides the full granularity of the TRIBE v2 output: multi-track timelines per brain region, segment-by-segment data tables, export controls, and neural moment tagging.

## Source Files

Primary sources are the detail-focused and export-focused variants. The tagging variant contributes the moment-tag UX pattern.

| Source File | Element | Disposition | Notes |
|---|---|---|---|
| neural_analysis_full_detail/code.html | Brain region tracks (Attention, Reward, Emotional, Social), segment detail panel (activation/arousal/valence + region bars), frame preview, "Cognitive Load Distribution" breakdown, "Deep Dive Sync" button | **keep** (region tracks, segment detail panel, region breakdown bars) | Primary source for multi-track timeline and per-segment detail panel. A/B comparison elements dropped. |
| results_with_emotional_tags_export/code.html | Emotional tags on timeline, neural intensity track, focus regions grid (Central Gaze, Motion Lock, Color Pull), export/share panel (Capture Image, PDF, Share Link), collaborator avatars | **keep** (export panel structure, tag concept), **change** (tags are aspirational, focus regions are aspirational, collaborators deferred) | Best export UX. Focus regions grid is a unique contribution but aspirational (no gaze tracking data). |
| results_with_neural_moments_tagging/code.html | Moment tags on waveform: Strong Hook, Peak Engagement, Emotional Spike, Attention Drop, Social Moment. Tag styling (pill buttons with icons, color-coded by type) | **keep** (tag type taxonomy, visual style), **change** (tagging is aspirational -- no tag storage API) | Defines the tag vocabulary and visual treatment. Interaction pattern: click timeline position, apply tag label. |
| single_video_neural_analysis/code.html | Single video layout, engagement waveform, auto-tags (Strong Hook, Peak Engagement, Attention Drop), hook zone marker, recommendations | **keep** (auto-tag labels reused in tag taxonomy) | Auto-tag labels overlap with moment tags. Single-video player layout also informs the Detail view player. |
| analysis_results/code.html | Multi-track A/B timeline, metric cards | **drop** (A/B elements). Metric cards belong in Overview spec. | No unique Detail elements beyond what other variants provide better. |
| final_results_neural_analysis/code.html | Stacked A/B timelines with hover tooltips, winner banner | **drop** (A/B elements). Tooltip interaction already captured from this source in Overview. | Tooltip pattern already documented in Overview spec. |
| results_section_a_refined/code.html | Refined A/B comparison styling | **drop** | No unique Detail elements. |

## Layout

```
+------------------+------------------------------------------------------+
|                  |  TOP BAR                                             |
|                  |  [< Back to Overview]  Video Title  [JSON] [CSV]     |
|    SIDEBAR       +------------------------------------------------------+
|    NAV           |                                                      |
|                  |  +--------------------------------------------------+|
|  - Upload        |  |                                                  ||
|  - Processing    |  |        LARGE VIDEO PLAYER PLACEHOLDER            ||
|  - Results (*)   |  |        (16:9 aspect ratio, full width)           ||
|  - Dashboard     |  |                                                  ||
|                  |  +--------------------------------------------------+|
|                  |                                                      |
|                  |  +--------------------------------------------------+|
|  [Settings]      |  |  MULTI-TRACK TIMELINE                           ||
|  [Support]       |  |  Track 1: Attention    [====  ====  ==  ===]     ||
|                  |  |  Track 2: Reward       [==  ====  =  ======]     ||
|  [User Profile]  |  |  Track 3: Emotional    [====  ==  ====  ===]     ||
|  [New Analysis]  |  |  Track 4: Social       [==  =  ===  ======]     ||
|                  |  |  Time: 0:00  0:15  0:30  0:45  1:00              ||
|                  |  +--------------------------------------------------+|
|                  |                                                      |
|                  |  +-------------------------+  +---------------------+|
|                  |  |  REGION BREAKDOWN       |  | SEGMENT EXPLORER   ||
|                  |  |  PANEL                  |  | TABLE              ||
|                  |  |                         |  |                    ||
|                  |  |  Attention:  avg / peak  |  | Time | Act | Aro  ||
|                  |  |  Reward:     avg / peak  |  | 0:00 | 0.8 | 0.6 ||
|                  |  |  Emotional:  avg / peak  |  | 0:02 | 0.7 | 0.5 ||
|                  |  |  Social:     avg / peak  |  | 0:04 | 0.9 | 0.7 ||
|                  |  |                         |  | ...  | ... | ... ||
|                  |  +-------------------------+  +---------------------+|
|                  |                                                      |
|                  |  +--------------------------------------------------+|
|                  |  |  TAG MANAGEMENT (aspirational)                   ||
|                  |  |  [+ Add Tag]  [Strong Hook] [Peak] [Drop-off]   ||
|                  |  +--------------------------------------------------+|
+------------------+------------------------------------------------------+
```

Grid system: 12-column layout within main content area.
- Video player: `col-span-12` (full width, larger than Overview)
- Multi-track timeline: `col-span-12` (full width)
- Region breakdown panel: `col-span-5` (bottom-left)
- Segment explorer table: `col-span-7` (bottom-right)
- Tag management: `col-span-12` (full width, below explorer)
- Export controls: integrated into top bar action area

## Components

### Sidebar Nav (shared)
Same as Results Overview spec (03-results-overview.md). Results item remains active.

### Top Bar (shared, modified)
- **Left:** Back arrow navigating to Results Overview, video title
- **Right:** Export action buttons (JSON, CSV), share button (aspirational)
- **Props:** `videoTitle: string`, `onExportJSON: () => void`, `onExportCSV: () => void`

### Large Video Player Placeholder
Larger than the Overview's player, spanning full content width.
- **Aspect ratio:** 16:9
- **Size:** `col-span-12` (full width of content area)
- **Visual:** Dark surface background, centered play icon, optional frame preview at current segment
- **HUD overlay:** Timestamp, playback controls, fullscreen toggle
- **Neural sync indicator:** "NEURAL SYNC: ACTIVE" label (from single_video variant)
- **Props:** `thumbnailUrl?: string`, `duration: float`, `currentSegmentIndex?: number`
- **States:** Default (static), Playing (future), Synced (highlights current segment)

### Multi-Track Timeline
The defining component of the Detail view. Shows one track per brain region, aligned on the same time axis.

- **Tracks (4):**
  - Attention (`Segment.regions.attention`) -- color: primary (#ba9eff)
  - Reward (`Segment.regions.reward`) -- color: tertiary (#9bffce)
  - Emotional Processing (`Segment.regions.emotional_processing`) -- color: secondary (#5af8fb)
  - Social Cognition (`Segment.regions.social_cognition`) -- color: on-surface-variant muted

- **Per track:**
  - X-axis: time (derived from `Segment.start` / `Segment.end`)
  - Y-axis: region score for that track (float, from `Segment.regions.{region}`)
  - Visualization: Color-coded bar segments or mini waveform per region
  - Average score label at right end of each track

- **Shared elements:**
  - Vertical playhead (synced across all tracks)
  - Time markers at regular intervals
  - Hook zone marker (dashed border at ~5s)

- **Hover interaction:** Hovering on any track at a time position shows a tooltip with ALL region values at that time:
  ```
  0:34 - 0:36
  Attention: 82  |  Reward: 65
  Emotional: 71  |  Social: 60
  ```

- **Collapsible:** Tracks can be collapsed/expanded via a details/summary toggle (from neural_analysis_full_detail variant's "Brain Region Tracks" section)

- **Props:** `segments: Segment[]`, `duration: float`, `currentTime?: float`, `expandedTracks?: string[]`
- **States:** Default (all tracks visible), Collapsed (tracks hidden behind toggle), Loading (skeleton bars)

### Region Breakdown Panel
Summary view of aggregate region performance across the entire video.

| Region | Average Score Source | Peak Score Source | Tag |
|---|---|---|---|
| Attention | `mean(segments[].regions.attention)` | `max(segments[].regions.attention)` | derived |
| Reward | `mean(segments[].regions.reward)` | `max(segments[].regions.reward)` | derived |
| Emotional Processing | `mean(segments[].regions.emotional_processing)` | `max(segments[].regions.emotional_processing)` | derived |
| Social Cognition | `mean(segments[].regions.social_cognition)` | `max(segments[].regions.social_cognition)` | derived |

- **Per region card:**
  - Region name with color indicator
  - Average score (progress bar visualization)
  - Peak score with timestamp of peak segment
  - Trend indicator (aspirational -- requires historical data)

- **Visual treatment:** From `neural_analysis_full_detail` -- "Cognitive Load Distribution" section with progress bars per region
- **Props:** `segments: Segment[]`
- **States:** Default (computed from segments), Loading (skeleton)

### Segment Explorer
Scrollable table or list showing all segments with their full data.

| Column | Source | Tag | Notes |
|---|---|---|---|
| Time Range | `Segment.start` - `Segment.end` | real | Format as MM:SS - MM:SS |
| Activation Score | `Segment.activation_score` | real | Primary sort column |
| Arousal | `Segment.arousal` | real | |
| Valence | `Segment.valence` | real | Positive/negative indicator |
| Attention | `Segment.regions.attention` | real | |
| Reward | `Segment.regions.reward` | real | |
| Emotional Processing | `Segment.regions.emotional_processing` | real | |
| Social Cognition | `Segment.regions.social_cognition` | real | |

- **Features:** Sortable by any column, clickable rows (highlights timeline segment + seeks video)
- **Props:** `segments: Segment[]`
- **States:** Default (all rows rendered), Loading (skeleton rows), Empty (no segments)

### Export Controls
Buttons for downloading analysis data in machine-readable formats.

| Export Format | Behavior | Data Source | Tag |
|---|---|---|---|
| Export as JSON | Downloads `OutputSchema` serialized as JSON file | `OutputSchema` | real |
| Export as CSV | Downloads flattened segment data (one row per segment, columns for all fields) | `OutputSchema.segments[]` + `OutputSchema.summary` | real |
| Share link | Generates a shareable URL to the results | No backend | aspirational |
| PDF report | Generates a formatted PDF of the analysis | No generation pipeline | aspirational |
| Capture comparison image | Screenshot of the results view | No implementation | aspirational |

- **Props:** `outputData: OutputSchema`, `onExportJSON: () => void`, `onExportCSV: () => void`
- **States:** Default (buttons enabled), Exporting (brief spinner on clicked button), Done (checkmark flash)

### Neural Moment Tags (aspirational)
User-applied labels to specific timeline segments. This is the tagging system documented across `results_with_neural_moments_tagging` and `results_with_emotional_tags_export`.

- **Tag types** (from Stitch variants):
  - `Strong Hook` -- green (tertiary), bolt icon
  - `Peak Engagement` -- purple (primary), star icon
  - `Emotional Spike` -- cyan (secondary), heart icon
  - `Attention Drop` -- red (error), trending_down icon
  - `Social Moment` -- gray (on-surface-variant), groups icon
  - Custom user-defined tags

- **Interaction pattern:** Click on a timeline segment, select or type a tag label, tag appears as a pill on the timeline at that position
- **Tag:** aspirational -- no tag storage API, no tag data model in the schema
- **Props:** `tags: Array<{segmentIndex: number, label: string, type: string}>` (future schema)
- **States:** Empty (no tags applied), Has Tags (pills displayed on timeline), Editing (tag creation popover open)

### Focus Regions Selector (aspirational)
Grid of visual attention focus areas found in `results_with_emotional_tags_export` (Central Gaze, Motion Lock, Color Pull).
- **Tag:** aspirational -- no gaze tracking or visual attention heatmap data exists in the schema
- **Notes:** Would require additional model output (attention heatmaps per frame). Interesting UX concept for v2+.

## Interactions

| Interaction | Trigger | Behavior | Notes |
|---|---|---|---|
| Multi-track timeline scrub | Hover on any track at a time position | Tooltip shows all 4 region values at that timestamp | Real data from Segment.regions |
| Video-timeline sync | Click a timeline position | Seeks video player to that timestamp | Placeholder in v1 |
| Region card click | Click a region in the breakdown panel | Highlights/pulses that region's track in the multi-track timeline | Visual emphasis only |
| Segment explorer row click | Click a row in the segment table | Seeks video to segment start + highlights corresponding timeline segment | Dual-highlight interaction |
| Track collapse/expand | Click track section header toggle | Shows/hides the brain region tracks section | From neural_analysis_full_detail details/summary pattern |
| Tag creation | Click timeline segment, then "Add Tag" | Opens tag type selector, applies tag pill at position | Aspirational -- no backend |
| Export JSON | Click JSON export button | Triggers browser download of OutputSchema as .json | Real -- client-side serialization |
| Export CSV | Click CSV export button | Triggers browser download of flattened segment data as .csv | Real -- client-side flattening |
| Back to Overview | Click back arrow in top bar | Navigates to Results Overview (03) | Standard navigation |
| Column sort | Click column header in Segment Explorer | Sorts table by that column (ascending/descending toggle) | Client-side sort |

## States

| State | Condition | Visual Treatment |
|---|---|---|
| **Default** | All data loaded from OutputSchema | Full render: video thumbnail, all 4 region tracks populated, segment table filled, export enabled |
| **Loading** | Data is being fetched or computed | Skeleton bars for timeline tracks, skeleton rows for segment table, export buttons disabled |
| **Error** | Analysis failed or data unavailable | Error card with back button to Dashboard. All data components hidden. |
| **Export In Progress** | User clicked export, file is being generated | Brief loading spinner on the clicked export button (1-2 seconds for client-side generation) |

## Data Requirements

| UI Field | Schema Field | Tag | Notes |
|---|---|---|---|
| Per-segment activation | `Segment.activation_score` | real | Float, per 2-second window |
| Per-segment arousal | `Segment.arousal` | real | Float |
| Per-segment valence | `Segment.valence` | real | Float, can be negative |
| Per-segment time range | `Segment.start`, `Segment.end` | real | Float seconds |
| Region: Attention (per segment) | `Segment.regions.attention` | real | Float, drives attention track |
| Region: Reward (per segment) | `Segment.regions.reward` | real | Float, drives reward track |
| Region: Emotional Processing (per segment) | `Segment.regions.emotional_processing` | real | Float, drives emotional track |
| Region: Social Cognition (per segment) | `Segment.regions.social_cognition` | real | Float, drives social track |
| Region average: Attention | `mean(Segment[].regions.attention)` | derived | Computed client-side from all segments |
| Region average: Reward | `mean(Segment[].regions.reward)` | derived | Computed client-side |
| Region average: Emotional | `mean(Segment[].regions.emotional_processing)` | derived | Computed client-side |
| Region average: Social | `mean(Segment[].regions.social_cognition)` | derived | Computed client-side |
| Region peak: Attention | `max(Segment[].regions.attention)` | derived | Computed client-side, with timestamp |
| Region peak: Reward | `max(Segment[].regions.reward)` | derived | Computed client-side |
| Region peak: Emotional | `max(Segment[].regions.emotional_processing)` | derived | Computed client-side |
| Region peak: Social | `max(Segment[].regions.social_cognition)` | derived | Computed client-side |
| Focus regions filter | Uses region names from RegionScores fields | derived | Allows filtering tracks by region name |
| Export data (JSON) | `OutputSchema` serialized | real | Full response object |
| Export data (CSV) | `OutputSchema.segments[]` flattened | real | One row per segment |
| Video duration | `OutputSchema.duration_seconds` | real | For timeline axis |
| Video URL | `OutputSchema.video_url` | real | For player source |
| Neural moment tags | No schema field | aspirational | No tag storage API exists |
| Share link | No schema field | aspirational | No sharing backend |
| Benchmark comparison | No schema field | aspirational | No benchmark database |
| Focus region heatmaps | No schema field | aspirational | No gaze/attention heatmap output |

## Deferred

- **A/B side-by-side detail comparison**: All dual-video comparison UI from `neural_analysis_full_detail/code.html` and other variants is deferred to v2. Winner banners, variant labels, comparison deltas -- all out of scope for single-video v1.
- **PDF report generation**: "Download PDF Report" from `results_with_emotional_tags_export/code.html` requires a report generation pipeline that does not exist.
- **Collaborative tagging**: Collaborator avatars and shared tag editing from `results_with_emotional_tags_export/code.html` are deferred.
- **Benchmark database**: Comparative analytics from `single_video_neural_analysis/code.html` (Audio Dynamics, Pacing Density, Color Emotionality) require a benchmark dataset.
- **AI Auto-Correction**: Automated edit suggestions with one-click apply are deferred.
- **Visual attention heatmaps**: Focus regions grid (Central Gaze, Motion Lock, Color Pull) requires model output that TRIBE v2 does not provide.
