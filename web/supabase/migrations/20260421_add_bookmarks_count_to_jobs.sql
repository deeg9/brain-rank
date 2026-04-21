-- Extra engagement metric: TikTok "saves", Instagram "saves", YouTube "watch later"/"save".
-- Always-shown (no platform gating), nullable like the others.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS bookmarks_count bigint;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_bookmarks_nonneg_check;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_bookmarks_nonneg_check
  CHECK (bookmarks_count IS NULL OR bookmarks_count >= 0);

COMMENT ON COLUMN public.jobs.bookmarks_count IS
  'Self-reported bookmarks/saves count for the posted content. Null if not provided.';
