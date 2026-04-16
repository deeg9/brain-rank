# Phase 70: Core Hub Pages Mobile — Context

**Gathered:** 2026-04-16
**Status:** Ready for planning
**Mode:** Auto-generated (minimal discuss)

<domain>
## Phase Boundary

Dashboard, Profile (private + public `/u/[username]`), Discover, Bookmarks pages render cleanly on iPhone 15 with no truncations or hardcoded desktop widths.
</domain>

<decisions>
### Strategy
- Keep desktop layout identical; only add `md:` responsive variants where mobile breaks
- Specific issues audited and fixed:
  - Profile + `/u/[username]`: hardcoded `max-w-[300px]` truncation → `min-w-0 flex-1 truncate`
  - Profile + `/u/[username]`: hero `p-10` → `p-6 md:p-10`, avatar `w-24 h-24` → `w-20 h-20 md:w-24 md:h-24`, `text-3xl` → `text-2xl md:text-3xl break-all`
  - Profile + `/u/[username]`: stat cards `p-8` → `p-6 md:p-8`, score `text-5xl` → `text-4xl md:text-5xl`
  - Dashboard: welcome header stacks (`flex-col md:flex-row md:justify-between`), hero text `text-4xl md:text-5xl` → `text-3xl md:text-5xl`, Analysis History toolbar stacks on narrow
  - Dashboard StatTile: inner `p-8` → `p-6 md:p-8`, score `text-5xl` → `text-4xl md:text-5xl`
  - Dashboard empty state: `p-16` → `p-8 md:p-16`, heading `text-4xl` → `text-3xl md:text-4xl`
  - Discover: `py-12` → `py-6 md:py-12`, filter dropdowns wrap + `flex-1 md:flex-none min-w-0` for mobile stacking
  - Bookmarks: `py-12` → `py-6 md:py-12`
</decisions>

<code_context>
### Reusable assets
- `DiscoverCard` — already `sm:grid-cols-2 lg:grid-cols-3` responsive
- `StatTile` — touched for padding + score size
- `ScoreBadge` — already small, no changes
- `VideoThumb` — already flex-shrink-0, no changes
</code_context>

<specifics>
- Removed all hardcoded `max-w-[300px]` truncations in favor of flex min-w-0 pattern
</specifics>

<deferred>
- DashboardGrid grid cell sizing — likely handled by DiscoverCard internally; if mobile audit surfaces issues, address in Phase 73 QA sweep
</deferred>
