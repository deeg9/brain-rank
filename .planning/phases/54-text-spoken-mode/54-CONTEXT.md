# Phase 54: Text Spoken Mode - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable text input in spoken mode on the upload page. User types text (max 500 chars), submits it, text is saved as .txt in Supabase storage, and RunPod handler passes it to TRIBE v2's native `get_events_dataframe(text_path=...)` which handles TTS (gTTS) and audio feature extraction internally. Returns neural activation scores identical in structure to video/image jobs.

</domain>

<decisions>
## Implementation Decisions

### Text Input UX
- Multi-line textarea with `{count}/500` character counter below, turns red near limit
- Placeholder: "Enter your text here — e.g., ad copy, headline, voiceover script..."
- Text saved as .txt file in Supabase storage, URL passed to createJob with inputType='text_spoken'
- Submit button "Analyze Text" appears after text is entered

### RunPod Handler
- Handler saves text_content from payload to a .txt temp file
- Calls `model.get_events_dataframe(text_path=temp_file_path)` — TRIBE v2 handles TTS + transcription internally
- Full multimodal mode (audio + text features) — native text_path enables both
- gTTS failure returns clear error: "Text-to-speech failed. TRIBE v2 requires internet for text analysis."
- Temp file deleted after inference

### Claude's Discretion
- Textarea styling details (rows, resize behavior)
- Error handling for empty text or storage upload failure
- Whether to show a "processing" indicator specific to text mode

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Upload page with Text tab (Phase 52) — currently placeholder, needs real textarea
- `createJob` server action with `inputType` and `textContent` params (Phase 52)
- `InputSchema` with `text_content` and `input_type='text_spoken'` (Phase 52)
- `handler.py` with input_type branching pattern (Phase 53 added image branch)
- `uploadVideo` / `uploadImage` in web/src/lib/upload.ts — pattern for storage upload

### Integration Points
- Upload page Text tab → replace placeholder with real textarea + submit flow
- createJob action → already accepts textContent param
- RunPod handler → needs text_spoken branch (similar to image branch from Phase 53)
- Results page → will receive identical result structure (no changes needed here)

</code_context>

<specifics>
## Specific Ideas

- TRIBE v2 native text path: `model.get_events_dataframe(text_path="temp.txt")`
- gTTS converts text to speech internally, WhisperX transcribes, LLaMA 3.2 processes
- This is the simplest backend integration — TRIBE v2 does ALL the work

</specifics>

<deferred>
## Deferred Ideas

- Offline TTS fallback (Kokoro-82M) if gTTS proves unreliable from RunPod
- Multiple languages support
- Voice selection for TTS

</deferred>
