# Stack Research: Multi-Modal Input & Comparison

**Domain:** Image upload, text rendering/TTS, media-to-video conversion, comparison UI
**Researched:** 2026-04-11
**Confidence:** HIGH

## Core Finding

This milestone splits into two execution domains with different stack needs:

1. **RunPod container (Python):** Needs Pillow for image-to-video conversion. MoviePy and gTTS are already installed. TRIBE v2 natively supports `text_path` and `audio_path` parameters -- no wrapper needed.

2. **Next.js frontend:** Needs satori + @resvg/resvg-js for text-to-image rendering (visual mode). Comparison page uses existing Recharts with syncId for synchronized charts. No new component library needed.

Total new dependencies: 2 npm packages (frontend), 1 pip package (RunPod container, and only if not already pulled in by TRIBE v2 transitive deps).

## Recommended Stack Additions

### RunPod Container (Python) -- 1 New Dependency

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Pillow | >=12.2.0 | Image decoding + resize | Decode JPEG/PNG uploads, resize to 720p, pass numpy array to MoviePy's ImageClip. Pillow is the standard Python imaging library. MoviePy uses it internally for some operations but does not list it as a hard dependency -- must be explicitly installed. |

**Already available (DO NOT add):**

| Technology | Already Installed Via | Used For |
|------------|----------------------|----------|
| MoviePy | TRIBE v2 dependency (>=2.2.1) | `ImageClip(numpy_array).with_duration(5).write_videofile()` -- converts image to silent MP4 |
| FFmpeg | `apt-get install ffmpeg` in Dockerfile | Backend for MoviePy video writing |
| gTTS | TRIBE v2 dependency (>=2.3) | Text-to-speech for "spoken mode" text input |
| TRIBE v2 `text_path` | tribev2 package itself | Native text input -- pass a `.txt` file, TRIBE v2 auto-runs gTTS + WhisperX internally |

### Next.js Frontend -- 2 New Dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| satori | ^0.19.2 | HTML/CSS to SVG rendering | Renders styled text cards as SVG using JSX syntax. Used in Next.js API route to convert user's text input + selected style into an image. Vercel-maintained, 797K weekly downloads, uses Yoga layout engine (same as React Native). |
| @resvg/resvg-js | ^2.6.2 | SVG to PNG conversion | Converts satori's SVG output to PNG buffer for upload to Supabase Storage. Rust-powered via napi-rs, no node-gyp needed, faster than sharp for SVG rasterization (12 ops/s vs 9 ops/s). |

**Already available (DO NOT add):**

| Technology | Already Installed | Used For |
|------------|-------------------|----------|
| Recharts (^3.8.1) | package.json | Comparison page: two NeuralTimeline charts with `syncId` prop for synchronized tooltips/hover |
| Framer Motion (^12.38.0) | package.json | Comparison page transitions, type selector animations |
| @supabase/supabase-js (^2.103.0) | package.json | Upload images to same `videos` storage bucket, create jobs with new `input_type` column |
| Supabase Storage | Already configured | Accepts any file type -- just change accepted MIME types in upload function |

### Why NOT These Alternatives

| You Might Think You Need | Why You Do Not |
|--------------------------|----------------|
| sharp for text rendering | sharp is for image manipulation (resize, format conversion). It cannot render HTML/CSS to images. satori + resvg-js is the correct pipeline for text card rendering. sharp is already used by Next.js internally for image optimization. |
| Canvas / node-canvas | Requires Cairo system library, complex install in containers, poor text layout compared to satori's Flexbox-based approach. |
| Puppeteer / Playwright for screenshots | Spins up a headless browser -- massive overhead for rendering a styled text card. satori runs in-process with zero browser dependency. |
| OpenCV (Python) for image-to-video | Already have MoviePy which wraps FFmpeg. Adding OpenCV adds 100MB+ to container for zero benefit. MoviePy's `ImageClip` does exactly this. |
| react-compare-slider | The comparison is two full result panels side by side, not an image overlay slider. Standard CSS grid with two instances of existing components is the correct approach. |
| Zustand/Jotai for comparison state | Comparison page manages exactly 2 job IDs as URL search params (`?a=uuid1&b=uuid2`). `useState` + `useSearchParams` is sufficient. |
| @vercel/og | Wraps satori + resvg internally but is designed for OG image generation in Edge Runtime. We need the raw libraries for more control over output (upload PNG to Supabase, not serve as response). |

## Database Schema Changes (Supabase Postgres)

### New Column on `jobs` Table

```sql
-- Track what type of content was analyzed
alter table public.jobs
  add column input_type text default 'video' not null
  check (input_type in ('video', 'image', 'text_visual', 'text_spoken'));

-- Index for filtering by type on dashboard/discover
create index idx_jobs_input_type on public.jobs(input_type);
```

**Why `input_type` on jobs instead of a separate table:** The input type is a property of the analysis, not a separate entity. It determines how the results page renders (video player vs static image vs text card) and what icon shows on dashboard/discover cards. A column with a CHECK constraint is simpler and faster than a join.

### Column Rename Consideration

The existing `video_url` column on `jobs` should be renamed to `media_url` to reflect that it now stores URLs for images and rendered text cards too. However, this is a breaking change that touches every query. **Recommendation:** Keep `video_url` for now and add a comment. Rename in a future migration when stable.

```sql
comment on column public.jobs.video_url is
  'URL to the uploaded media file (video, image, or rendered text card). Historical name; stores all media types.';
```

### TypeScript Type Updates

```typescript
// database.types.ts additions
export type InputType = 'video' | 'image' | 'text_visual' | 'text_spoken'

export interface Job {
  // ... existing fields ...
  input_type: InputType  // NEW
}
```

## Conversion Pipeline Architecture

### Image Upload Flow

```
Browser                    Next.js API Route           Supabase Storage       RunPod
  |                              |                          |                   |
  |-- upload JPEG/PNG ---------> |                          |                   |
  |                              |-- store original ------> |                   |
  |                              |-- createJob(url, 'image') |                  |
  |                              |                          |-- dispatch ------> |
  |                              |                          |                   |
  |                              |              RunPod handler receives image URL |
  |                              |              1. Download image                |
  |                              |              2. Pillow: decode + resize 720p  |
  |                              |              3. MoviePy: ImageClip(arr).with_duration(5) |
  |                              |              4. Write silent MP4 to /tmp      |
  |                              |              5. TRIBE v2: get_events_dataframe(video_path=mp4) |
  |                              |              6. predict() -> return results   |
```

**Why convert on RunPod, not in Next.js:** The image-to-video conversion requires MoviePy + FFmpeg which are already installed in the RunPod container but NOT in the Next.js deployment. Converting on RunPod avoids adding heavy video dependencies to the web server.

### Text Visual Mode Flow

```
Browser                    Next.js API Route             Supabase Storage      RunPod
  |                              |                            |                  |
  |-- POST text + style -------> |                            |                  |
  |                              |-- satori: JSX -> SVG       |                  |
  |                              |-- resvg: SVG -> PNG        |                  |
  |                              |-- upload PNG -------------> |                 |
  |                              |-- createJob(url, 'text_visual')              |
  |                              |                            |-- dispatch ----> |
  |                              |                            |                  |
  |                              |              RunPod: same as image flow       |
  |                              |              (download PNG, Pillow, MoviePy,  |
  |                              |               TRIBE v2 video-only inference)  |
```

**Why render text on Next.js, not RunPod:** satori is a Node.js library. RunPod is Python. The text rendering (choosing fonts, styles, layout) is a frontend concern. RunPod just needs a URL to an image.

### Text Spoken Mode Flow

```
Browser                    Next.js API Route             RunPod
  |                              |                         |
  |-- POST text + 'spoken' ----> |                         |
  |                              |-- save text to Supabase |
  |                              |-- createJob(text_url, 'text_spoken')
  |                              |                         |
  |                              |              RunPod handler:
  |                              |              1. Download .txt file
  |                              |              2. TRIBE v2: get_events_dataframe(text_path=txt)
  |                              |              3. TRIBE v2 internally runs gTTS + WhisperX
  |                              |              4. predict() -> return results
```

**Why use TRIBE v2's native text_path:** TRIBE v2 already handles text -> TTS -> audio feature extraction internally. Reimplementing this pipeline would be fragile and redundant. Pass the text file path directly and let TRIBE v2 do what it was designed to do.

## RunPod Handler Changes

The existing `InputSchema` needs to accept either `video_url` (existing) or `media_url` + `input_type`:

```python
class InputSchema(BaseModel):
    video_url: str | None = None       # backward compatible
    media_url: str | None = None       # new: image or text file URL
    input_type: str = "video"          # "video" | "image" | "text_visual" | "text_spoken"
    include_raw: bool = False
    include_vertex_data: bool = True
```

The handler then branches:
- `input_type == "video"`: existing flow (download video, infer)
- `input_type == "image"` or `input_type == "text_visual"`: download image, Pillow resize, MoviePy ImageClip -> silent MP4, infer on MP4
- `input_type == "text_spoken"`: download .txt, pass `text_path` to `get_events_dataframe`

## Comparison Page -- No New Libraries

The comparison page is two results panels side by side. Every component already exists:

| Existing Component | Comparison Usage |
|-------------------|------------------|
| BrainViewer | Two instances, each with their own segments/currentTime |
| NeuralTimeline | Two instances with `syncId` prop on internal Recharts `<LineChart>` for synchronized cursor |
| CircumplexChart | Two instances showing each analysis's emotional state |
| Metrics (SlidingNumber) | Side by side stat tiles with delta indicators |

**Route:** `/compare?a={jobId}&b={jobId}`

**Data fetching:** Two parallel `fetch('/api/jobs/${id}')` calls in a Server Component, passing both result sets to a client comparison layout.

## Installation

```bash
# Next.js frontend -- 2 new packages
cd web && npm install satori @resvg/resvg-js

# RunPod container -- add to Dockerfile or requirements.txt
pip install Pillow>=12.2.0
```

## Font Loading for Satori

Satori requires font files (TTF/OTF/WOFF) to be loaded as ArrayBuffers. The existing design system uses Space Grotesk (headlines) and Inter (body). Both are Google Fonts available as TTF.

```typescript
// Example: load fonts once at module level in the API route
const spaceGrotesk = await fetch('https://fonts.gstatic.com/s/spacegrotesk/v16/...wght@700.ttf')
  .then(res => res.arrayBuffer());

const inter = await fetch('https://fonts.gstatic.com/s/inter/v18/...wght@400.ttf')
  .then(res => res.arrayBuffer());
```

**Cache these in a module-level variable** -- they are immutable font files. No need to re-fetch per request.

## Version Compatibility

| Existing Package | Compatible | Notes |
|-----------------|------------|-------|
| `next@16.2.3` | Yes | API routes handle satori rendering. No conflicts. |
| `react@19.2.4` | Yes | satori accepts JSX-like objects, not actual React elements. Compatible. |
| `recharts@^3.8.1` | Yes | `syncId` prop available since Recharts 2.x. Two charts with same syncId synchronize tooltips. |
| `@supabase/supabase-js@^2.103.0` | Yes | Storage upload accepts any file type. `.from('videos').upload()` works for PNGs too. |
| `framer-motion@^12.38.0` | Yes | Type selector tabs, comparison page layout animations. |
| `three@^0.183.2` | Yes | Two BrainViewer instances in comparison -- each gets its own canvas. |

## Sources

- [TRIBE v2 GitHub Repository](https://github.com/facebookresearch/tribev2) -- `get_events_dataframe` accepts `video_path`, `audio_path`, `text_path` (HIGH confidence)
- [TRIBE v2 Demo Notebook](https://github.com/facebookresearch/tribev2/blob/main/tribe_demo.ipynb) -- text input auto-runs gTTS + WhisperX (HIGH confidence)
- [Meta AI Blog: TRIBE v2](https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/) -- tri-modal architecture (HIGH confidence)
- [MoviePy ImageClip Documentation](https://zulko.github.io/moviepy/reference/reference/moviepy.video.VideoClip.ImageClip.html) -- image to silent video (HIGH confidence)
- [Satori GitHub](https://github.com/vercel/satori) -- HTML/CSS to SVG, JSX syntax, Yoga layout (HIGH confidence)
- [Satori npm](https://www.npmjs.com/package/satori) -- v0.19.2, 797K weekly downloads (HIGH confidence)
- [@resvg/resvg-js GitHub](https://github.com/thx/resvg-js) -- Rust-powered SVG to PNG (HIGH confidence)
- [Pillow PyPI](https://pypi.org/project/pillow/) -- v12.2.0 (HIGH confidence)
- [Recharts syncId](https://recharts.github.io/) -- synchronized tooltips between charts (HIGH confidence)

---
*Stack research for: NeuroCut v5.0 Multi-Modal Input & Comparison*
*Researched: 2026-04-11*
