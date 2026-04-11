---
phase: 44-social-schema-identity-foundation
plan: 01
subsystem: database-schema
tags: [database, migration, profiles, social, identity]
dependency_graph:
  requires: []
  provides: [profiles-table, is-public-flag, profile-types]
  affects: [web/supabase/migrations, web/src/lib/database.types.ts]
tech_stack:
  added: [citext-extension]
  patterns: [security-definer-trigger, rls-public-read, backfill-migration]
key_files:
  created:
    - web/supabase/migrations/00004_create_profiles_table.sql
    - web/supabase/migrations/00005_add_is_public_to_jobs.sql
  modified:
    - web/src/lib/database.types.ts
decisions:
  - "Username allows NULL (new users get profile without username, claim later)"
  - "is_public defaults to false (existing jobs stay private)"
  - "Reuse existing handle_updated_at trigger function from 00001 migration"
metrics:
  duration: 80s
  completed: "2026-04-11T21:37:56Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 44 Plan 01: Social Schema & Identity Foundation Summary

Database schema for social identity: profiles table with citext usernames, auto-creation trigger with SECURITY DEFINER, RLS policies for public read / owner update, is_public flag on jobs, and TypeScript type definitions.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create profiles table migration and is_public migration | 4c39e1d | 00004_create_profiles_table.sql, 00005_add_is_public_to_jobs.sql |
| 2 | Update TypeScript database types with Profile interface | de89b7d | database.types.ts |

## What Was Built

### Migration 00004: Profiles Table
- Enabled `citext` extension for case-insensitive usernames
- Created `public.profiles` table with: id (uuid PK, FK to auth.users), username (citext UNIQUE), avatar_url, bio, created_at, updated_at
- CHECK constraint enforces username format: `^[a-z0-9_]+$`, length 3-20, allows NULL
- SECURITY DEFINER trigger function `handle_new_user()` auto-creates profile on auth.users insert
- Reused existing `handle_updated_at()` function for updated_at trigger
- RLS: SELECT open to all (public profiles), UPDATE restricted to owner
- Backfill: existing auth.users rows inserted into profiles with ON CONFLICT DO NOTHING

### Migration 00005: is_public on Jobs
- Added `is_public boolean NOT NULL DEFAULT false` to jobs table
- Created RLS policy allowing anyone to SELECT jobs where `is_public = true`

### TypeScript Types
- Added `Profile` interface with all 6 columns
- Added `is_public: boolean` to `Job` interface
- Added `profiles` table definition to `Database` type with Row/Insert/Update
- Made `is_public` optional in jobs Insert type (server defaults to false)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all schema and types are fully wired.

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|-----------|
| T-44-01 | handle_new_user uses SECURITY DEFINER, body contains only INSERT with NEW.id (no user input) |
| T-44-02 | UPDATE RLS policy uses `auth.uid() = id` restricting to owner |
| T-44-03 | Accepted: profiles intentionally public, only non-sensitive data exposed |
| T-44-04 | CHECK constraint `'^[a-z0-9_]+$'` enforced server-side regardless of client |

## Self-Check: PASSED

All files exist. All commits verified.
