---
phase: 45-profile-customization
plan: 01
subsystem: profile
tags: [avatar, bio, storage, settings, profile]
dependency_graph:
  requires: [44-02]
  provides: [avatar-upload, bio-editing, avatars-bucket]
  affects: [settings-page, profile-page, profile-api]
tech_stack:
  added: [supabase-storage-avatars]
  patterns: [canvas-resize-webp, preview-before-upload, client-component-wrapper]
key_files:
  created:
    - web/supabase/migrations/00006_create_avatars_bucket.sql
    - web/src/lib/avatar.ts
    - web/src/app/(app)/profile/AvatarDisplay.tsx
  modified:
    - web/src/app/api/profile/route.ts
    - web/src/app/(app)/settings/SettingsForm.tsx
    - web/src/app/(app)/settings/page.tsx
    - web/src/app/(app)/profile/page.tsx
decisions:
  - Used AvatarDisplay client component wrapper for initials rendering in server-component profile page
  - Cast Supabase query results to work around pre-existing never-type issue in generated Database types
metrics:
  duration: 286s
  completed: 2026-04-11T22:58:00Z
  tasks: 2
  files: 7
---

# Phase 45 Plan 01: Avatar Upload & Bio Editing Summary

Avatar upload with client-side 256x256 webp resize, preview-before-save flow, and bio textarea with live character counter on settings page; displayed on profile page with initials fallback.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 94b1df0 | Avatars storage bucket, avatar upload utility, and profile API bio extension |
| 2 | eaf741d | Avatar upload UI with preview, bio textarea with counter, and profile display |

## What Was Built

### Task 1: Storage, Utility, and API
- **Migration** (`00006_create_avatars_bucket.sql`): Creates `avatars` Supabase Storage bucket with public read and authenticated user-scoped write RLS policies using `storage.foldername(name)[1] = auth.uid()::text`
- **Avatar utility** (`avatar.ts`): `resizeToAvatar` (256x256 center-crop webp via canvas), `uploadAvatar` (Supabase Storage with cache-bust URL), `getInitials`, `getInitialsColor` (hash-based Tailwind color from 8-color palette)
- **Profile API** (`route.ts`): Extended PATCH handler to accept `bio` (max 160 chars, server-validated) and `avatar_url` alongside existing `username` field; builds dynamic update object with only provided fields

### Task 2: Settings UI and Profile Display
- **Settings page**: Avatar circle at top of Profile Information section with click-to-upload, local preview via `URL.createObjectURL`, Confirm/Cancel buttons during preview, loading spinner overlay during upload
- **Bio textarea**: 3-row textarea with `maxLength={160}`, live character counter that turns orange at 140 and red at 160
- **Save Profile**: Unified save button replaces "Save Username", sends only changed fields (username and/or bio) to PATCH /api/profile
- **Profile page**: Queries `avatar_url` and `bio` from profiles table, displays avatar image (or initials fallback via `AvatarDisplay` client component), @username, and bio text in hero card

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created AvatarDisplay client component for server component context**
- **Found during:** Task 2
- **Issue:** `avatar.ts` imports browser-only `createClient`, so importing it directly in the server-component profile page would fail
- **Fix:** Created `AvatarDisplay.tsx` as a `"use client"` component that wraps `getInitials`/`getInitialsColor` calls
- **Files created:** `web/src/app/(app)/profile/AvatarDisplay.tsx`
- **Commit:** eaf741d

**2. [Rule 3 - Blocking] Cast Supabase profile query results to avoid never-type**
- **Found during:** Task 2
- **Issue:** Supabase generated types resolve `.select()` results to `never` (pre-existing across entire codebase)
- **Fix:** Cast query results with explicit type annotations in settings/page.tsx and profile/page.tsx
- **Files modified:** `web/src/app/(app)/settings/page.tsx`, `web/src/app/(app)/profile/page.tsx`
- **Commit:** eaf741d

## Known Stubs

None -- all features are fully wired with real data sources.

## Self-Check: PASSED

All 7 files verified present. Both commit hashes (94b1df0, eaf741d) confirmed in git log.
