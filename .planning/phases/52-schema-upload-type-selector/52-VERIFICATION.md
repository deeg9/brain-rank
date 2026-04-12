---
phase: 52-schema-upload-type-selector
verified: 2026-04-11T20:00:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Visually inspect the upload page type selector"
    expected: "Video tab is default and shows the existing drag-and-drop upload. Image tab shows placeholder with 'Image upload coming soon'. Text tab shows Spoken/Visual sub-toggle with 'Experimental' label on Visual. Animated tab indicator moves smoothly. Glassmorphism styling matches the rest of the app."
    why_human: "Tab animation (Framer Motion layoutId spring), glassmorphism visual fidelity, and overall UX feel cannot be verified programmatically"
---

# Phase 52: Schema & Upload Type Selector Verification Report

**Phase Goal:** The database, TypeScript types, and upload UI support multiple content types so all subsequent phases can store and route non-video jobs
**Verified:** 2026-04-11T20:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The jobs table has an `input_type` column (defaulting to 'video') and all existing jobs are backfilled without breakage | VERIFIED | `web/supabase/migrations/00008_add_input_type_columns.sql` — `ALTER TABLE jobs ADD COLUMN input_type TEXT NOT NULL DEFAULT 'video' CHECK (input_type IN ('video', 'image', 'text_spoken', 'text_visual'))`. DEFAULT clause ensures backfill. |
| 2 | The upload page shows a type selector (Video / Image / Text) that shows the appropriate input UI | VERIFIED | `InputTypeSelector` renders 3 tabs; `page.tsx` conditionally renders `AnimatedFileUpload` for video, "Image upload coming soon" placeholder for image, Spoken/Visual sub-selector for text. |
| 3 | TypeScript types and the RunPod input schema accept `input_type`, `text_content`, and `text_style` fields | VERIFIED | `database.types.ts` exports `InputType` union and `Job` interface with all 3 fields. `actions.ts` accepts `inputType`, `textContent`, `textStyle` params. `src/schema.py` has all 3 fields with `validate_input_combination` model validator. Python schema tests pass. |
| 4 | Selecting Video on the upload page shows the existing drag-and-drop video upload (no regression) | VERIFIED | `page.tsx` line 163: `{inputType === 'video' && (<motion.section...><AnimatedFileUpload .../></motion.section>)}`. Video is the default state. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `web/supabase/migrations/00008_add_input_type_columns.sql` | Schema migration adding 3 columns to jobs table | VERIFIED | 7 lines. Contains all 3 ALTER TABLE statements with correct types, NOT NULL DEFAULT 'video', and CHECK constraint. |
| `web/src/lib/database.types.ts` | Updated Job interface with InputType | VERIFIED | Exports `InputType` union (line 3), `Job` interface with `input_type: InputType`, `text_content: string \| null`, `text_style: string \| null`. `Database.jobs.Insert` includes optional versions of all 3 fields. |
| `web/src/app/(app)/upload/actions.ts` | Updated createJob accepting multi-modal params | VERIFIED | Exports `createJob(videoUrl, inputType='video', textContent?, textStyle?)`. Supabase insert includes all 3 fields. RunPod payload includes `input_type` and conditional `text_content`/`text_style`. |
| `src/schema.py` | Updated RunPod InputSchema with input_type routing | VERIFIED | `InputSchema` has `input_type: Literal["video","image","text_spoken","text_visual"] = "video"`, `text_content: Optional[str] = None`, `text_style: Optional[str] = None`. `validate_input_combination` model validator enforces cross-field rules. |
| `web/src/app/(app)/upload/InputTypeSelector.tsx` | Tab bar component for selecting input type | VERIFIED | 50 lines. Exports `InputTypeSelector` and `TabType`. 3 tabs with correct icons. Framer Motion `layoutId="activeTab"` animated indicator. Glassmorphism styling (`bg-white/5 border border-white/10 backdrop-blur-sm`). |
| `web/src/app/(app)/upload/page.tsx` | Upload page with conditional rendering per input type | VERIFIED | Imports `InputTypeSelector`. `inputType` state defaults to `'video'`. Conditional renders for all 3 tabs. `textMode` state ('spoken'/'visual') for text sub-selector. Header subtitle changes per tab. Cost panel/analyze button video-only. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `web/src/app/(app)/upload/actions.ts` | `web/src/lib/database.types.ts` | `InputType` import | WIRED | `import { type InputType } from '@/lib/database.types'` at line 4. Used in function signature and Supabase insert. |
| `web/src/app/(app)/upload/actions.ts` | RunPod API | `fetch POST with input_type in payload` | WIRED | `body: JSON.stringify({ input: { video_url: videoUrl, input_type: inputType, job_id: data.id, ... } })` |
| `web/src/app/(app)/upload/InputTypeSelector.tsx` | `web/src/lib/database.types.ts` | `InputType` import | NOT_WIRED | Component does not import `InputType`. Uses local `type TabType = 'video' \| 'image' \| 'text'` — a 3-value coarser type. This is intentional: the selector operates at tab level (3 tabs) while `InputType` has 4 values (text splits into spoken/visual). Not a blocker — the phase goal is achieved. |
| `web/src/app/(app)/upload/page.tsx` | `web/src/app/(app)/upload/InputTypeSelector.tsx` | component import and state management | WIRED | `import { InputTypeSelector, type TabType } from './InputTypeSelector'`. Rendered at line 155. `onChange={setInputType}` wires tab changes to state. |

**Note on missing InputType import in InputTypeSelector:** The plan's key_links spec required this import, but the implementation uses a local `TabType` instead. This is an intentional design deviation — `InputTypeSelector` operates at a 3-tab abstraction level, while `InputType` is a 4-value union that distinguishes `text_spoken` from `text_visual`. The text sub-mode is handled inside `page.tsx` via `textMode` state. The phase goal is unaffected.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `upload/page.tsx` | `inputType` state | `useState<TabType>('video')` + user click via `setInputType` | Yes — drives conditional rendering | FLOWING |
| `upload/page.tsx` | `textMode` state | `useState<'spoken' \| 'visual'>('spoken')` + user click | Yes — drives spoken/visual description text | FLOWING |
| `upload/actions.ts` | `input_type` in Supabase insert | `inputType` param, default `'video'` | Yes — stored to DB | FLOWING |

**Note:** The upload page `handleAnalyze` function calls `createJob(videoUrl)` without passing `inputType` (line 90). This means jobs created via the UI always use `input_type='video'`. This is by design — Image/Text tabs are placeholders in Phase 52 and do not trigger job creation. Phases 53-55 will wire up actual submission for those tabs.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Python schema validates video input (backward compat) | `python3 -c "from schema import InputSchema; v = InputSchema(video_url='https://example.com/v.mp4'); assert v.input_type == 'video'"` | PASS | PASS |
| Python schema validates text_spoken input | `python3 -c "from schema import InputSchema; t = InputSchema(input_type='text_spoken', text_content='Hello'); assert t.text_content == 'Hello'"` | PASS | PASS |
| Python schema rejects video without URL | `python3 -c "from schema import InputSchema; InputSchema(input_type='video')"` | Raises ValueError | PASS |
| Python schema rejects text without content | `python3 -c "from schema import InputSchema; InputSchema(input_type='text_spoken')"` | Raises ValueError | PASS |
| Migration file contains correct DDL | `grep "input_type TEXT NOT NULL DEFAULT" 00008_add_input_type_columns.sql` | Found | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| UX-01 | 52-01, 52-02 | Upload page has a type selector (Video / Image / Text) that shows the appropriate input UI | SATISFIED | `InputTypeSelector` renders 3 tabs; page conditionally renders per-tab content. Video shows existing upload, Image/Text show placeholders. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `web/src/app/(app)/upload/page.tsx` | 90 | `createJob(videoUrl)` — does not pass `inputType` | Info | Expected for Phase 52: Image/Text tabs are placeholders. Phases 53-55 will wire real submission. Not a regression. |
| Multiple files | Various | TypeScript errors (`never` type in Supabase insert) | Warning | Pre-existing issue (60 errors before Phase 52, 59 after). Phase 52 did not introduce or worsen this. Root cause: `Database` interface resolves to `never` via the Supabase typed client — a known limitation requiring generated types from `supabase gen types`. |

### Human Verification Required

#### 1. Upload Page Type Selector Visual Inspection

**Test:** Navigate to `/upload` in the running dev server (`cd web && npm run dev`). Observe the tab bar at the top of the upload area.

**Expected:**
- A centered tab bar with three tabs: Video (videocam icon), Image (image icon), Text (text_fields icon)
- Video tab is selected by default with an animated highlight
- Clicking Image shows a dashed-border placeholder: "Image upload coming soon"
- Clicking Text shows Spoken/Visual sub-buttons; Visual button has an amber "EXPERIMENTAL" badge
- Clicking sub-buttons changes the description text below the icon
- Clicking back to Video restores the drag-and-drop upload zone and cost panel
- The header subtitle changes to reflect the selected tab ("Supported formats: MP4, WebM, MOV" / "Supported formats: JPEG, PNG" / "Enter text for neural analysis")
- The animated tab indicator (Framer Motion spring) moves smoothly between tabs
- Overall styling matches the dark glassmorphism design system

**Why human:** Tab indicator animation (Framer Motion `layoutId`), visual fidelity of the glassmorphism panel, readability of the Experimental badge, and UX feel cannot be verified programmatically.

### Gaps Summary

All 4 roadmap success criteria are verified at the code level. No blocking gaps exist.

The single missing key link (InputTypeSelector not importing `InputType` from `database.types.ts`) is an intentional design deviation — the component uses a coarser local type appropriate to its 3-tab responsibility. This does not affect goal achievement.

The TypeScript compile errors (`never` type in Supabase inserts) are pre-existing infrastructure limitations that existed before Phase 52. Phase 52 slightly improved the count (60 → 59 errors). Resolution requires generating Supabase types with `supabase gen types typescript` — not in scope for this phase.

Automated checks all pass. One human verification item needed for visual/UX confirmation of the type selector UI.

---

_Verified: 2026-04-11T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
