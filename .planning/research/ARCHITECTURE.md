# Architecture: Multi-Modal Input & Comparison Integration

**Domain:** Neural engagement testing platform (multi-modal expansion)
**Researched:** 2026-04-11

## Executive Summary

NeuroCut v5.0 adds image upload, text input (visual + spoken modes), and a comparison page to the existing video-only pipeline. The core insight driving the architecture: **TRIBE v2 natively supports `text_path` (`.txt` file) via `get_events_dataframe(text_path=...)`**, which converts text to speech internally using gTTS, then runs audio-only inference. This means the "spoken text" path requires zero media conversion -- just save text to a file and pass it directly. Image and "visual text" paths require server-side conversion to video (via ffmpeg on the RunPod worker), since TRIBE v2 only accepts `video_path`, `audio_path`, or `text_path`.

The comparison page is purely a frontend concern -- two existing result views side-by-side with no backend changes needed beyond querying two jobs.

## Current Architecture (Baseline)

```
Browser                    Next.js API Routes          Supabase              RunPod
  |                              |                        |                    |
  |-- uploadVideo(file) -------->|-- Storage.upload ------>| videos bucket      |
  |                              |                        |                    |
  |-- createJob(videoUrl) ------>|-- jobs.insert --------->| jobs table         |
  |                              |-- POST /run ----------->|                    |-- handler(job)
  |                              |                        |                    |    download_video()
  |-- GET /api/jobs/[id] ------->|-- poll /status/[rpid] ->|                    |    run_inference()
  |                              |-- jobs.update --------->|                    |    postprocess()
  |                              |                        |                    |
  |-- /results/[id] page ------->|                        |                    |
```

Key touchpoints for modification:
- `web/src/app/(app)/upload/page.tsx` -- upload UI (video-only)
- `web/src/app/(app)/upload/actions.ts` -- `createJob(videoUrl)` server action
- `web/src/lib/upload.ts` -- `uploadVideo(file)` to Supabase Storage
- `web/src/lib/database.types.ts` -- `Job` interface (video_url field, no input_type)
- `src/handler.py` -- RunPod handler (video_url only in InputSchema)
- `src/schema.py` -- `InputSchema(video_url: str)` 
- `src/inference.py` -- `run_inference(model, video_path, job_id)`
- `web/src/app/(app)/results/[id]/page.tsx` -- shows VideoPlayer + BrainViewer

## Recommended Architecture

### Three Input Paths, One Inference Output

All three input types ultimately produce the same `OutputSchema` (segments, summary, raw_shape). The difference is what happens *before* inference.

```
INPUT TYPE        FRONTEND           SERVER ACTION          RUNPOD HANDLER
-----------       --------           -------------          ---------------
Video             File upload        createJob(videoUrl)    download_video() -> run_inference(video_path=...)
                  (existing)         (existing)             (existing, no changes)

Image             File upload        createJob(mediaUrl,    download_image() -> ffmpeg_to_video() ->
                  (JPEG/PNG)         inputType='image')     run_inference(video_path=...)

Text (visual)     Text textarea      createJob(null,        render_text_card() -> ffmpeg_to_video() ->
                  + style picker     inputType='text_v',    run_inference(video_path=...)
                                     textContent='...')

Text (spoken)     Text textarea      createJob(null,        save_text_to_file() ->
                                     inputType='text_s',    model.get_events_dataframe(text_path=...)
                                     textContent='...')     -> model.predict()
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Upload Page (modified) | Input type selector, type-specific UI, validation | Server action, Supabase Storage |
| `createJob` action (modified) | Insert job with input_type, text_content; dispatch to RunPod with new payload | Supabase, RunPod API |
| `uploadMedia` lib (new) | Upload image/video to Supabase Storage, return public URL | Supabase Storage |
| RunPod InputSchema (modified) | Accept video_url OR text_content + input_type | handler.py |
| Media Converter (new, RunPod-side) | Image-to-video, text-card-to-video via ffmpeg/Pillow | handler.py, ffmpeg |
| Inference wrapper (modified) | Route to correct `get_events_dataframe` call based on input_type | TRIBE v2 model |
| Results page (modified) | Conditionally show/hide VideoPlayer based on input_type | API, components |
| Comparison page (new) | Side-by-side two completed analyses | API (two job fetches) |

### Data Flow: Image Upload

```
1. User drops JPEG/PNG on upload zone
2. Frontend uploads to Supabase Storage (same 'videos' bucket, or new 'media' bucket)
3. createJob(mediaUrl, inputType='image') inserts job + dispatches to RunPod:
   { input: { media_url: "https://...", input_type: "image", job_id: "..." } }
4. RunPod handler:
   a. Downloads image to /tmp/job_id.jpg
   b. Converts to 2-second silent video via ffmpeg:
      ffmpeg -loop 1 -i input.jpg -c:v libx264 -t 2 -pix_fmt yuv420p -r 1 output.mp4
   c. Calls model.get_events_dataframe(video_path=output.mp4)
   d. Calls model.predict(events=df)
   e. Returns OutputSchema (will have 1 segment for the 2s window)
5. Polling + results display as normal (but no video player -- show static image)
```

**Why 2 seconds:** TRIBE v2 uses 2-second windows. A single still frame stretched to 2s gives exactly one segment of brain activation data -- which is all you need for a thumbnail/image test.

### Data Flow: Text (Spoken Mode)

```
1. User types text in textarea, selects "Spoken" mode
2. createJob(null, inputType='text_s', textContent='...') inserts job + dispatches:
   { input: { text_content: "...", input_type: "text_spoken", job_id: "..." } }
3. RunPod handler:
   a. Saves text to /tmp/job_id.txt (UTF-8 .txt file)
   b. Calls model.get_events_dataframe(text_path="/tmp/job_id.txt")
      - TRIBE v2 internally: gTTS converts text to speech -> WhisperX transcribes
        for word-level timings -> extracts LLaMA + Wav2Vec features
   c. Calls model.predict(events=df)
   d. Returns OutputSchema (segments based on text duration)
4. Results page shows text content + brain viewer + timeline (no video player)
```

**Key finding:** `get_events_dataframe` accepts `text_path` natively. No conversion needed. TRIBE v2 handles TTS internally. This is the simplest path -- HIGH confidence from GitHub source.

### Data Flow: Text (Visual Mode)

```
1. User types text in textarea, selects "Visual" mode, picks style/font/color
2. createJob(null, inputType='text_v', textContent='...', textStyle={...}) 
   inserts job + dispatches:
   { input: { text_content: "...", input_type: "text_visual", 
              text_style: { font: "Inter", bg: "#000", color: "#fff" }, job_id: "..." } }
3. RunPod handler:
   a. Renders text onto a 1920x1080 image using Pillow:
      - Create blank canvas with bg color
      - Draw text centered with specified font/color
   b. Converts image to 2-second silent video via ffmpeg (same as image path)
   c. Calls model.get_events_dataframe(video_path=output.mp4)
   d. Calls model.predict(events=df)
   e. Returns OutputSchema (1 segment for 2s window)
4. Results page shows rendered text card + brain viewer (no video player)
```

### Data Flow: Comparison Page

```
1. User navigates to /compare?a=job_id_1&b=job_id_2
   (or picks two analyses from dashboard via checkboxes)
2. Page fetches both jobs via /api/jobs/[id] (two parallel requests)
3. Renders two ResultsDetailPage-like views side by side:
   - Left: Job A results (brain viewer, timeline, metrics)
   - Right: Job B results (brain viewer, timeline, metrics)
   - Bottom: Delta comparison strip (which regions differ most)
4. No new API routes needed -- reuses existing GET /api/jobs/[id]
```

## Schema Changes

### Supabase `jobs` Table

```sql
-- New columns
ALTER TABLE jobs ADD COLUMN input_type TEXT NOT NULL DEFAULT 'video'
  CHECK (input_type IN ('video', 'image', 'text_spoken', 'text_visual'));

ALTER TABLE jobs ADD COLUMN text_content TEXT;
-- text_content stores the raw text for text_spoken and text_visual modes
-- NULL for video and image types

ALTER TABLE jobs ADD COLUMN text_style JSONB;
-- text_style stores font/color/bg preferences for text_visual mode
-- NULL for all other types
```

**Migration strategy:** Add `input_type` with default 'video' so all existing rows remain valid. The `video_url` column stays as-is -- existing video jobs keep working. Image uploads also use `video_url` to store the Supabase Storage URL. Text jobs have `video_url = NULL` and `text_content` populated.

**Why NOT rename video_url:** Renaming to `media_url` would break every existing query, component, and API response. The semantic mismatch (video_url holding an image URL) is acceptable -- document it and move on. New TypeScript code can alias: `const mediaUrl = job.video_url`.

### TypeScript Types Update

```typescript
export type InputType = 'video' | 'image' | 'text_spoken' | 'text_visual'

export interface Job {
  id: string
  user_id: string
  video_url: string           // kept for backward compat; stores image URLs too
  title: string | null
  is_public: boolean
  view_count: number
  status: JobStatus
  input_type: InputType       // NEW
  text_content: string | null // NEW: raw text for text modes
  text_style: Record<string, string> | null // NEW: visual mode styling
  runpod_id: string | null
  results: Record<string, unknown> | null
  error_message: string | null
  created_at: string
  updated_at: string
}
```

### RunPod InputSchema Update

```python
class InputSchema(BaseModel):
    # Existing
    video_url: str | None = None     # was required, now optional
    include_raw: bool = False
    include_vertex_data: bool = True
    
    # New
    input_type: Literal["video", "image", "text_spoken", "text_visual"] = "video"
    text_content: str | None = None  # for text_spoken and text_visual
    text_style: dict | None = None   # for text_visual (font, bg, color)
    
    @model_validator(mode="after")
    def validate_input_combination(self):
        if self.input_type == "video" and not self.video_url:
            raise ValueError("video_url required for video input")
        if self.input_type == "image" and not self.video_url:
            raise ValueError("video_url (media URL) required for image input")
        if self.input_type in ("text_spoken", "text_visual") and not self.text_content:
            raise ValueError("text_content required for text input")
        return self
```

## New API Routes

No new API routes are strictly needed. The existing routes handle everything:

| Route | Current | Change Needed |
|-------|---------|---------------|
| `POST /api/jobs` (via server action) | Creates job with video_url | Accept input_type, text_content, text_style; dispatch with new payload |
| `GET /api/jobs/[id]` | Returns job + polls RunPod | No changes -- already returns full job row |
| `PATCH /api/jobs/[id]` | Updates title, is_public | No changes needed |

**Optional new route:** `GET /api/compare?a=id1&b=id2` could batch-fetch two jobs in one request, but two parallel `GET /api/jobs/[id]` calls are simpler and reuse existing auth/visibility logic.

## New & Modified Files

### New Files (Frontend)

| File | Purpose |
|------|---------|
| `web/src/app/(app)/upload/InputTypeSelector.tsx` | Tab/pill selector: Video / Image / Text |
| `web/src/app/(app)/upload/ImageUploadZone.tsx` | Drop zone for JPEG/PNG (reuses AnimatedFileUpload pattern with image types) |
| `web/src/app/(app)/upload/TextInputForm.tsx` | Textarea + mode toggle (Visual/Spoken) + style picker for visual mode |
| `web/src/app/(app)/compare/page.tsx` | Side-by-side comparison of two analyses |
| `web/src/components/results/StaticMediaViewer.tsx` | Shows original image or rendered text card instead of VideoPlayer |
| `web/src/lib/upload-media.ts` | `uploadMedia(file)` -- accepts image or video, uploads to Supabase Storage |

### Modified Files (Frontend)

| File | Change |
|------|--------|
| `web/src/app/(app)/upload/page.tsx` | Add InputTypeSelector, conditionally render upload zone vs text form |
| `web/src/app/(app)/upload/actions.ts` | `createJob` accepts input_type, text_content, text_style; dispatches enriched payload to RunPod |
| `web/src/lib/database.types.ts` | Add InputType, update Job interface |
| `web/src/app/(app)/results/[id]/page.tsx` | Conditionally render VideoPlayer vs StaticMediaViewer based on input_type |
| `web/src/app/(app)/dashboard/page.tsx` | Show input_type icon on job cards; add "Compare" selection UI |
| `web/src/app/(app)/discover/page.tsx` | Add input_type filter; show appropriate thumbnail for non-video |
| `web/src/components/upload/AnimatedFileUpload.tsx` | Accept configurable `acceptedTypes` for image support |

### New Files (RunPod Worker)

| File | Purpose |
|------|---------|
| `src/media_converter.py` | `image_to_video(image_path) -> video_path` and `text_to_image(text, style) -> image_path` using ffmpeg + Pillow |

### Modified Files (RunPod Worker)

| File | Change |
|------|--------|
| `src/schema.py` | InputSchema: add input_type, text_content, text_style; make video_url optional |
| `src/handler.py` | Route based on input_type: video (existing), image (convert+infer), text_spoken (direct text_path), text_visual (render+convert+infer) |
| `src/inference.py` | `run_inference` accepts optional `text_path` param; routes to correct `get_events_dataframe` call |
| `Dockerfile` | Add `python3-pil` (Pillow) for text card rendering |

## Patterns to Follow

### Pattern 1: Input Type Routing in Handler

```python
# src/handler.py - modified handler function
def handler(job):
    params = InputSchema(**job["input"])
    
    if params.input_type == "video":
        video_path = download_video(params.video_url, job_id)
        preds, segments, timing = run_inference(model, video_path=str(video_path))
        
    elif params.input_type == "image":
        image_path = download_media(params.video_url, job_id)
        video_path = image_to_video(image_path)
        preds, segments, timing = run_inference(model, video_path=str(video_path))
        
    elif params.input_type == "text_spoken":
        text_path = save_text_file(params.text_content, job_id)
        preds, segments, timing = run_inference(model, text_path=str(text_path))
        
    elif params.input_type == "text_visual":
        image_path = render_text_card(params.text_content, params.text_style)
        video_path = image_to_video(image_path)
        preds, segments, timing = run_inference(model, video_path=str(video_path))
```

### Pattern 2: Conditional Video Player on Results Page

```typescript
// In results/[id]/page.tsx
const isVideoInput = !job.input_type || job.input_type === 'video'

// In the grid:
{isVideoInput ? (
  <VideoPlayer src={results.video_url} ... />
) : (
  <StaticMediaViewer job={job} />
)}
```

### Pattern 3: Image-to-Video Conversion (RunPod-side)

```python
# src/media_converter.py
import subprocess
from pathlib import Path

def image_to_video(image_path: Path, duration: float = 2.0) -> Path:
    """Convert a still image to a silent video for TRIBE v2 inference."""
    output = image_path.with_suffix('.mp4')
    subprocess.run([
        'ffmpeg', '-y',
        '-loop', '1',
        '-i', str(image_path),
        '-c:v', 'libx264',
        '-t', str(duration),
        '-pix_fmt', 'yuv420p',
        '-r', '1',           # 1 fps (minimum for still image)
        '-an',                # no audio
        str(output)
    ], check=True, capture_output=True)
    return output
```

### Pattern 4: Text Card Rendering (RunPod-side)

```python
# src/media_converter.py
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

def render_text_card(text: str, style: dict | None, job_id: str) -> Path:
    """Render styled text onto a 1920x1080 image."""
    style = style or {}
    bg = style.get('bg_color', '#000000')
    fg = style.get('text_color', '#FFFFFF')
    
    img = Image.new('RGB', (1920, 1080), color=bg)
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default(size=72)
    
    # Center text with word wrap
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (1920 - (bbox[2] - bbox[0])) // 2
    y = (1080 - (bbox[3] - bbox[1])) // 2
    draw.text((x, y), text, fill=fg, font=font)
    
    output = Path(f'/tmp/{job_id}_text_card.png')
    img.save(output)
    return output
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Media Conversion
**What:** Converting image-to-video or rendering text cards in the browser before upload.
**Why bad:** Large canvas/video processing in browser is slow, unreliable, and varies by device. The user should upload raw input; the server handles conversion.
**Instead:** All conversion happens on the RunPod worker where ffmpeg and Pillow are available.

### Anti-Pattern 2: Separate RunPod Endpoints per Input Type
**What:** Creating `/v2/image-endpoint/run`, `/v2/text-endpoint/run` etc.
**Why bad:** Multiplies infrastructure, cold starts, and maintenance. The model is the same.
**Instead:** Single endpoint, `input_type` field in payload routes to correct pre-processing.

### Anti-Pattern 3: Storing Rendered Media Back to Supabase
**What:** After RunPod converts image-to-video, uploading the generated video back to storage.
**Why bad:** Unnecessary network round-trip, storage cost, and complexity. The generated video is a transient artifact only needed for inference.
**Instead:** Generate in /tmp, run inference, delete. The original image/text is preserved in the job record.

### Anti-Pattern 4: Renaming video_url Column
**What:** `ALTER TABLE jobs RENAME COLUMN video_url TO media_url` for semantic correctness.
**Why bad:** Breaks every existing query, component, and API response. Migration risk for cosmetic gain.
**Instead:** Keep `video_url`. It stores image URLs too. Document the semantic mismatch.

### Anti-Pattern 5: Converting Text to Video Client-Side for Visual Mode
**What:** Using HTML Canvas to render text card as image in browser, then converting to video.
**Why bad:** Requires complex browser APIs (MediaRecorder, Canvas), inconsistent across browsers, adds large upload for what started as a few bytes of text.
**Instead:** Send raw text + style to RunPod. Worker renders with Pillow (deterministic, fast).

## Suggested Build Order

Build order driven by dependency chains and incremental testability.

### Phase 1: Schema & Infrastructure (foundation -- everything depends on this)
1. Supabase migration: add `input_type`, `text_content`, `text_style` columns
2. Update `database.types.ts` with new fields
3. Update RunPod `InputSchema` to accept new fields (backward-compatible)
4. Update `createJob` action to accept and pass new fields

### Phase 2: Image Upload (simplest new input type)
1. Modify `AnimatedFileUpload` to accept configurable MIME types
2. Add `InputTypeSelector` component (Video/Image/Text tabs)
3. Modify upload page to show image upload zone when Image selected
4. Add `image_to_video()` in `src/media_converter.py`
5. Modify handler to route image input through conversion -> inference
6. Test: upload a JPEG, get back 1-segment brain activation

### Phase 3: Text Spoken Mode (leverages native TRIBE v2 capability)
1. Add `TextInputForm` component with textarea
2. Modify upload page to show text form when Text selected
3. Modify handler to route text_spoken through `get_events_dataframe(text_path=...)`
4. Modify `run_inference` to accept text_path parameter
5. Test: enter text, get back multi-segment brain activation

### Phase 4: Text Visual Mode (builds on image conversion from Phase 2)
1. Add visual/spoken mode toggle to `TextInputForm`
2. Add style picker (bg color, text color) for visual mode
3. Add `render_text_card()` in `src/media_converter.py` (Pillow)
4. Add Pillow to Dockerfile
5. Modify handler to route text_visual through render -> convert -> inference
6. Test: enter styled text, get back 1-segment brain activation

### Phase 5: Results Adaptations
1. Create `StaticMediaViewer` component (shows image or text card)
2. Modify results page: conditionally render VideoPlayer vs StaticMediaViewer
3. Handle 1-segment results gracefully in timeline (no meaningful timeline for single segment)
4. Update dashboard cards to show input_type icon
5. Update discover page with input_type filter

### Phase 6: Comparison Page
1. Create `/compare` route with query params `?a=id1&b=id2`
2. Build side-by-side layout reusing results components
3. Add comparison selection UI on dashboard (checkboxes + "Compare" button)
4. Add delta metrics strip (difference between two analyses)

**Phase ordering rationale:**
- Phase 1 must come first (schema changes are foundational)
- Phase 2 before Phase 4 (image conversion is reused by text_visual)
- Phase 3 can run in parallel with Phase 2 (independent paths)
- Phase 5 depends on Phases 2-4 (needs all input types working)
- Phase 6 is fully independent of Phases 2-5 (only needs two completed jobs)

## Scalability Considerations

| Concern | Current (video only) | With multi-modal |
|---------|---------------------|------------------|
| Storage | ~100MB per video | Images: ~5MB, Text: <1KB. Negligible added cost. |
| Inference time | ~12 min / 60s video | Image: ~2 min (2s video), Text spoken: ~3-5 min, Text visual: ~2 min. Much faster for non-video. |
| Cold start | Same | Same -- no new models needed. Pillow + ffmpeg already in container. |
| RunPod cost | ~$0.07/job (A40) | Image/text jobs: ~$0.01-0.02/job. Much cheaper. |

## Sources

- [TRIBE v2 GitHub](https://github.com/facebookresearch/tribev2) -- `get_events_dataframe(text_path=..., audio_path=..., video_path=...)` signature confirmed in `tribev2/demo_utils.py` (HIGH confidence)
- [TRIBE v2 README](https://github.com/facebookresearch/tribev2) -- "You can also pass text_path or audio_path to model.get_events_dataframe" (HIGH confidence)
- [Meta AI Blog: TRIBE v2](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/) -- Architecture: LLaMA 3.2 (text), V-JEPA2 (video), Wav2Vec-BERT (audio) (HIGH confidence)
- [FFmpeg image-to-video](https://shotstack.io/learn/use-ffmpeg-to-convert-images-to-video/) -- `ffmpeg -loop 1 -i input.jpg -t 2 output.mp4` pattern (HIGH confidence)
- Existing codebase analysis: handler.py, schema.py, inference.py, upload/page.tsx, results/[id]/page.tsx, database.types.ts (HIGH confidence)
