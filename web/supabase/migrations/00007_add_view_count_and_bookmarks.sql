-- Migration: Add view_count to jobs + create bookmarks table
-- Supports SOC-01 (view counts) and SOC-02 (bookmarks)

-- Add view_count column to jobs
alter table public.jobs add column view_count integer not null default 0;

-- Create bookmarks table (composite PK, no separate id column)
create table public.bookmarks (
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, job_id)
);

-- Index for fast user bookmark listing
create index idx_bookmarks_user_id on public.bookmarks(user_id);

-- Enable RLS on bookmarks
alter table public.bookmarks enable row level security;

-- RLS policies for bookmarks: users can only manage their own bookmarks
create policy "Users can view own bookmarks"
  on public.bookmarks
  for select
  using (auth.uid() = user_id);

create policy "Users can create own bookmarks"
  on public.bookmarks
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.bookmarks
  for delete
  using (auth.uid() = user_id);

-- RPC function for atomic view count increment (security definer bypasses RLS)
-- Only increments for public jobs to prevent probing private job existence
create or replace function public.increment_view_count(p_job_id uuid)
returns void as $$
begin
  update public.jobs
  set view_count = view_count + 1
  where id = p_job_id and is_public = true;
end;
$$ language plpgsql security definer;
