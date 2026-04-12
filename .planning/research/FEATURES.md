# Feature Landscape: Multi-Modal Input & Comparison

**Domain:** Neural content testing / neuromarketing creative pre-testing
**Researched:** 2026-04-11
**Milestone:** v5.0 Multi-Modal Input & Comparison

## Table Stakes

Features users expect when a tool claims to support multiple input types and comparison. Missing = product feels broken or half-baked.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Content type selector on upload page** | Every multi-modal tool (Neurons AI, alpha.one) uses a clear type picker before upload. Users must know what they're about to do. | Low | Existing upload page | Segmented control or tab bar: Video / Image / Text. Neurons AI auto-detects, but explicit selection is better for NeuroCut because conversion pipeline differs per type. |
| **Image upload with drag-and-drop** | Neurons AI supports drag-and-drop for "almost any visual asset." Users expect the same UX quality as video upload. | Low | Existing AnimatedFileUpload component | Extend current component to accept JPEG/PNG/WebP. Show image thumbnail preview instead of video frame. Max file size can be lower (50MB). |
| **Text input with rich preview** | alpha.one and Neurons AI both accept text/copy as input. A bare textarea feels cheap. | Medium | New component | Styled text card preview showing how the text will look when rendered. Font size, alignment controls. Live preview of the rendered card. |
| **Transparent server-side conversion** | Users upload an image or text, and the system handles conversion to video format for TRIBE v2. User should never see "converting to video." | Medium | New API route, ffmpeg/canvas on server | Image: static frame held for N seconds as silent video. Text visual mode: render to image then same path. Text spoken mode: native TRIBE v2 text->TTS->audio. Conversion status shown as "Preparing analysis" not "Converting to video." |
| **Content type badge on results** | Every result in dashboard/discover needs to show what type of content was analyzed. Without this, users can't distinguish image analyses from video analyses. | Low | Database schema (add `content_type` column to jobs), dashboard/discover UI | Badge: "Video" / "Image" / "Text". Neurons AI labels assets by type in their file browser. |
| **Results page adapted for non-video content** | Current results page has VideoPlayer taking 50% of the hero area. Showing a video player for a static image is confusing. | Medium | Results page, conditional rendering | Image: show the source image (no player controls, no timeline scrubbing). Text: show the rendered text card. Brain viewer and metrics still work identically. Timeline becomes a single-point or simplified view for static content. |
| **Side-by-side comparison of two analyses** | Neurons AI supports comparing up to 6 assets. TubeBuddy shows A vs B results. This is the core value prop of "A/B testing." | High | New /compare page, analysis picker | Two-column layout. Each column shows: source content preview, overall score, key metrics, mini brain viewer or heatmap. Metric deltas highlighted (e.g., "+12% activation"). Neurons AI shows heatmaps side by side with metric bars. |
| **Analysis picker for comparison** | Users need to select which two analyses to compare. Neurons AI uses a file browser with checkboxes. | Medium | Dashboard data, new picker component | Modal or inline picker showing completed analyses with thumbnails, titles, dates, content type badges. Filter by content type. Select exactly 2. |

## Differentiators

Features that set NeuroCut apart from Neurons AI and alpha.one. Not expected, but valuable.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Brain viewer in comparison mode** | Neurons AI shows heatmaps. NeuroCut already has a 3D brain viewer with 20K+ vertices. Showing two brain viewers side by side with the same rotation/zoom sync is visually stunning and scientifically differentiated. | High | BrainViewer component, WebGL performance | Sync camera rotation between two brain viewers so they rotate together. This is technically challenging (two Three.js canvases sharing camera state) but very impressive. Fallback: static brain snapshots at peak moment. |
| **Metric delta annotations** | Instead of just showing two numbers, highlight the difference: "Thumbnail B drives +18% more reward activation." This is what TubeBuddy does with CTR deltas. | Low | Comparison page | Simple math. Green for positive delta, red for negative. Percentage and absolute shown. Low effort, high value. |
| **Cross-type comparison** | Compare a video hook against a thumbnail. Compare ad copy (text) against the visual it describes. No competitor does cross-modal comparison with brain data. | Low (UI) | Comparison page already handles different types | The comparison UI just needs to handle different content previews in each column. The data format (segments, scores) is identical regardless of input type because TRIBE v2 outputs the same schema. |
| **Text input dual-mode toggle** | Visual mode (render text as image card -> video -> TRIBE v2 video path) vs. Spoken mode (text -> TTS -> TRIBE v2 audio path). Tests different brain responses: "how does this look?" vs. "how does this sound?" No competitor offers this distinction. | Medium | Two separate conversion pipelines | Clear toggle with explanation: "Visual: test how your copy looks as a graphic" vs "Spoken: test how your copy sounds when read aloud." Results may differ significantly, which is the insight. |
| **Quick re-test with variation** | From results page, "Test a variation" button that pre-fills the upload page with the same content type and links the new analysis for easy comparison. | Medium | Upload page state, job metadata | Reduces friction for iterative testing. Neurons AI has unlimited testing but no explicit "re-test" flow. This creates a natural comparison pair. |
| **Comparison shareable links** | Like individual analyses can be public, comparisons should be shareable: `/compare/abc123-vs-def456`. | Medium | New route, URL structure, public access check | Builds on existing public/private toggle infrastructure. Shareable comparison links are valuable for teams and social sharing. |

## Anti-Features

Features to explicitly NOT build. Based on competitor analysis and NeuroCut's constraints.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Heatmap overlay on content** | Neurons AI's core feature is attention heatmaps overlaid on images. TRIBE v2 outputs per-vertex cortical activation, NOT spatial attention on the image. Faking a heatmap would be scientifically dishonest. | Use the 3D brain viewer. NeuroCut's differentiator is actual brain activation, not predicted eye-tracking. |
| **Auto-detection of content type** | Tempting to auto-detect whether upload is image vs video. But the conversion pipeline is different, and text input has no file to detect. | Explicit type selector. Clear, predictable, no magic. |
| **More than 2 items in comparison** | Neurons AI supports up to 6. But NeuroCut's results are data-dense (brain viewer, timeline, segments, metrics). More than 2 becomes unreadable. | Start with 2. If users demand more, add a summary table view for 3+ (no brain viewers, just metric bars). |
| **Real-time A/B testing (live traffic splitting)** | TubeBuddy splits real YouTube traffic. NeuroCut uses predictive neural inference, not live traffic. These are fundamentally different paradigms. | Call it "neural comparison" not "A/B testing." The value is predictive brain response, not CTR measurement. |
| **AI-generated recommendations / copy suggestions** | Neurons AI gives "AI insights with actionable recommendations." Adding an LLM layer on top of brain data is a separate product feature with its own complexity. | Show the data clearly. Let creators interpret their own brain activation scores. Save AI recommendations for a future milestone. |
| **Batch comparison (upload many, auto-compare all)** | Over-engineering for v5.0. Neurons AI's folder comparison is for enterprise teams testing dozens of variants. | Support manual 1:1 comparison. Batch is a v6+ feature if demand exists. |
| **Video-length text rendering** | Rendering text as a long video (30+ seconds) makes no sense. A static text card held for 2-5 seconds is sufficient for TRIBE v2 to process. | Cap text-to-visual conversion at 5 seconds. For spoken mode, duration is natural TTS length. |

## Feature Dependencies

```
Content Type Selector (upload page)
  |-> Image Upload (extends AnimatedFileUpload)
  |-> Text Input Component (new)
  |     |-> Visual Mode (text -> image -> video pipeline)
  |     |-> Spoken Mode (text -> TTS -> audio pipeline, native TRIBE v2)
  |-> Server-side Conversion API (image->video, text->image->video, text->TTS)

Database Schema Update (add content_type to jobs)
  |-> Content Type Badge (dashboard, discover, results)
  |-> Results Page Adaptations (conditional VideoPlayer vs ImageViewer vs TextCard)
  |-> Analysis Picker (filter by content type)

Analysis Picker
  |-> Comparison Page (/compare)
  |     |-> Metric Deltas
  |     |-> Synced Brain Viewers (differentiator, can defer)
  |     |-> Shareable Comparison Links (differentiator, can defer)

Results Page "Test Variation" button -> Upload page with pre-fill
```

## MVP Recommendation

**Must ship (table stakes):**
1. Content type selector on upload page (Video / Image / Text)
2. Image upload with preview and server-side silent video conversion
3. Text input with visual mode (render to styled card -> image -> video)
4. Text input with spoken mode (native TRIBE v2 TTS path)
5. `content_type` column in jobs table + badges everywhere
6. Results page conditional rendering (no video player for images/text)
7. Comparison page with analysis picker and side-by-side metrics

**Should ship (high-value differentiators):**
8. Metric delta annotations in comparison (trivial to add)
9. Cross-type comparison support (UI already handles it if comparison page is type-agnostic)
10. Text input dual-mode toggle with clear explanation

**Defer:**
- Synced brain viewers in comparison (performance risk, can add later)
- Shareable comparison links (nice but not blocking)
- Quick re-test with variation (quality-of-life, not core)
- Any form of batch comparison

## Competitive Positioning

| Capability | Neurons AI | alpha.one | TubeBuddy | NeuroCut v5.0 |
|-----------|------------|-----------|-----------|----------------|
| Image input | Yes (drag-drop) | Yes | No (thumbnail only) | Yes |
| Video input | Yes | Yes (YouTube ads) | No | Yes |
| Text/copy input | Indirect (render first) | No | Title testing only | Yes (visual + spoken) |
| Comparison | Up to 6 assets | A/B with benchmarks | A/B with live traffic | 2 analyses, any type |
| Brain data | No (attention prediction) | No (attention prediction) | No (CTR only) | Yes (20K-vertex fMRI) |
| Heatmap overlay | Yes (core feature) | Yes | No | No (3D brain instead) |
| Metrics | Focus, Memory, Engagement, Clarity, Cognitive Demand (0-100) | Attention, Stand-out, Brand linkage (traffic light) | CTR, Views, Watch time | Activation, Arousal, Valence, 9 brain regions (0-100) |
| Pricing | Enterprise ($$$) | Enterprise ($$$) | $8-50/mo | TBD (credits) |

**NeuroCut's moat:** Real brain activation data (not attention prediction), multi-modal input with dual text modes, cross-type neural comparison. Competitors predict where eyes look; NeuroCut predicts how brains respond.

## Sources

- [Neurons AI Product Page](https://www.neuronsinc.com/neurons-ai) -- feature overview, comparison up to 6 assets
- [Neurons AI Knowledge Base: Running Predictions](https://knowledge.neuronsinc.com/how-to-run-your-first-prediction) -- upload flow, drag-drop, auto-prediction
- [Neurons AI Knowledge Base: Comparison Tool](https://knowledge.neuronsinc.com/comparison-tool) -- side-by-side UI, folder comparison
- [Neurons AI Knowledge Base: Metrics](https://knowledge.neuronsinc.com/neurons-ai-metrics-and-explanations) -- Focus, Cognitive Demand, Engagement, Memory scores (0-100)
- [alpha.one Homepage](https://www.alpha.one/) -- junbi (video) and expoze (static) products, traffic-light scoring
- [alpha.one YouTube Ad Testing](https://www.alpha.one/use-cases/youtube-ad-testing) -- second-by-second insights, benchmark database
- [TubeBuddy Thumbnail A/B Testing](https://www.tubebuddy.com/tools/youtube-thumbnail-test) -- live traffic splitting, 95% statistical significance, CTR tracking
- [ThumbnailTest.com Features](https://thumbnailtest.com/features/) -- unlimited variants, CTR/impressions/clicks filtering
- [TRIBE v2 GitHub Repository](https://github.com/facebookresearch/tribev2) -- multi-modal inference API (video, audio, text)
- [Meta AI Blog: TRIBE v2](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/) -- architecture, three frozen encoders, cortical surface mapping

---
*Feature research for: NeuroCut Multi-Modal Input & Comparison (v5.0)*
*Researched: 2026-04-11*
