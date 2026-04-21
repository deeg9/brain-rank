-- One-time Contribution Agreement consent captured at onboarding, replacing
-- the per-upload checkbox. Per-job stamping on jobs.consent_version still
-- happens for provenance; this table-level record is the "user accepted
-- version X at time Y" truth.
--
-- Backfill: existing profiles are implicitly marked as having accepted the
-- current version at migration time. Justification:
--   (a) They signed up agreeing to Terms and Privacy, which were updated to
--       reference the Contribution Agreement before this migration ran.
--   (b) Their existing job rows already carry per-job consent_version +
--       consented_at values from the prior per-upload checkbox design.
-- This backfill prevents legacy users from being locked out mid-session.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_version_accepted text,
  ADD COLUMN IF NOT EXISTS consent_accepted_at      timestamptz;

UPDATE public.profiles
SET
  consent_version_accepted = '2026-04-20',
  consent_accepted_at      = now()
WHERE consent_version_accepted IS NULL;

COMMENT ON COLUMN public.profiles.consent_version_accepted IS
  'Version of the Contribution Agreement the user accepted at onboarding.';
COMMENT ON COLUMN public.profiles.consent_accepted_at IS
  'Timestamp when the user last accepted the Contribution Agreement.';
