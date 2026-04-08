# NeuroCut — Architecture & Build Plan

## What We're Building

A neural A/B testing tool for content creators. Upload two videos (up to 90 seconds each), get back a synchronized timeline showing predicted brain activation scores across both videos second-by-second. Creators can see exactly where attention spikes, where it drops, and which version performs better at every moment — not just an overall score.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + React | SSR for marketing/SEO, React for app UI |
| Deployment | Vercel | Native Next.js, serverless functions built in |
| Database | Supabase Postgres | User accounts, credits, job history, scores |
| Auth | Supabase Auth | Simple, built into the ecosystem |
| File Storage | Cloudflare R2 | Cheap large file storage, no egress fees, no migration later |
| Job Queue | Supabase Edge Functions | Async inference job orchestration |
| Inference | RunPod Serverless (GPU) | TRIBE v2 containerized, pay-per-job only |
| Payments | Stripe | Credit pack purchases, webhooks to Supabase |

No VPS. Fully serverless. GPU spend tied directly to usage.

---

## Core Features (V1)

One thing done exceptionally well:

- Upload two videos side by side (up to 90 seconds each)
- Inference runs on both via TRIBE v2 on RunPod
- Returns per-segment neural activation scores (2-second windows)
- UI renders synchronized timeline waveform for both videos
- Scrub through video — watch brain scores move in real time
- Summary comparison: overall score, hook score (0-5s), retention score, peak emotional moment
- Credit deduction on job completion

V2 additions (post-launch):
- Thumbnail comparison (static image)
- Script/text predictor
- Ad creative analyzer
- Team dashboard for agencies

---

## Credit Model

| Content Type | Credits |
|---|---|
| Video up to 90s | 10 credits |
| Static image / thumbnail | 4 credits |
| Script / text | 1 credit |

| Plan | Credits | Price |
|---|---|---|
| Starter pack | 50 credits | $19 one-time |
| Pro | 300 credits/month | $49/month |
| Agency | 1,500 credits/month | $199/month |

Credits stored in Supabase. Stripe webhook increments balance on successful payment. Credits deducted when job completes successfully (not on upload).

---

## Data Architecture

### Supabase Tables

**users**
- id, email, created_at
- Managed by Supabase Auth

**credit_balances**
- user_id (FK), balance (int), updated_at

**credit_transactions**
- id, user_id, amount, type (purchase | deduction), description, created_at

**analysis_jobs**
- id, user_id, status (pending | processing | complete | failed)
- video_a_r2_key, video_b_r2_key
- created_at, completed_at
- credits_charged

**analysis_results**
- job_id (FK)
- video_a_scores (JSONB) — array of {second, activation_score, region_breakdown}
- video_b_scores (JSONB)
- summary (JSONB) — overall, hook, retention, peak_moment for each video

### Cloudflare R2 Structure
```
uploads/
  {user_id}/
    {job_id}/
      video_a.mp4
      video_b.mp4
```

---

## System Flow

```
1. User uploads two videos
   → Frontend uploads directly to R2 via presigned URL
   → Creates analysis_job row in Supabase (status: pending)

2. Job triggers Supabase Edge Function
   → Checks user has sufficient credits
   → Calls RunPod serverless endpoint with R2 video URLs
   → Updates job status to: processing

3. RunPod runs TRIBE v2 inference
   → Segments each video into 2-second windows
   → Returns activation scores per window per video
   → Includes region breakdown (attention, emotion, reward circuits)

4. Edge Function receives RunPod response
   → Writes scores to analysis_results table
   → Deducts credits from credit_balances
   → Logs credit_transaction
   → Updates job status to: complete
   → Triggers frontend via Supabase Realtime

5. Frontend receives completion event
   → Fetches results from Supabase
   → Renders synchronized timeline UI
```

---

## RunPod Inference Container

TRIBE v2 needs to be containerized as a custom RunPod serverless worker.

**Container responsibilities:**
- Accept: two video file URLs (R2 presigned), job_id
- Download videos from R2
- Run TRIBE v2 inference across both
- Segment output into 2-second windows
- Return: JSON array of per-segment scores for each video

**Output schema per video:**
```json
{
  "video": "a",
  "duration_seconds": 62,
  "segments": [
    {
      "start": 0,
      "end": 2,
      "activation_score": 74,
      "arousal": 81,
      "valence": 0.7,
      "regions": {
        "attention": 78,
        "reward": 65,
        "emotional_processing": 71,
        "social_cognition": 60
      }
    }
  ],
  "summary": {
    "overall": 71,
    "hook_score": 68,
    "retention_score": 74,
    "peak_second": 34,
    "peak_score": 91
  }
}
```

**Base Docker image:** nvidia/cuda with Python 3.11
**Key dependencies:** torch, transformers, torchaudio, tribev2, runpod SDK

---

## Frontend UI — Key Screens

### 1. Upload Screen
- Two drag-and-drop zones side by side (Video A / Video B)
- Credit cost preview before submitting
- Confirm & Analyze button

### 2. Processing Screen
- Job status polling via Supabase Realtime
- Step indicators: Uploading → Queued → Analyzing → Complete
- Estimated time

### 3. Results Screen (the core UI)
- Video A player (top) + Video B player (bottom)
- Below each player: neural timeline waveform (canvas-based)
  - X axis: time in seconds
  - Y axis: activation score 0-100
  - Color zones: red (low) → yellow (mid) → green (high)
  - Scrubber synced to video playback
- Summary cards: Overall / Hook / Retention / Peak Moment
- Verdict banner: which version wins and why
- Segment detail panel: click any point on timeline → see region breakdown

### 4. Dashboard
- Job history
- Credit balance + purchase CTA
- Quick re-run button

---

## Build Order

### Phase 1 — Inference validation (do this first, everything else depends on it)
- [ ] Clone TRIBE v2 from facebookresearch/tribev2
- [ ] Get it running locally on a GPU (or RunPod dev environment)
- [ ] Feed it a 60-second video, confirm per-segment scores come back
- [ ] Measure inference time per video
- [ ] Containerize as RunPod serverless worker
- [ ] Test end-to-end: send video URL → get JSON scores back

### Phase 2 — Backend scaffolding
- [ ] Supabase project setup — tables, RLS policies, auth
- [ ] Cloudflare R2 bucket + presigned URL generation
- [ ] Vercel project setup, environment variables
- [ ] Stripe products + webhook handler (credit balance updates)
- [ ] Edge Function: job orchestration (trigger RunPod, receive results, write to DB)

### Phase 3 — Frontend
- [ ] Auth flow (Supabase Auth — email/password + Google)
- [ ] Upload screen with R2 presigned upload
- [ ] Processing screen with Supabase Realtime job status
- [ ] Results screen — timeline waveform component (this is the hard part)
- [ ] Dashboard — job history, credit balance
- [ ] Credit purchase flow (Stripe)

### Phase 4 — Polish & launch
- [ ] Landing page with demo video
- [ ] Onboarding flow (first analysis free)
- [ ] Error handling, failed job refunds
- [ ] Mobile responsive

---

## Open Questions to Resolve in Phase 1

1. **Inference time** — how long does TRIBE v2 take per 90-second video on a RunPod A100? If it's over 3 minutes, UX needs a "we'll email you" async flow rather than waiting on screen.

2. **5-second hook reliability** — run known high/low performing hooks through the model and check if scores meaningfully separate them. Validates the core use case.

3. **License** — CC BY-NC-4.0. For now, build and validate. When it gets traction, either negotiate a commercial license with Meta directly or train a downstream classifier on TRIBE v2 outputs and commercialize that instead.

---

## Environment Variables Needed

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# RunPod
RUNPOD_API_KEY=
RUNPOD_ENDPOINT_ID=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## Name

Going with **NeuroCut** for now — leans into the video editing metaphor, brain-adjacent without being gimmicky. Change anytime before launch.

