-- Migration: Add is_public flag to jobs for social discovery
-- Depends on: 00001_create_jobs_table.sql

-- Add is_public column (default false — existing jobs stay private)
ALTER TABLE public.jobs ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Allow anyone to view public jobs (for discovery/leaderboard)
CREATE POLICY "Anyone can view public jobs"
  ON public.jobs
  FOR SELECT
  USING (is_public = true);
