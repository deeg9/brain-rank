# Phase 72: Settings, Billing, Pricing, Resources, Use-Cases Mobile — Context

**Gathered:** 2026-04-16
**Status:** Ready for planning
**Mode:** Auto-generated

<domain>
## Phase Boundary

Settings, Billing, Pricing, Resources, Use-Cases pages render cleanly on iPhone 15.
</domain>

<decisions>
### Strategy
- Common pattern: responsive card padding `p-8` → `p-5 md:p-8`, heading `text-4xl` → `text-3xl md:text-4xl`, py-12 → py-6 md:py-12
- Resources + Use-Cases need `px-4 md:px-0` horizontal gutter at the container (no AppShell wrapping them with side padding on /public routes)
- Billing and Pricing already use `text-3xl md:text-4xl lg:text-5xl` for heading — just reduce vertical `py-12`
- Settings inherits AppShell gutters from Phase 68 (p-4 md:p-8) — just heading size + form card padding
</decisions>

<code_context>
### Files touched
- `web/src/app/(app)/settings/page.tsx` — heading + mb
- `web/src/app/(app)/settings/SettingsForm.tsx` — 3× section `p-8` → `p-5 md:p-8`
- `web/src/app/(app)/settings/billing/page.tsx` — `py-12 mx-auto` → `py-6 md:py-12 mx-auto px-4`
- `web/src/components/pricing/PricingPage.tsx` — same as billing
- `web/src/app/(public)/resources/page.tsx` — `px-4 md:px-0`, heading `text-3xl md:text-4xl`, 5× sections `p-5 md:p-8`
- `web/src/app/(app)/use-cases/page.tsx` — same treatment + black CTA card + p-8 space-y-4 variant
</code_context>

<specifics>
- No structural changes — just padding/typography scaling
</specifics>

<deferred>
None.
</deferred>
