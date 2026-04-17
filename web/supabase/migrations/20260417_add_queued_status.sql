-- Migration: Allow 'queued' as a valid jobs.status value
-- Needed for the batch-upload queue: when a user hits the per-user
-- concurrency cap, new jobs are inserted with status='queued' and
-- promoted to 'processing' (dispatched to RunPod) as earlier jobs finish.

alter table public.jobs
  drop constraint if exists jobs_status_check;

alter table public.jobs
  add constraint jobs_status_check
  check (status in ('pending', 'queued', 'processing', 'completed', 'failed'));
