-- Research-beta: capture optional real-world engagement alongside neural predictions.
-- All columns nullable; metrics are self-reported snapshots, not live numbers.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS posted_url              text,
  ADD COLUMN IF NOT EXISTS posted_platform         text,
  ADD COLUMN IF NOT EXISTS posted_at               date,
  ADD COLUMN IF NOT EXISTS views_count             bigint,
  ADD COLUMN IF NOT EXISTS likes_count             bigint,
  ADD COLUMN IF NOT EXISTS comments_count          bigint,
  ADD COLUMN IF NOT EXISTS shares_count            bigint,
  ADD COLUMN IF NOT EXISTS engagement_captured_at  timestamptz;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_posted_platform_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_posted_platform_check
  CHECK (posted_platform IS NULL OR posted_platform IN ('youtube','tiktok','instagram','other'));

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_views_nonneg_check;
ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_likes_nonneg_check;
ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_comments_nonneg_check;
ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_shares_nonneg_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_views_nonneg_check    CHECK (views_count    IS NULL OR views_count    >= 0),
  ADD CONSTRAINT jobs_likes_nonneg_check    CHECK (likes_count    IS NULL OR likes_count    >= 0),
  ADD CONSTRAINT jobs_comments_nonneg_check CHECK (comments_count IS NULL OR comments_count >= 0),
  ADD CONSTRAINT jobs_shares_nonneg_check   CHECK (shares_count   IS NULL OR shares_count   >= 0);

COMMENT ON COLUMN public.jobs.posted_url IS
  'Optional external URL where the user posted this content (YouTube/TikTok/Instagram/other). Null if not posted publicly.';
COMMENT ON COLUMN public.jobs.posted_platform IS
  'Detected platform from posted_url: youtube | tiktok | instagram | other. Null if no URL.';
COMMENT ON COLUMN public.jobs.posted_at IS
  'User-reported date the content was posted to the platform. Self-reported, not validated.';
COMMENT ON COLUMN public.jobs.engagement_captured_at IS
  'Server timestamp of the most recent views/likes/comments/shares update. Lets us show stale-data warnings.';
