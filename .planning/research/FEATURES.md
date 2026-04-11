# Feature Landscape: Brain Visualization UX Overhaul

**Domain:** Brain activation visualization for content creators (modeled after Meta's TRIBE v2 demo)
**Researched:** 2026-04-10
**Overall confidence:** MEDIUM (Meta's interactive demo is a JS app that cannot be scraped; findings synthesized from blog posts, notebook code, Gradio demo descriptions, nilearn docs, and third-party writeups)

## How Meta Demos TRIBE v2 (Evidence-Based Findings)

### Meta's Demo Architecture (Two Surfaces)

Meta provides two visualization surfaces for TRIBE v2:

1. **Colab Notebook Demo** (`tribe_demo.ipynb`) -- Uses `PlotBrain` class wrapping `nilearn.plotting.view_surf` with `pyvista` backend. Generates **one brain surface render per timestep** (1 TR = 1 second). Renders 15 frames for 15 seconds of video. Uses the fsaverage5 inflated mesh (~20,484 vertices). Output is a sequence of static brain heatmaps, NOT an animation.

2. **Gradio Interactive Demo** (`aidemos.atmeta.com/tribev2`) -- Uses `nilearn.plotting.view_surf` via Plotly WebGL engine. Two modes:
   - **Single-input mode**: Upload video/audio/text, get brain heatmap with a **timestep slider** to scrub through activation over time
   - **Comparison mode**: Upload two inputs, visualize their **difference as a contrast heatmap** (what one stimulus activates more than the other)

### What Meta Gets Right (Specific UX Decisions)

**Confidence: MEDIUM** -- Synthesized from multiple sources describing the demo

| Decision | What They Do | Why It Works |
|----------|-------------|--------------|
| Inflated mesh | Use fsaverage5 *inflated* surface, not pial | Exposes sulcal geometry hidden in brain folds -- activation in sulci becomes visible |
| Sulcal depth background | Gray sulcal depth map rendered *under* the heatmap | Provides anatomical landmark context without adding UI clutter |
| Hot colormap | Uses "hot" colormap (black -> red -> yellow -> white) on Gradio demo | Intuitive "heat = activation" metaphor. No cognitive load interpreting colors |
| Threshold-based display | `view_surf` has `threshold` parameter -- only show activation above a cutoff | Brain appears mostly neutral gray; only significantly activated regions "glow." This is the key storytelling mechanism |
| No toggles or filters | No per-region toggle buttons in their demo | The data speaks for itself. Visual cortex lights up when imagery appears. Language areas light up during speech. The spatial pattern IS the information |
| Timestep slider | Single slider to scrub through time | Lets the viewer see activation *change* over time without animation complexity |
| Colorbar legend | Single continuous colorbar showing activation scale | Replaces discrete category toggles. One legend, always visible, minimal space |
| Two hemispheres side-by-side | Left and right hemisphere rendered separately via `nilearn.plotting.view_surf` | Standard neuroimaging convention. Each hemisphere gets its own interactive WebGL view |
| Comparison mode | Difference heatmap: Input A minus Input B | Shows what makes one stimulus neurally distinct from another -- directly useful for A/B testing concept |

### Meta's Storytelling Pattern (From Demo Notebook)

The notebook explicitly narrates: "As the image appears on the screen, the visual cortex lights up (t=4s), followed by the language network when the character starts to speak (t=12s)."

This is the core insight: **the visualization tells a temporal story**. You do not need labels saying "Visual Cortex" or "Language Network" -- the spatial pattern of activation on the brain surface, combined with knowledge of what was happening in the video at that moment, IS the story. The brain speaks for itself when the visualization is clean enough.

### Three-Panel Layout (From The Decoder)

Meta's research presentations use a three-panel comparison layout:
- **Top panel**: Images/stimuli shown to subjects
- **Middle panel**: Model prediction activation pattern
- **Bottom panel**: Actual measured fMRI brain activity

This layout immediately communicates accuracy and builds trust. For NeuroCut, the equivalent is: **video frame + predicted brain activation side-by-side**.

## Table Stakes

Features users expect for a brain visualization to feel credible and useful.

| Feature | Why Expected | Complexity | Status in Current UI |
|---------|--------------|------------|---------------------|
| 3D brain surface with orbit controls | Users expect to rotate/zoom a brain model | Med | DONE -- react-three-fiber + OrbitControls |
| Per-vertex activation heatmap | Vertex-level data is what makes this "real" vs a cartoon | High | DONE -- BrainHeatmapMesh with 20,484 vertices |
| Time-synced activation | Brain should reflect what's happening in video NOW | Low | DONE -- currentTime prop drives getVertexDataAtTime |
| Threshold-based display | Only show activation above a meaningful cutoff; rest is neutral gray | Low | NOT DONE -- currently shows all vertices with color |
| Continuous colorbar legend | Show what the colors mean with a gradient bar + min/max labels | Low | NOT DONE -- currently uses toggle buttons per region |
| Dark background | Black/very dark background behind brain for contrast | Low | DONE -- #151520 background |
| Inflated mesh view | Expose sulci for full activation visibility | Med | PARTIALLY DONE -- using unified GLB, unclear if inflated |
| Single committed colormap | One colormap, no user choice. Meta uses "hot" | Low | NOT DONE -- currently offers dropdown with plasma, viridis, etc. |

## Differentiators

Features that would set NeuroCut apart from a generic brain viewer.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dynamic glow above threshold | Regions above activation threshold emit soft bloom; below threshold = dark gray. Brain "breathes" as video plays | Med | Bloom already exists in regions mode. Apply threshold logic to heatmap mode. This is the hero feature |
| Video-brain sync playback | Video plays in adjacent panel; brain updates in real-time as video plays. Creator sees EXACTLY which moments light up the brain | Low | Core wiring exists. Need to make it feel like a single integrated experience |
| Activation timeline sparkline | Thin sparkline below brain showing overall activation over time, with playhead indicator. Shows "shape" of engagement at a glance | Med | Complements brain view. Meta's timestep slider serves similar purpose but NeuroCut can do better for creators |
| Peak moment markers | Automatically mark the top 3-5 activation peaks on timeline. "Your video's brain moments" | Low | High value for content creators. Easy to compute from existing data |
| Comparison contrast mode | Side-by-side two videos, difference heatmap showing what Video A activates MORE than Video B | High | Directly inspired by Meta's comparison mode. Core to A/B testing value prop. Out of scope for v3.0 |
| Segment annotation overlay | When activation spikes, show what was happening in the video at that moment | High | Requires transcript/scene detection. Defer |

## Anti-Features

Features to explicitly NOT build. Things the current UI does that should be removed.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Per-region toggle buttons (9 buttons) | Creates decision paralysis. Meta shows zero toggles. The spatial pattern IS the information -- toggles add cognitive load without insight | Remove entirely. Replace with a small static color legend showing network colors (display-only, not interactive) |
| Heatmap/Regions mode toggle | Two competing visualization modes confuses users. Switching between them breaks flow | Default to heatmap mode (this is what Meta uses). Remove regions as a primary toggle. If kept, make it a secondary option accessible through a settings menu |
| Colormap selector dropdown | Letting users pick between plasma, viridis, etc. is a power-user feature that confuses casual creators. Meta uses ONE colormap | Pick one colormap and commit. Use "inferno" or "hot" (black-red-yellow-white) to match Meta's convention and the intuitive "heat" metaphor |
| Preset view buttons (Front/Top/Left/Right) | Four buttons in header add visual noise. Orbit controls already let users rotate freely | Remove buttons. Keep orbit controls. Optionally add a single subtle "reset view" icon overlay on the canvas |
| Crowded header with title + controls on one line | Current header jams: title + dropdown + mode toggle + 4 view buttons into one row | Clean header: title only. Any remaining controls become subtle overlaid icons on the canvas itself |

## Feature Dependencies

```
Threshold-based display --> Dynamic glow (glow requires knowing what's "above threshold")
Video-brain sync --> Activation timeline sparkline (timeline needs playback position)
Per-vertex heatmap (DONE) --> Threshold-based display
Threshold-based display --> Colorbar legend (legend shows threshold cutoff)
```

## MVP Recommendation for v3.0

### Must Do (Core Overhaul -- Subtraction)

1. **Threshold-based display** -- Add activation threshold (e.g., 50th percentile). Vertices below threshold render as neutral dark gray. Vertices above threshold render with hot colormap. This single change transforms the visualization from "everything is colored" to "significant regions glow." This is the number one lesson from Meta's approach.

2. **Remove toggle filter buttons** -- Delete the 9-button region toggle row entirely. Replace with a small static color legend (if regions mode is kept at all) or a continuous colorbar gradient.

3. **Remove colormap selector** -- Commit to a single colormap ("inferno" is the closest web-friendly equivalent to Meta's "hot"). Delete the dropdown.

4. **Remove preset view buttons** -- Delete Front/Top/Left/Right buttons. Keep orbit controls. Add a single unobtrusive reset-view icon if needed.

5. **Clean header** -- Title only. No controls in the header row.

6. **Continuous colorbar** -- Add a vertical or horizontal gradient bar showing the activation scale from low to high, with threshold line marked.

### Should Do (Enhanced Experience -- Addition)

7. **Dynamic bloom on heatmap mode** -- Currently bloom only applies in regions mode. Apply bloom post-processing to heatmap mode so activated regions glow against the dark brain. This is the "wow" factor that makes it feel alive.

8. **Activation timeline sparkline** -- Thin bar below the brain showing activation intensity over the video duration with playhead position. Clicking jumps to that timestamp.

9. **Peak moment markers** -- Mark top 3-5 activation peaks on the sparkline. "Your video's brain moments."

### Defer

- **Comparison/contrast mode** -- Multi-video is out of scope for v3.0
- **Segment annotations** -- Requires additional data pipeline work
- **Regions mode entirely** -- Consider removing from v3.0 and reintroducing later as an "explore" panel
- **Inflated mesh toggle** -- Verify current mesh state before adding complexity

## What Makes Meta's Approach Work (Summary)

Meta's TRIBE v2 visualization is compelling because of what it does NOT show:

1. **No toggles** -- The brain surface IS the interface
2. **No competing modes** -- One visualization, one colormap, one story
3. **Threshold = drama** -- Only significant activation appears, creating visual "moments" as the video plays
4. **Temporal narrative** -- The visualization changes over time, telling a story: "here the brain responded, here it didn't"
5. **Anatomical context without labels** -- Sulcal depth map provides orientation; no region labels clutter the view
6. **Hot colormap** -- Black-to-red-to-yellow-to-white is universally understood as "intensity"

The current NeuroCut brain viewer has the RIGHT technical foundation (20,484 vertices, react-three-fiber, per-segment data, time sync) but the WRONG UX layer on top: too many controls, no threshold, competing modes, and no visual drama. The overhaul is about subtraction more than addition.

## Sources

- [Meta AI Blog: TRIBE v2](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/) -- Official announcement, references interactive demo
- [TRIBE v2 Interactive Demo](https://aidemos.atmeta.com/tribev2) -- Gradio-based web demo with timestep slider and comparison mode
- [TRIBE v2 Demo Notebook](https://github.com/facebookresearch/tribev2/blob/main/tribe_demo.ipynb) -- PlotBrain class, visualization workflow, "visual cortex lights up at t=4s" narrative
- [TRIBE v2 GitHub Repository](https://github.com/facebookresearch/tribev2) -- plotting/ module, fsaverage5 mesh, nilearn integration
- [The Decoder: Meta's TRIBE v2](https://the-decoder.com/metas-new-ai-model-predicts-how-your-brain-reacts-to-images-sounds-and-speech/) -- Three-panel layout description (stimuli / prediction / actual)
- [HF Daily Briefer: TRIBE v2](https://www.hfdailybriefer.com/post/1618) -- Confirmed Gradio demo uses nilearn.plotting.view_surf with hot colormap via Plotly WebGL
- [nilearn.plotting.view_surf docs](https://nilearn.github.io/dev/modules/generated/nilearn.plotting.view_surf.html) -- threshold parameter, colorbar, bg_map for sulcal depth, default RdBu_r colormap
- [DataCamp TRIBE v2 Tutorial](https://www.datacamp.com/tutorial/tribe-v2-tutorial) -- Confirmed "interactive 3D heatmaps" output
- [facebook/tribev2 on HuggingFace](https://huggingface.co/facebook/tribev2) -- Model card, fsaverage5 mesh details, prediction shape (T, 20484)
