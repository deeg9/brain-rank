# Domain Pitfalls: Multi-Modal Input & Comparison

**Domain:** Adding image/text input to a video-only neural inference pipeline + comparison UI for mixed content types
**Researched:** 2026-04-11
**Confidence:** HIGH for inference pipeline pitfalls (verified against TRIBE v2 source, handler.py, schema.py), MEDIUM for UX/comparison pitfalls (based on established patterns + domain reasoning)

---

## Critical Pitfalls

Mistakes that cause rewrites, broken inference, or user trust damage.

### Pitfall 1: Image-to-Video Is Out-of-Distribution and Scores Are Not Comparable to Real Video

**What goes wrong:**
A static image converted to video via `ImageClip(duration=N)` produces a clip with zero temporal variation -- every frame is identical. TRIBE v2's V-JEPA2 feature extractor was trained on naturalistic video with motion, scene changes, and temporal dynamics. A frozen frame is fundamentally out-of-distribution input. The model will produce predictions, but they reflect "brain response to staring at one unchanging image" -- a stimulus type not present in the 700+ subject fMRI training set. The resulting neural scores are not on the same scale as video scores, and directly comparing them on a leaderboard or in a comparison view is scientifically misleading.

**Why it happens:**
The conversion is technically simple (MoviePy `ImageClip` + `write_videofile`), so it feels like a solved problem. The model accepts the input without error because modality dropout training means V-JEPA2 produces features for any video-shaped tensor. No error = false confidence that the output is valid.

**Consequences:**
- Users compare thumbnail neural scores to video neural scores on the leaderboard and draw invalid conclusions ("my thumbnail is more engaging than my video")
- Power users notice scores for static content cluster in a narrow, low range and lose trust
- NeuroCut's credibility as a neural data platform is undermined if it presents exploratory/OOD results as equivalent to validated video results

**Prevention:**
- Label image-derived scores with a visible "Exploratory" badge on every surface they appear (results page, discovery, comparison, leaderboard). Never silently mix them with video scores.
- Store `content_type` as a first-class column in the `jobs` table: `'video' | 'image' | 'text_visual' | 'text_spoken'`. This is not optional metadata -- it gates UI behavior, comparison logic, and leaderboard filtering.
- On the comparison page, show a prominent disclaimer when comparing different content types: "Image and video scores use different inference modes. Cross-type comparison is exploratory."
- Consider excluding image-type analyses from the main leaderboard entirely, or providing a separate "Thumbnails" leaderboard.
- Add a `confidence_level` field to results: `'validated'` for video, `'exploratory'` for image/text_visual.

**Detection:**
- Image analysis scores clustering in an unusually narrow range compared to video
- User complaints that "my thumbnail scores lower than my worst video"
- Support questions about score comparability

**Phase to address:**
Phase 1 (Schema + Content Type Foundation) -- `content_type` column and labeling strategy must be decided before any new input type ships.

---

### Pitfall 2: gTTS Requires Internet From Inside RunPod Containers

**What goes wrong:**
TRIBE v2's text-to-speech pipeline for `text_path` input calls `gTTS`, which is a wrapper around Google Translate's TTS API. It makes an HTTP request to `translate.google.com` for every text-to-speech conversion. RunPod serverless containers DO have internet access by default, but: (a) Google Translate can rate-limit or block IPs from cloud data centers, causing sporadic `gTTS.tts.gTTSError` failures, (b) the external dependency adds latency and a point of failure outside your control, (c) if RunPod's egress configuration changes or a firewall rule is applied, text inference silently breaks while video inference continues working.

**Why it happens:**
gTTS is listed in TRIBE v2's `pyproject.toml` dependencies and is called internally by `TextToEvents.get_events()`. Developers testing locally with residential IPs never see rate limiting. The first production failures happen under load or after running for hours from the same datacenter IP.

**Consequences:**
- Text-spoken mode fails intermittently with cryptic gTTS errors (HTTP 429 or connection refused)
- Users see "inference failed" with no useful error message
- Retry logic makes it worse (hammers Google harder, extends the block)

**Prevention:**
- Test gTTS from inside a RunPod container before committing to this path. Run 20 sequential requests from the same pod and check for rate limiting.
- Have a fallback plan ready: if gTTS is unreliable from RunPod, replace it with an offline TTS library. Kokoro-82M (82M params, runs on CPU, human-parity quality) or MeloTTS (lightweight, multilingual, CPU-only) are drop-in replacements that require no internet. This means monkey-patching or forking TRIBE v2's `TextToEvents` class.
- Wrap the gTTS call in a try/except that falls back to a local TTS model on failure, rather than failing the entire job.
- Log all gTTS failures with the HTTP status code so you can distinguish rate limiting (429) from network issues (connection refused) from Google blocking (403).

**Detection:**
- `gTTSError` in RunPod job logs
- Text-spoken jobs failing while video jobs succeed on the same pod
- Failure rate increasing with usage volume

**Phase to address:**
Phase 2 (Text Input Pipeline) -- must be validated before text-spoken mode ships. Do not promise this feature until gTTS reliability from RunPod is confirmed or an offline fallback is implemented.

---

### Pitfall 3: Handler Assumes Video-Only Input -- Schema, Validation, and Pipeline Are Hardcoded

**What goes wrong:**
The current `InputSchema` has a required `video_url: str` field. The `handler()` function calls `download_video()`, passes the path to `run_inference()` which calls `model.get_events_dataframe(video_path=...)`. Every step of the pipeline is hardcoded for video. Adding image or text support requires changes at EVERY layer:
1. `InputSchema` -- new fields (`image_url`, `text_content`, `input_type`)
2. `handler()` -- branching logic for download vs text handling
3. `inference.py` -- calling `get_events_dataframe()` with different parameters per mode
4. `postprocessor.py` -- output schema must include `content_type`
5. `OutputSchema` -- new `content_type` field
6. Frontend `Job` TypeScript type -- new columns
7. Upload page, results page, comparison page -- all need content-type awareness

If ANY layer is missed, the system breaks in subtle ways (e.g., image jobs stored with `content_type: null`, comparison page treats everything as video).

**Why it happens:**
v1.0 was correctly scoped to video-only. But the assumption "input = video" is now baked into every layer. Adding new input types is not a feature addition -- it is a schema migration that touches the full stack.

**Consequences:**
- Partial implementation leaves orphan code paths (image uploads succeed but postprocessor crashes)
- Missing `content_type` in the database means you can't distinguish old video jobs from new image jobs after the migration
- Frontend renders video player for image analyses, showing a black screen

**Prevention:**
- Map the full pipeline change before writing any code. Create a checklist: InputSchema, handler branch, inference call, postprocessor, OutputSchema, database migration, TypeScript types, upload page, results page, comparison page, discovery page.
- Add `content_type` to the `jobs` table with a migration that backfills all existing rows to `'video'`. Do this FIRST, before any new input type code.
- Make `input_type` a required field in the new `InputSchema` (with `'video'` as default for backward compatibility with any in-flight jobs).
- Use a discriminated union pattern in the schema: `input_type: Literal['video', 'image', 'text_visual', 'text_spoken']` with conditional required fields per type.

**Detection:**
- `content_type IS NULL` rows in the jobs table after migration
- Video player rendering on image analysis results
- Handler returning errors for non-video input because `video_url` is required

**Phase to address:**
Phase 1 (Schema Foundation) -- database migration and schema changes must land before any new input type pipeline code.

---

### Pitfall 4: MoviePy ImageClip Produces Corrupted or Incompatible Video Files

**What goes wrong:**
`ImageClip` from MoviePy has several documented failure modes when converting static images to video:
1. **No explicit duration = infinite clip**: `ImageClip("image.jpg")` has infinite duration by default. Calling `write_videofile()` without setting duration hangs or writes until disk is full.
2. **Small images produce corrupted output**: Images below ~256px on either dimension can produce corrupted MP4 files that ffmpeg decodes incorrectly or TRIBE v2's video loader rejects.
3. **Grayscale/RGBA images break compositing**: Grayscale (1-channel) or RGBA (4-channel) images fail silently or produce green/corrupted frames. TRIBE v2's V-JEPA2 expects RGB.
4. **FPS mismatch**: If the generated video has 1 fps (common default for still-image video), V-JEPA2 may process it differently than 24/30fps naturalistic video, further pushing the input out of distribution.
5. **No audio track**: An ImageClip-generated video has no audio. When TRIBE v2 calls `get_events_dataframe(video_path=...)`, it extracts audio. An empty/missing audio track may cause the audio feature extractor to produce zero tensors or raise an error.

**Why it happens:**
MoviePy is designed for video editing, not for converting single images to model input. Its ImageClip is a convenience class that handles edge cases poorly because it is designed for compositing, not export.

**Consequences:**
- TRIBE v2 inference silently crashes or produces garbage output from corrupted input
- Users upload a perfectly valid JPEG and get "inference failed" with no explanation
- Audio feature extractor crashes or produces zeros, skewing brain predictions

**Prevention:**
- Build a robust `image_to_video()` conversion function with explicit guards:
  ```python
  def image_to_video(image_path, output_path, duration=5.0, fps=24):
      img = Image.open(image_path).convert("RGB")  # Force RGB
      w, h = img.size
      # Ensure minimum dimensions (V-JEPA2 friendly)
      if w < 256 or h < 256:
          img = img.resize((max(w, 256), max(h, 256)), Image.LANCZOS)
      # Ensure even dimensions (ffmpeg h264 requirement)
      w, h = img.size
      w, h = w - (w % 2), h - (h % 2)
      img = img.resize((w, h))
      clip = ImageClip(np.array(img)).with_duration(duration).with_fps(fps)
      clip.write_videofile(str(output_path), codec="libx264", audio=False)
  ```
- Generate a silent audio track explicitly rather than relying on TRIBE v2 to handle missing audio. Use `ffmpeg` to add a silent audio stream: `ffmpeg -i video.mp4 -f lavfi -i anullsrc=r=16000:cl=mono -shortest output.mp4`.
- Validate the output video file size and duration before passing to inference. A 0-byte or <1KB file indicates corrupted output.
- Test with: JPEG, PNG, WebP, grayscale, RGBA, 100x100, 4000x3000, landscape, portrait, square.

**Detection:**
- TRIBE v2 `get_events_dataframe()` raising exceptions on image-derived videos
- Audio feature extractor producing all-zero tensors
- Output video file size being implausibly small (<10KB for a 5-second video)

**Phase to address:**
Phase 2 (Image Pipeline) -- build and thoroughly test `image_to_video()` before connecting it to the inference pipeline.

---

### Pitfall 5: Video-Only Mode vs Multimodal Mode Switching Creates a Dual-Pipeline Maintenance Burden

**What goes wrong:**
The v5.0 plan requires TWO distinct inference modes:
1. **Video-only mode** (for images): `model.get_events_dataframe(video_path=converted_video)` -- sends the image-as-video through V-JEPA2 only, no audio, no text.
2. **Full multimodal mode** (for text-spoken): `model.get_events_dataframe(text_path=text_file)` -- triggers gTTS, audio extraction, WhisperX transcription, and all three feature extractors.

These are fundamentally different code paths through TRIBE v2 with different dependencies (gTTS, WhisperX), different failure modes, different latencies (text-spoken adds TTS + transcription overhead), and different output characteristics. But they both return the same `(predictions, segments)` tuple that the postprocessor must handle identically.

**Why it happens:**
TRIBE v2's API is designed for research flexibility ("pass any modality"), not for production routing. The model doesn't distinguish between "I'm doing video-only because the input is a static image" and "I'm doing video-only because I want to test visual-only predictions." The distinction matters for NeuroCut's UX and data interpretation but not for the model API.

**Consequences:**
- Bug in one mode silently affects the other (shared postprocessor, shared schema)
- Text-spoken mode failures (gTTS) get reported as generic "inference failed" because error handling doesn't distinguish modes
- Latency estimates on the processing page are wrong (video: ~12 min, text-spoken: maybe 2-3 min, image: maybe 1-2 min) but the UI shows one estimate
- VRAM usage differs between modes (text-spoken loads LLaMA 3.2 + Wav2Vec-BERT; video-only loads only V-JEPA2), causing potential OOM on smaller GPUs if modes alternate

**Prevention:**
- Make `input_type` the first branch point in the handler, before any processing:
  ```python
  if params.input_type == 'video':
      # existing video pipeline
  elif params.input_type == 'image':
      # convert image, then video-only inference
  elif params.input_type == 'text_spoken':
      # write text file, then text-path inference
  elif params.input_type == 'text_visual':
      # render text to image, convert to video, video-only inference
  ```
- Each branch has its OWN try/except with mode-specific error types. Never let a gTTS error be reported as "inference failed."
- Track inference timing per mode separately. Store `inference_mode` in the job results so the frontend can show accurate ETAs.
- Test each mode independently AND test mode alternation (image job followed immediately by text-spoken job on the same warm container) to catch VRAM fragmentation.

**Detection:**
- Different modes producing statistically different score distributions (expected but must be documented)
- OOM errors on A40 when switching from video-only to text-spoken mode
- Processing page showing "~12 min" for a text input that actually takes 2 minutes

**Phase to address:**
Phase 2 (Pipeline Branching) -- define the handler routing and per-mode error handling before implementing any new mode.

---

## Moderate Pitfalls

### Pitfall 6: Text-Visual Mode Is Double Out-of-Distribution

**What goes wrong:**
"Text visual mode" renders text onto a styled card image, converts that image to video, then runs video-only inference. This means the model sees a synthetic image (rendered text on a colored background) that has been looped into a video. This is doubly out-of-distribution: neither the visual content (rendered text, not a natural scene) nor the temporal structure (static, no motion) match the training data. The resulting predictions will likely reflect "brain response to looking at a blank-ish uniform image" rather than anything meaningful about the text content.

**Why it happens:**
It sounds logical: "If we can do image-to-video for thumbnails, we can render text as an image and do the same thing." But a thumbnail is at least a natural photograph. Rendered text on a solid background has almost no visual features for V-JEPA2 to extract.

**Prevention:**
- Clearly document that text-visual mode exists for completeness but is the LEAST reliable mode.
- Consider whether text-visual mode should even exist -- text-spoken mode (which uses TRIBE v2's native text pipeline) produces vastly more meaningful predictions because it uses the LLaMA 3.2 text encoder.
- If text-visual ships, mark it as "Experimental" with a tooltip explaining that predictions are based on visual appearance only, not semantic content.
- Run a validation study: compare text-visual scores for semantically different text (e.g., "BREAKING NEWS" vs "Grocery List") to see if the model produces meaningfully different predictions. If scores are indistinguishable, the mode is not useful.

**Phase to address:**
Phase 3 (Text Input) -- may decide to defer or drop text-visual after evaluating text-spoken.

---

### Pitfall 7: Comparison Page Implies Score Equivalence Across Content Types

**What goes wrong:**
A side-by-side comparison view that shows two neural score charts with the same axes, same colors, and same scale implicitly tells the user "these numbers are directly comparable." When comparing a 60-second video (validated, full multimodal inference) with a thumbnail image (exploratory, video-only inference of a frozen frame), the visual parity of the charts is misleading.

**Why it happens:**
The natural UI for "compare two things" is to put them side by side with matching scales. This is correct when comparing two videos but incorrect when comparing a video with an image.

**Prevention:**
- When content types differ, show a comparison mode disclaimer at the top of the page: "You are comparing different content types. Neural scores are generated using different inference modes and are not directly comparable."
- Visually differentiate the two sides: use a subtle background tint or border style per content type. Video results get the standard treatment; image results get a dashed border and "Exploratory" chip.
- Disable or gray out "difference" calculations (e.g., "Video scored 12% higher than image") when content types differ. The delta is meaningless.
- Consider restricting comparison to same content type only for v5.0, and allowing cross-type comparison in a later version with proper disclaimers.
- On the comparison picker UI, group analyses by content type and show a warning icon when the user selects two different types.

**Phase to address:**
Phase 5 (Comparison View) -- the comparison UI must be content-type-aware from day one.

---

### Pitfall 8: Database Schema Not Designed for Multi-Input From the Start

**What goes wrong:**
The current `jobs` table has `video_url text NOT NULL`. For image and text inputs, this column is semantically wrong: an image analysis doesn't have a video URL (it has an image URL that was converted), and a text analysis has no URL at all (it has text content). Teams either: (a) stuff the image URL into `video_url` and lose clarity, (b) make `video_url` nullable and break existing queries, or (c) add `image_url`, `text_content` as separate columns creating a sparse schema.

**Why it happens:**
The schema was correctly designed for video-only. Retrofitting a new input paradigm onto an existing schema is always a design challenge.

**Prevention:**
- Rename `video_url` to `source_url` (nullable) and add:
  - `content_type text NOT NULL DEFAULT 'video'` -- discriminator
  - `source_text text` -- for text inputs (nullable)
  - `source_media_url text` -- URL to the original uploaded media (nullable, for video and image)
  - `converted_video_url text` -- URL to the converted video file (nullable, for image-to-video results)
- Backfill existing rows: `UPDATE jobs SET content_type = 'video', source_media_url = video_url`.
- Do NOT make `video_url` nullable without a migration that moves data first. Queries like `SELECT video_url FROM jobs WHERE ...` exist throughout the codebase and will break.
- Add a CHECK constraint: `CHECK (content_type IN ('video', 'image', 'text_visual', 'text_spoken'))`.
- Update the `Job` TypeScript interface and all frontend queries in the same migration PR.

**Detection:**
- `NULL` values in `video_url` for image/text jobs
- Frontend showing "undefined" or broken video players for non-video jobs
- Supabase Storage paths mixed with RunPod input URLs in the same column

**Phase to address:**
Phase 1 (Schema Migration) -- must be the very first change, before any pipeline or UI work.

---

### Pitfall 9: Upload Page Type Selector Creates User Confusion About What They're Testing

**What goes wrong:**
Users select "Image" and upload a thumbnail, expecting to learn "will this thumbnail get clicks?" But what they actually get is "how does a brain respond to staring at this image for 5 seconds?" -- a fundamentally different question. Similarly, "Text (Visual)" sounds like it tests copywriting effectiveness, but it actually tests "how does a brain respond to looking at text rendered on a card." User expectations and system capabilities are misaligned.

**Why it happens:**
The feature names imply business utility ("test your thumbnail", "test your copy") but the model provides neuroscience data ("predicted fMRI response to stimulus"). The gap between what users think they're buying and what the model actually does creates disappointment and churn.

**Consequences:**
- Users upload thumbnails, get low scores, conclude "NeuroCut doesn't work" because they expected thumbnail-specific analysis
- "Text visual" scores are near-random, eroding trust in ALL of NeuroCut's predictions
- Support burden from users asking "why did my thumbnail score lower than a video?"

**Prevention:**
- Write clear, honest copy on the upload page for each mode:
  - **Video:** "Full neural analysis of your video content. Tracks brain response to visuals, audio, and speech across every 2-second segment."
  - **Image:** "Exploratory: Predicts brain response to viewing this image as a static visual. Scores are not directly comparable to video scores. Best for comparing thumbnails against each other."
  - **Text (Spoken):** "Analyzes brain response to hearing this text spoken aloud. Uses TRIBE v2's native text-to-speech pipeline."
  - **Text (Visual):** "Experimental: Predicts brain response to viewing rendered text. Limited predictive value -- consider Spoken mode instead."
- Gate text-visual behind a "Show experimental modes" toggle. Don't show it by default.
- On results pages, always show the inference mode used, not just the content type.

**Phase to address:**
Phase 3 (Upload Page Redesign) -- copy and expectation management must be finalized before shipping new input types.

---

### Pitfall 10: Silent Audio Track for Image-to-Video Causes Unexpected Model Behavior

**What goes wrong:**
When an image is converted to video, there is no audio. TRIBE v2's `get_events_dataframe(video_path=...)` automatically extracts audio and runs it through Wav2Vec-BERT. With silence, the audio feature extractor either: (a) produces zero tensors (acceptable -- modality dropout handles this), or (b) produces noise-floor features that the model interprets as ambient sound, subtly biasing predictions. Which behavior occurs depends on whether the silent audio track is truly digital silence (all-zero samples) or has encoding artifacts (dithering noise, DC offset).

**Why it happens:**
ffmpeg's silent audio generation (`anullsrc`) produces clean digital silence, but MoviePy's `write_videofile` without audio may produce no audio stream at all (not silence -- ABSENCE of audio). TRIBE v2's audio extraction may handle these two cases differently.

**Prevention:**
- Explicitly choose between two strategies and test both:
  - **Strategy A: No audio track.** Generate video with `audio=False`. Test that TRIBE v2 handles the missing audio stream gracefully (zeroing out audio features via modality dropout).
  - **Strategy B: Explicit silence.** Add a silent audio track with `ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono`. Test that Wav2Vec-BERT produces zero/near-zero features for silence.
- Whichever strategy produces more consistent results in testing, standardize on it.
- Compare predictions with and without the audio track for the same image-as-video. If they differ significantly, the model IS using the audio features even for "silent" input.
- For v5.0, recommend Strategy A (no audio) and calling `get_events_dataframe(video_path=..., audio_path=None)` if the API supports it, to explicitly signal "no audio modality."

**Phase to address:**
Phase 2 (Image Pipeline) -- test during image-to-video conversion implementation.

---

## Minor Pitfalls

### Pitfall 11: Comparison Picker UX Is Harder Than It Looks

**What goes wrong:**
Letting users pick "any two completed analyses" sounds simple, but the picker needs to: (a) paginate through potentially hundreds of analyses, (b) show enough context per item (title, type, score, date) to make selection meaningful, (c) handle the case where a user has only 0 or 1 analyses, (d) pre-select when arriving from a results page ("compare this with..."), and (e) show the content type for each selectable item so users know when they're crossing types.

**Prevention:**
- Design the picker before building the comparison view. It is the hardest UI component.
- Default behavior: results page has a "Compare" button that pre-selects the current analysis and opens the picker for the second.
- Show content type badges in the picker list. Show a warning when cross-type selection is made.
- Require minimum 2 completed analyses before showing the "Compare" feature at all.

**Phase to address:**
Phase 5 (Comparison View).

---

### Pitfall 12: Inference Latency Varies Wildly By Content Type

**What goes wrong:**
Video inference takes ~12 minutes for 60 seconds of content. Image inference (5-second static video, no audio) might take 1-2 minutes. Text-spoken inference (gTTS + WhisperX + full multimodal) might take 3-5 minutes depending on text length. The processing page currently shows a single progress indicator calibrated for video. Users submitting an image will think inference is stuck or broken when the progress bar sits at "Processing..." for 90 seconds with no granular updates.

**Prevention:**
- Store expected latency ranges per content type in a config:
  ```
  video: 8-15 min
  image: 1-3 min
  text_spoken: 2-5 min
  text_visual: 1-3 min
  ```
- Show content-type-aware ETAs on the processing page.
- For short inferences (image, text), consider not showing the processing page at all -- redirect to results with a "Processing..." skeleton that resolves quickly.

**Phase to address:**
Phase 4 (Processing Page Adaptation).

---

### Pitfall 13: Text Input Length Has No Obvious Limit

**What goes wrong:**
Users paste an entire blog post (2000+ words) into the text input. gTTS generates a 10-minute audio file. TRIBE v2 processes it as a 10-minute stimulus. Inference takes 2 hours. The user gets a bill for extended GPU time and a result that is not meaningfully different from processing just the first 100 words.

**Prevention:**
- Enforce a character limit on text input (500 characters / ~100 words). This produces roughly 30-60 seconds of spoken audio, matching the existing video sweet spot.
- Show a real-time character counter with remaining characters.
- Explain the limit: "TRIBE v2 predicts brain response to 2-second segments. Short, punchy text (like titles, hooks, CTAs) produces the most actionable results."

**Phase to address:**
Phase 3 (Text Input UI).

---

## Integration Gotchas

Common mistakes when connecting multi-modal features to existing NeuroCut systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| RunPod handler + new input types | Adding `image_url` and `text_content` as optional fields alongside required `video_url`, creating ambiguous input where multiple fields are populated | Use a discriminated union: `input_type` is required, and exactly one of `video_url`, `image_url`, `text_content` is present based on `input_type`. Validate with Pydantic `model_validator`. |
| Supabase Storage + image uploads | Uploading images to the same bucket as videos. Images are small (KB), videos are large (MB-GB). Different access patterns, different lifecycle. | Create a separate `images` bucket. Keep existing `videos` bucket. Add a `media` bucket for converted files (image-to-video). |
| Results page + content_type | Rendering the video player component for all analyses. Image and text analyses have no meaningful video to play back. | Branch the results page on `content_type`: video gets player, image gets the original image display, text gets the input text rendered in a card. |
| Discovery page + mixed content | Showing all content types in one feed with identical card layouts. Users can't distinguish video analyses from image analyses at a glance. | Add content type icon/badge on discovery cards. Allow filtering by content type. |
| Postprocessor + segments | Assuming all segments have equal duration (2s). Image analyses of 5-second converted video produce only 2-3 segments. Text-spoken analyses produce variable segments based on text length. | Frontend must handle variable segment counts gracefully. Neural timeline chart must scale X-axis to actual segment count. |
| RunPod job creation + server-side conversion | Converting image-to-video on the Next.js server (API route). Server has no ffmpeg, no GPU, limited memory. | Conversion must happen inside the RunPod container where ffmpeg is already installed. Send the raw image URL to RunPod; let the handler do the conversion. Alternatively, use a lightweight conversion service, but the RunPod handler is simplest. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Image-to-video conversion on every request | Same thumbnail analyzed multiple times generates a new video each time | Cache converted videos keyed by source image hash. Check cache before converting. | When users re-analyze the same image |
| All content types in one leaderboard query | Content type filter requires scanning all public rows | Add partial indexes per content type: `CREATE INDEX ON jobs(score DESC) WHERE is_public AND content_type = 'video'` | 500+ public analyses across types |
| gTTS latency added to inference time | Text-spoken jobs take 30-60s longer than expected from TTS overhead alone | Pre-generate TTS audio in the handler before starting inference. Log TTS time separately from inference time. | Always present, but invisible until you measure it |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Same results page layout for all content types | Image analysis shows empty video player, text analysis shows irrelevant "video segments" | Content-type-aware results layout: image shows the original image + neural heatmap, text shows the input text + timeline of predicted response to each segment |
| No visual cue that image scores are exploratory | Users treat image scores as equally valid as video scores | Persistent "Exploratory" badge, different score accent color (amber instead of green), tooltip explaining limitations |
| Comparison page with no content type awareness | Users compare video vs image and think the 30% score difference means something | Show content type badges on each comparison panel. Disable delta/difference displays for cross-type comparisons. Show disclaimer banner. |
| Upload page type selector without explanation | Users guess what each mode does, pick wrong one | Inline help text per mode. Default to "Video" (the validated mode). Other modes show brief description of what they actually test. |
| Text input looks like a "test your copy" tool | Users expect A/B testing of copywriting, get brain activation prediction instead | Frame as "Predict neural response to hearing this text" not "Test your copy." Avoid marketing language that overpromises. |

## "Looks Done But Isn't" Checklist

- [ ] **Schema:** `content_type` column exists on `jobs` table with backfill for existing rows as `'video'`
- [ ] **Schema:** `video_url` renamed or aliased, non-video jobs don't have forced video URL
- [ ] **Handler:** Input validation uses discriminated union (exactly one source per input_type)
- [ ] **Handler:** Each input type has its own error handling with mode-specific error types
- [ ] **Image conversion:** Handles grayscale, RGBA, small dimensions, missing audio track
- [ ] **Image conversion:** Output video validated before inference (file size, duration, codec)
- [ ] **gTTS:** Tested from RunPod container at volume (20+ sequential requests)
- [ ] **gTTS:** Fallback plan documented or implemented for rate limiting
- [ ] **Text input:** Character limit enforced (frontend + backend)
- [ ] **Results page:** Branches on content_type (no video player for images/text)
- [ ] **Discovery page:** Content type badge on cards, filter by type
- [ ] **Comparison page:** Cross-type disclaimer shown, deltas disabled for mixed types
- [ ] **Processing page:** Content-type-aware ETA estimates
- [ ] **Leaderboard:** Image/text analyses clearly labeled or in separate leaderboard
- [ ] **TypeScript types:** `Job` interface includes `content_type` field
- [ ] **Score labeling:** "Exploratory" badge on all non-video results surfaces

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Image OOD scores not comparable (Pitfall 1) | Phase 1 (Schema) + Phase 5 (Comparison) | Test: leaderboard shows content type badges, comparison shows cross-type disclaimer |
| gTTS internet dependency (Pitfall 2) | Phase 2 (Text Pipeline) | Test: 20 sequential gTTS calls from RunPod pod succeed, OR offline fallback works |
| Handler hardcoded for video (Pitfall 3) | Phase 1 (Schema) + Phase 2 (Pipeline) | Test: handler accepts image_url input, routes to image pipeline, returns results with content_type |
| MoviePy ImageClip failures (Pitfall 4) | Phase 2 (Image Pipeline) | Test: JPEG, PNG, WebP, grayscale, RGBA, 100x100, 4000x3000 all produce valid video |
| Dual pipeline maintenance (Pitfall 5) | Phase 2 (Pipeline Branching) | Test: video job then image job then text job on same warm container, all succeed |
| Text-visual double OOD (Pitfall 6) | Phase 3 (Text Input) | Decision: ship or defer based on validation study |
| Comparison implies equivalence (Pitfall 7) | Phase 5 (Comparison View) | Test: cross-type comparison shows disclaimer, deltas disabled |
| Schema not multi-input ready (Pitfall 8) | Phase 1 (Schema Migration) | Test: `content_type` column exists, existing rows backfilled to 'video' |
| User expectation mismatch (Pitfall 9) | Phase 3 (Upload Redesign) | UX review: copy accurately describes each mode |
| Silent audio track behavior (Pitfall 10) | Phase 2 (Image Pipeline) | Test: compare predictions with/without audio track for same image |
| Text length unbounded (Pitfall 13) | Phase 3 (Text Input) | Test: 501-character input rejected with helpful message |

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Image scores misleadingly presented as equivalent to video | MEDIUM | Retroactively add "Exploratory" badges. Email users who compared cross-type. Cannot undo conclusions already drawn. |
| gTTS blocked by Google from RunPod IPs | LOW | Switch to offline TTS (Kokoro/MeloTTS). Fork TRIBE v2's TextToEvents class. One-time effort but requires testing. |
| Missing content_type in database | MEDIUM | Add column, backfill existing as 'video', update all queries. Must coordinate frontend + backend deployment. |
| Users lost trust due to misleading image scores | HIGH | Trust damage is hard to undo. Requires transparent communication about what each mode does and doesn't promise. |
| MoviePy producing corrupted videos in production | LOW | Add validation step. Retry with adjusted parameters. Log specific failures for debugging. |

## Sources

- [TRIBE v2 GitHub Repository](https://github.com/facebookresearch/tribev2) -- API patterns, modality handling, gTTS dependency confirmed in TextToEvents
- [TRIBE v2 Demo Notebook](https://github.com/facebookresearch/tribev2/blob/main/tribe_demo.ipynb) -- inference API: `get_events_dataframe()` + `predict()`
- [Meta AI Blog: TRIBE v2](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/) -- modality dropout training (each modality independently zeroed with p=0.3)
- [MoviePy ImageClip Documentation](https://zulko.github.io/moviepy/reference/reference/moviepy.video.VideoClip.ImageClip.html) -- infinite duration default, compositing behavior
- [MoviePy ImageClip Corruption Issue #1876](https://github.com/Zulko/moviepy/issues/1876) -- small image corruption
- [MoviePy Monochrome Issue #1664](https://github.com/Zulko/moviepy/issues/1664) -- grayscale image failures
- [gTTS Documentation](https://gtts.readthedocs.io/) -- requires internet, calls Google Translate API
- [gTTS PyPI](https://pypi.org/project/gTTS/) -- confirms HTTP dependency
- [Kokoro-82M TTS](https://bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models) -- offline TTS alternative, 82M params, CPU-capable
- [MeloTTS](https://northflank.com/blog/best-open-source-text-to-speech-models-and-how-to-run-them) -- lightweight offline TTS alternative
- NeuroCut codebase: `src/handler.py`, `src/inference.py`, `src/schema.py` -- current video-only pipeline
- NeuroCut codebase: `web/src/lib/database.types.ts` -- current Job type with `video_url` required
- NeuroCut codebase: `web/src/app/(app)/upload/page.tsx` -- current video-only upload UI

---
*Pitfalls research for: NeuroCut v5.0 Multi-Modal Input & Comparison*
*Researched: 2026-04-11*
