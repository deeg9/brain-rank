---
phase: 23-error-handling
plan: 01
subsystem: web-error-handling
tags: [error-pages, offline-detection, ux]
dependency_graph:
  requires: []
  provides: [error-pages, offline-overlay]
  affects: [web/src/app/not-found.tsx, web/src/app/error.tsx, web/src/components/OfflineDetector.tsx, web/src/app/(app)/layout.tsx]
tech_stack:
  added: []
  patterns: [browser-online-offline-events, client-component-overlay]
key_files:
  created:
    - web/src/components/OfflineDetector.tsx
  modified:
    - web/src/app/not-found.tsx
    - web/src/app/error.tsx
    - web/src/app/(app)/layout.tsx
decisions:
  - Used inline full-screen layouts instead of AuthLayout for error pages to match Stitch reference designs (suppressed sidebar/nav)
  - 500 diagnostics card shows mock data only, never real stack traces (T-23-02 mitigation)
  - OfflineDetector uses 1s delay before confirming reconnection for stability
metrics:
  duration: 150s
  completed: 2026-04-10T01:50:45Z
  tasks_completed: 2
  tasks_total: 2
---

# Phase 23 Plan 01: Error Pages and Offline Detection Summary

Polished 404/500 error pages matching Stitch designs with ambient glows, large typography, diagnostics card, and offline detection overlay with automatic retry.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Upgrade 404 and 500 error pages | 70e8398 | web/src/app/not-found.tsx, web/src/app/error.tsx |
| 2 | Offline detection component | 6ad43e0 | web/src/components/OfflineDetector.tsx, web/src/app/(app)/layout.tsx |

## Implementation Details

### Task 1: Error Pages

**404 page (not-found.tsx):** Full-screen centered layout with fixed header bar, ambient primary glow blob, illustration area with `psychology_alt` icon and decorative dots, massive "404" heading in primary color, "Page not found" subheading, descriptive text, neural-gradient "Back to Dashboard" button, footer metadata ("System Status: Operational", "Error Code: 0xNEURAL_VOID"), and subtle background grid texture.

**500 page (error.tsx):** Full-screen layout with dual ambient glows (primary + secondary), error icon in circular container with error-glow shadow, faded "500" background text, "Something went wrong" heading, neural-gradient "Try Again" button calling `reset()`, "Back to Dashboard" text link, glassmorphism diagnostics card with mock system messages, and footer with animated error dot and error code. Remains `"use client"` with proper `reset` prop handling.

### Task 2: Offline Detection

**OfflineDetector.tsx:** Client component using `navigator.onLine` and `online`/`offline` event listeners. When offline, renders a fixed z-[100] full-screen overlay with blurred backdrop matching the Stitch offline reference -- wifi_off icon in circular container with error glow, "You're offline" heading, connection description, spinning status indicator with "Checking connection..." label, and "Retry Now" button. On reconnection, shows brief "Reconnected!" confirmation with check_circle icon before auto-dismissing after 1.5s. Wired into `web/src/app/(app)/layout.tsx` for global coverage.

## Deviations from Plan

None -- plan executed exactly as written.

## Threat Surface

500 error page diagnostics card displays only hardcoded mock text ("Neural pathway timeout at 0x88432", etc.), never exposing real error details or stack traces. This satisfies T-23-02 mitigation requirement.

## Known Stubs

None -- all components are fully functional with real browser API integration.

## Self-Check: PASSED

All files exist and all commits verified.
