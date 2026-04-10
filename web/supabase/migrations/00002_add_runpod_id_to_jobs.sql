-- Migration: Add runpod_id column to jobs table
-- Stores the RunPod job ID for status polling

alter table public.jobs add column runpod_id text;
create index idx_jobs_runpod_id on public.jobs(runpod_id);
