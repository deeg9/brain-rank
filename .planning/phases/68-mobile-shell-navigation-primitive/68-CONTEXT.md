# Phase 68: Mobile Shell & Navigation Primitive - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish a responsive chrome — TopBar + AppShell + new MobileNavSheet — so every downstream v8.0 phase inherits a working mobile shell without touching the desktop layout.

**In scope:**
- `web/src/components/layout/AppShell.tsx` — responsive gutters
- `web/src/components/layout/TopBar.tsx` — hamburger on mobile, existing layout on desktop
- `web/src/components/layout/MobileNavSheet.tsx` — new component

**Out of scope:**
- Mobile styling of any specific page (Dashboard, Profile, etc.) — those live in Phases 69–72
- Desktop visual changes of any kind
</domain>

<decisions>
## Implementation Decisions

### Mobile Nav Sheet Implementation
- Sheet slides down from TopBar bottom on open (matches mental model that menu lives "in the header")
- Sheet dismissed via backdrop tap + X button top-right + ESC key (three redundant close paths for discoverability)
- User avatar stays in TopBar on mobile; hamburger opens a full nav sheet that also includes profile shortcuts (Profile / Bookmarks / Billing / Settings / Resources / Logout)
- Active-route highlighting in the sheet reuses the existing desktop pattern (filled icon background on current route)

### Responsive Strategy
- Breakpoint for nav swap: Tailwind `md:` (768px) — matches existing code conventions
- AppShell gutters: `p-4 md:p-8` (16px mobile / 32px desktop)
- TopBar horizontal padding: `px-4 md:px-8` — rhythm matches AppShell
- Logo size unchanged (`text-lg`) — brand recognition takes priority over tightening

### Claude's Discretion
- Exact transition duration and easing for the sheet animation (~200ms ease-out recommended)
- Touch target sizing for hamburger button (≥44×44px per QA-01)
- Focus trap behavior inside the sheet (standard — focus moves to first item on open, returns to hamburger on close)
- Whether to use Framer Motion (already a project dep) or CSS transitions for the sheet — either fine
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/components/layout/TopBar.tsx` — existing TopBar with navItems array, avatar fetch, credits fetch, logout handler. Reuse all hook logic — only extract the mobile rendering.
- `web/src/components/layout/AppShell.tsx` — thin wrapper around TopBar + main. Only `p-8` needs responsive treatment.
- `web/src/components/landing/**` — already uses `md:` breakpoint conventions for responsive design. Follow same pattern.
- Framer Motion is a dep (per Phase 67 work) — available for sheet animation if preferred.
- Material Symbols icons in use (`material-symbols-outlined`) — use `menu` and `close` for hamburger/X.

### Established Patterns
- Tailwind with CSS variables for theming (`bg-surface-container-low`, `text-on-surface-variant`)
- `hidden md:flex` / `flex md:hidden` pattern for mobile/desktop swaps (used in landing page)
- Dropdown menus use hover+group pattern — NOT suitable for mobile (no hover), so the sheet must use explicit tap state

### Integration Points
- TopBar is mounted by AppShell, which is used by every route in `app/(app)/layout.tsx` and similar
- No route in the app currently mounts a Sidebar (the Sidebar.tsx file exists but is unused, per earlier audit)
</code_context>

<specifics>
## Specific Ideas

- User explicitly requested "keeping a lot of what we already have but making sure it looks good on mobile" — favor mechanical transforms (hide/show, flex-col) over rewrites.
- User wants Playwright MCP iPhone 15 viewport verification screenshots for every change.
</specifics>

<deferred>
## Deferred Ideas

- Bottom tab bar navigation (considered as alternative, rejected for minimal architecture change)
- Left slide-out drawer (considered, rejected)
- PWA install prompt in the mobile sheet — deferred per Future Requirements
</deferred>
