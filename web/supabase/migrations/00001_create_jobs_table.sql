-- Migration: Create jobs table for NeuroCut analysis jobs
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Create jobs table
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  video_url text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  results jsonb,
  error_message text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for fast user-scoped queries
create index idx_jobs_user_id on public.jobs(user_id);

-- Index for status filtering
create index idx_jobs_status on public.jobs(status);

-- Enable Row Level Security
alter table public.jobs enable row level security;

-- Policy: Users can read their own jobs
create policy "Users can view own jobs"
  on public.jobs
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own jobs
create policy "Users can create own jobs"
  on public.jobs
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own jobs
create policy "Users can update own jobs"
  on public.jobs
  for update
  using (auth.uid() = user_id);

-- Auto-update updated_at on row changes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_jobs_updated
  before update on public.jobs
  for each row
  execute function public.handle_updated_at();
