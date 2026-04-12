-- Migration: Add optional title column to jobs table
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

alter table public.jobs add column title text;
