-- Add research-beta consent columns to jobs.
-- consent_version tracks which version of the Contribution Agreement the
-- user agreed to. consented_at is the server-side timestamp of the upload.
-- Both are nullable for backfill safety; enforced at app layer for new jobs.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ;

COMMENT ON COLUMN public.jobs.consent_version IS
  'Version string of the Contribution Agreement the user accepted when this job was created. e.g. "2026-04-20".';

COMMENT ON COLUMN public.jobs.consented_at IS
  'Server timestamp of the consent-at-upload event. Null for jobs created before consent tracking.';
