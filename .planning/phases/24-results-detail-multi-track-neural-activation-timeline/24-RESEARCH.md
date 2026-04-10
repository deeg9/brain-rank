# Phase 24: Results Detail Multi-Track Neural Activation Timeline - Research

**Researched:** 2026-04-09
**Domain:** Recharts AreaChart, SVG gradients, multi-chart synchronization, Next.js client components
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use Recharts. Install `recharts` in web/.
- **D-02:** 4 separate `<AreaChart>` components stacked vertically — NOT a single stacked area chart.
- **D-03:** Track colors: Attention `#60a5fa`, Reward `#a78bfa`, Emotional Processing `#f472b6`, Social Cognition `#fbbf24`
- **D-04:** Each area chart uses SVG linearGradient fill fading to transparent at bottom.
- **D-05:** Use existing `SegmentData.regions` object — no new API/data fetching.
- **D-06:** X-axis maps to segment time ranges (`start`/`end` seconds). Shared time domain.
- **D-07:** New component at `web/src/components/results/NeuralTimeline.tsx`.
- **D-08:** Keep existing `ActivationTimeline.tsx` intact — it's used on Results Overview.
- **D-09:** Hover tooltip showing all 4 region values + timestamp. Custom Recharts tooltip, dark theme, surface-bright glassmorphism.
- **D-10:** Vertical crosshair spanning all 4 tracks on hover. Implementation approach at Claude's discretion.
- **D-11:** 16:9 video player placeholder (surface-container-lowest) with centered play icon and duration display. No real playback.
- **D-12:** Page layout order: Back nav + filename + export → Video Player Placeholder → Neural Timeline → Metric Cards row → Region Breakdown + Segment Table.

### Claude's Discretion
- Chart height per track (~80px suggested, adjust for visual balance)
- Tooltip positioning and animation
- Whether to add shared time axis label or per-track labels
- Responsive behavior at smaller viewports
- Any Recharts performance optimizations needed

### Deferred Ideas (OUT OF SCOPE)
- Video-timeline sync (scrubbing)
- Segment click-to-seek
- Timeline zoom/pan
- Comparison mode overlaying two videos' timelines
</user_constraints>

---

## Summary

Phase 24 adds a Recharts-based multi-track neural activation timeline to the Results Detail page. The core component is `NeuralTimeline.tsx` — 4 vertically stacked `<AreaChart>` instances sharing a synchronized crosshair, each rendering one brain region's per-segment score over video time.

Recharts 3.8.1 (released 2026-03-25) supports React 19 and provides `syncId` for cross-chart tooltip/cursor synchronization — this is the canonical approach for the shared crosshair requirement. SVG `<linearGradient>` inside `<defs>` handles the transparent-fade fill. The `'use client'` directive on the component plus `dynamic(() => import(...), { ssr: false })` at the import site prevents ResponsiveContainer hydration mismatches in Next.js App Router.

**Primary recommendation:** Use `syncId="neural-timeline"` on all 4 `<AreaChart>` components. Define per-track gradient IDs in `<defs>`. Render only the bottom chart's `<XAxis>` (use `hide` on the other 3). Use a single shared custom `<Tooltip content={<CustomTooltip />}>` on each chart — Recharts will invoke it on the active chart; the payload from `syncId` propagates to all.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.1 | AreaChart, Tooltip, XAxis, ResponsiveContainer | Only charting library locked by D-01. React 19 compatible. [VERIFIED: npm registry, published 2026-03-25] |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react | 19.2.4 | Component rendering | Already installed [VERIFIED: web/package.json] |
| next | 16.2.3 | App Router, dynamic imports | Already installed [VERIFIED: web/package.json] |

**Installation:**
```bash
cd web && npm install recharts
```

**Peer deps satisfied:** Recharts 3.8.1 peer deps are `react ^16.8 || ^17 || ^18 || ^19` and `react-dom` same range — React 19.2.4 satisfies both. [VERIFIED: npm registry]

---

## Architecture Patterns

### Data Transform: SegmentData → Chart Points

Each `SegmentData` segment has `{ start, end, regions: { attention, reward, emotional_processing, social_cognition } }`. The timeline X-axis represents time in seconds. Each segment maps to a data point at its midpoint (or use `start` for left-edge convention):

```typescript
// Source: derived from SegmentData type in web/src/components/results/SegmentTable.tsx
interface TimelinePoint {
  t: number;          // seconds — X axis value (use segment.start)
  value: number;      // 0-1 score for this track
}

function toTimelineData(segments: SegmentData[], key: keyof SegmentRegionScores): TimelinePoint[] {
  return segments.map(seg => ({
    t: seg.start,
    value: seg.regions[key],
  }));
}
```

This produces separate arrays per track, each with the same `t` domain — required for `syncId` to work correctly with `syncMethod="value"`.

### Pattern 1: SVG linearGradient Fill (Transparent Fade)

Place `<defs>` inside `<AreaChart>`. The gradient ID must be unique per track to avoid SVG ID collisions when 4 charts render simultaneously.

```typescript
// Source: verified against recharts docs + leanylabs.com/blog/awesome-react-charts-tips/
<AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
  <defs>
    <linearGradient id="gradient-attention" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
    </linearGradient>
  </defs>
  <Area
    type="monotone"
    dataKey="value"
    stroke="#60a5fa"
    strokeWidth={2}
    fill="url(#gradient-attention)"
    fillOpacity={1}
    dot={false}
    activeDot={{ r: 4, fill: "#60a5fa" }}
    isAnimationActive={false}
  />
</AreaChart>
```

**Critical:** `fillOpacity={1}` on `<Area>` — the opacity is already encoded in `stopOpacity`. Setting `fillOpacity` lower multiplies and darkens the gradient. [VERIFIED: recharts docs + GitHub issue #1319]

**Safari gradient bug:** SVG gradients using `gradientUnits="userSpaceOnUse"` (non-default) break in Safari. Use default `gradientUnits="objectBoundingBox"` (x1/x2/y1/y2 as 0-1 ratios) — the pattern above is safe. [CITED: github.com/recharts/recharts/issues/1813]

### Pattern 2: Shared Crosshair via syncId

`syncId` is the Recharts-native solution for synchronizing cursor/tooltip across multiple charts. All charts with the same `syncId` string fire tooltip updates together.

```typescript
// Source: recharts docs, recharts.github.io/en-US/api/AreaChart
const SYNC_ID = "neural-timeline";

// Applied to all 4 AreaChart instances:
<AreaChart
  data={attentionData}
  syncId={SYNC_ID}
  syncMethod="value"   // sync by x-value (time), not array index
  // ...
>
```

**`syncMethod="value"` vs `"index"`:** Since all tracks share the same `t` values (same segments), either works. Use `"value"` for correctness — it matches by the actual x-axis value, not array position. [VERIFIED: recharts docs]

**Cursor line appearance:** By default `syncId` shows the cursor line on all synchronized charts. The `<Tooltip cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}/>` prop customizes the vertical line style on each chart.

### Pattern 3: Custom Dark Tooltip

Recharts calls the `content` render prop with `{ active, payload, label }`. `label` is the x-axis value (timestamp in seconds). `payload` contains the single `value` for the hovered chart. With `syncId`, each chart renders its own tooltip independently — to show all 4 values in one tooltip, pass `allData` as a closure and look up by timestamp:

```typescript
// Recommended approach: compute lookup map once, pass to tooltip via closure
function makeTooltipContent(
  allTracks: { label: string; color: string; data: TimelinePoint[] }[]
) {
  // Build t → {label, value}[] map
  const lookup = new Map<number, { label: string; color: string; value: number }[]>();
  allTracks.forEach(({ label, color, data }) => {
    data.forEach(pt => {
      if (!lookup.has(pt.t)) lookup.set(pt.t, []);
      lookup.get(pt.t)!.push({ label, color, value: pt.value });
    });
  });

  return function CustomTooltip({ active, label }: { active?: boolean; label?: number }) {
    if (!active || label === undefined) return null;
    const entries = lookup.get(label) ?? [];
    return (
      <div className="bg-surface-bright/90 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="font-mono text-[10px] text-on-surface-variant mb-2">
          {formatTimestamp(label)}
        </p>
        {entries.map(e => (
          <div key={e.label} className="flex items-center gap-2 text-xs font-headline">
            <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
            <span className="text-on-surface-variant">{e.label}</span>
            <span className="ml-auto font-bold" style={{ color: e.color }}>
              {(e.value * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    );
  };
}
```

Only render this tooltip on the **top chart** — the other 3 use `<Tooltip content={() => null} />` or `cursor` only. This prevents 4 tooltips rendering at once while keeping the cursor line on all charts.

Alternative: show no tooltip on any chart, render a separate external tooltip div via shared React state (mousemove handler on a wrapper div). More control but more code.

### Pattern 4: XAxis — Show Only on Bottom Chart

```typescript
// Top 3 charts — no X axis displayed
<XAxis dataKey="t" type="number" domain={[0, duration]} hide={true} />

// Bottom chart — show time labels
<XAxis
  dataKey="t"
  type="number"
  domain={[0, duration]}
  tickFormatter={(s: number) => formatTimestamp(s)}
  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'monospace' }}
  axisLine={false}
  tickLine={false}
/>
```

**`type="number"` is required** when X values are numeric seconds — otherwise Recharts treats them as categories and spacing is wrong. [VERIFIED: recharts docs]

### Pattern 5: Y-Axis Configuration

```typescript
<YAxis
  domain={[0, 1]}
  width={32}
  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
  tickFormatter={(v: number) => `${(v * 100).toFixed(0)}`}
  tickCount={3}
  axisLine={false}
  tickLine={false}
/>
```

Small `width={32}` keeps the y-axis label area tight. `tickCount={3}` gives 0 / 50 / 100 labels. All 4 charts use the same `domain={[0, 1]}` for visual consistency.

### Pattern 6: ResponsiveContainer — Next.js SSR Fix

`ResponsiveContainer` requires DOM measurement and cannot run server-side. In Next.js App Router, even `'use client'` components pre-render on the server. The fix is `dynamic()` with `ssr: false` at the **import site** in the parent page:

```typescript
// web/src/app/(app)/results/[id]/page.tsx
import dynamic from 'next/dynamic';

const NeuralTimeline = dynamic(
  () => import('@/components/results/NeuralTimeline').then(m => m.NeuralTimeline),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-96" /> }
);
```

This guarantees `NeuralTimeline` (and its 4 `ResponsiveContainer` instances) only mount client-side, eliminating hydration mismatches. [VERIFIED: multiple sources — Next.js docs, recharts/recharts#3595]

### Pattern 7: Track Configuration Array

Define a single config array to drive the 4 charts generically:

```typescript
// Source: derived from CONTEXT.md D-03 and existing REGION_CONFIG pattern in RegionBreakdown.tsx
const TRACK_CONFIG = [
  { key: 'attention' as const,            label: 'Attention',             color: '#60a5fa', gradientId: 'gradient-attention' },
  { key: 'reward' as const,               label: 'Reward',                color: '#a78bfa', gradientId: 'gradient-reward' },
  { key: 'emotional_processing' as const, label: 'Emotional Processing',  color: '#f472b6', gradientId: 'gradient-emotional' },
  { key: 'social_cognition' as const,     label: 'Social Cognition',      color: '#fbbf24', gradientId: 'gradient-social' },
] satisfies { key: keyof SegmentRegionScores; label: string; color: string; gradientId: string }[];
```

Map over `TRACK_CONFIG` to render 4 `<SingleTrack>` sub-components. Each `<SingleTrack>` receives its config + data slice + `isLast` boolean for X-axis visibility.

### Recommended Component Structure

```
web/src/components/results/
└── NeuralTimeline.tsx     # Primary component (new)
    ├── TRACK_CONFIG[]     # 4-track color/key/label config
    ├── toTimelineData()   # SegmentData[] → TimelinePoint[]
    ├── makeTooltipContent() # Closure for cross-track tooltip
    ├── SingleTrack        # Renders one AreaChart with defs/Area/axes
    └── NeuralTimeline     # Exported: stacks 4 SingleTrack, wraps in card
```

### Anti-Patterns to Avoid

- **Using stacked AreaChart (`stackOffset`):** D-02 requires separate charts. A single stacked chart shares a Y-axis — wrong for independent track weights.
- **Unique SVG gradient IDs per render:** Use stable string IDs like `"gradient-attention"` not `"gradient-" + Math.random()`. SVG ID collisions between renders cause wrong fill colors.
- **Rendering on server without `ssr: false`:** `ResponsiveContainer` measures DOM — server has no DOM. Will throw or produce 0-width charts.
- **Setting `fillOpacity < 1` on `<Area>` when using gradient:** Multiplies with `stopOpacity`, making gradient darker than expected.
- **Using `syncMethod="index"` when data arrays could have different lengths:** If any segment is filtered/missing, index sync sends tooltip to wrong data point.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-chart cursor sync | Manual mousemove state + SVG overlay | `syncId` prop on AreaChart | Built-in Recharts feature — handles edge cases, resize, touch |
| Chart responsiveness | ResizeObserver + state width | `<ResponsiveContainer width="100%" height={height}>` | Recharts handles debounced resize internally |
| Gradient SVG | Custom SVG element outside chart | `<defs><linearGradient>` inside AreaChart | Must be inside chart SVG scope for `fill="url(#id)"` to resolve |

---

## Common Pitfalls

### Pitfall 1: SVG Gradient ID Collision
**What goes wrong:** All 4 charts render `<linearGradient id="colorGradient">` — the last one wins, all charts use the last track's color.
**Why it happens:** SVG IDs are global in the document, not scoped to the chart SVG.
**How to avoid:** Use unique IDs per track: `gradient-attention`, `gradient-reward`, etc. (hardcoded strings, not dynamic).

### Pitfall 2: ResponsiveContainer SSR Error
**What goes wrong:** `Error: window is not defined` or hydration mismatch warnings on the chart container.
**Why it happens:** Next.js App Router pre-renders all client components on the server; `ResponsiveContainer` calls `window.requestAnimationFrame`.
**How to avoid:** Import `NeuralTimeline` with `dynamic(..., { ssr: false })` in the Results Detail page.

### Pitfall 3: XAxis type="category" Causing Uneven Spacing
**What goes wrong:** Segments of different durations show equal-width bars rather than time-proportional spacing.
**Why it happens:** Default `type="category"` treats each data point as a bucket regardless of numeric value.
**How to avoid:** Set `type="number"` on XAxis + `domain={[0, duration]}`. Use `dataKey="t"` where `t` is the numeric start time.

### Pitfall 4: syncId Tooltip Appearing on All 4 Charts
**What goes wrong:** 4 tooltip popups appear simultaneously on hover.
**Why it happens:** Each AreaChart with syncId renders its own Tooltip independently.
**How to avoid:** Only the first chart uses `<Tooltip content={<CustomTooltip />} />`. The other 3 use `<Tooltip content={() => null} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }} />` to show cursor line but no popup.

### Pitfall 5: Animation Causing Flash on Mount
**What goes wrong:** Charts animate in from 0 on every page load, creating a jarring flash.
**Why it happens:** Recharts defaults to animated fills.
**How to avoid:** Set `isAnimationActive={false}` on `<Area>`. With 4 charts loading simultaneously, staggered animations look unpolished.

---

## Code Examples

### Complete SingleTrack Component Pattern

```typescript
// Source: recharts docs + gradient pattern from leanylabs.com/blog/awesome-react-charts-tips/
interface SingleTrackProps {
  data: TimelinePoint[];
  config: typeof TRACK_CONFIG[number];
  duration: number;
  isLast: boolean;
  tooltipContent: React.ComponentType<any> | null;
}

function SingleTrack({ data, config, duration, isLast, tooltipContent }: SingleTrackProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Track label — left side */}
      <div className="w-20 shrink-0 text-right">
        <span
          className="font-headline text-[9px] uppercase tracking-widest"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1" style={{ height: 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            syncId="neural-timeline"
            syncMethod="value"
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="t"
              type="number"
              domain={[0, duration]}
              hide={!isLast}
              tickFormatter={(s: number) => formatTimestamp(s)}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              width={32}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
              tickFormatter={(v: number) => `${Math.round(v * 100)}`}
              tickCount={3}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={tooltipContent ? <tooltipContent /> : () => null}
              cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={config.color}
              strokeWidth={2}
              fill={`url(#${config.gradientId})`}
              fillOpacity={1}
              dot={false}
              activeDot={{ r: 3, fill: config.color, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

### Video Player Placeholder (16:9)

```typescript
// Source: derived from design spec in 260409-s0u-SUMMARY.md section B
interface VideoPlaceholderProps {
  durationSeconds: number;
}

function VideoPlaceholder({ durationSeconds }: VideoPlaceholderProps) {
  return (
    <div className="bg-surface-container rounded-xl overflow-hidden">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 */ }}>
        <div className="absolute inset-0 bg-surface-container-lowest flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 opacity-40">
            <span className="material-symbols-outlined text-5xl text-on-surface">
              play_circle
            </span>
            <span className="font-mono text-xs text-on-surface-variant">
              {formatTimestamp(durationSeconds)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual cursor sync via React state + onMouseMove | `syncId` prop (built-in) | Recharts 2.x | No custom event handling needed |
| `ResponsiveContainer` blocking SSR | `dynamic(() => import(...), { ssr: false })` | Next.js 13+ App Router | Required for App Router |

---

## Environment Availability

Step 2.6: SKIPPED — Phase is purely code changes installing an npm package. No external services, CLIs, or runtimes beyond Node.js/npm required.

---

## Validation Architecture

Nyquist validation: No test config detected in `web/` for Recharts component tests. This is a pure UI rendering component. Validation is visual/manual.

**Quick check command:**
```bash
cd web && npm run build
```
Build passing (no TypeScript errors) is the gate. Visual inspection in browser confirms gradient fills, cursor sync, and tooltip behavior.

**Wave 0 Gaps:**
- No automated test file needed — component is pure visual. Build pass is sufficient gate.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `syncMethod="value"` works correctly when all 4 tracks have identical `t` values (same segment starts) | Pattern 2 | Low — if `"index"` is needed, swap syncMethod; behavior identical when arrays are same length |
| A2 | Showing tooltip only on first chart and `() => null` on others prevents multiple popups | Pattern 3 | Low — fallback is external tooltip div via wrapper onMouseMove |
| A3 | `isAnimationActive={false}` on `<Area>` is sufficient to disable mount animation | Pattern 7 | Low — worst case is cosmetic flash; set on chart-level if needed |

---

## Open Questions

1. **Track height — 80px vs taller**
   - Design spec suggests ~80px per track. At 80px with y-axis ticks, grid lines, and the area fill, charts may feel cramped.
   - Recommendation: Start at 80px. If data is noisy (many segments), increase to 100-120px. The total block (4 tracks + labels) at 80px = ~400px, which fits comfortably between video placeholder and metric cards.

2. **Tooltip placement — on top chart or external div**
   - The described approach (tooltip on top chart only, cursor on all) is clean but means the tooltip appears near the top of the 4-chart block regardless of which track you hover.
   - Alternative: wrapper `div` with `onMouseMove` driving external tooltip positioned at cursor. More work, more precise.
   - Recommendation: Try syncId approach first — it's much less code and covers the requirement.

3. **Shared time axis label**
   - CONTEXT.md leaves this to Claude's discretion.
   - Recommendation: Only the bottom chart shows X-axis ticks. Add a small "Time" label via `<XAxis label={{ value: 'Time', position: 'insideBottom', offset: -4 }}>` or simply omit — the formatTimestamp ticks are self-explanatory.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] — recharts 3.8.1, published 2026-03-25, React 19 peer dep satisfied
- [VERIFIED: recharts.github.io/en-US/api/AreaChart] — syncId, syncMethod, margin props
- [VERIFIED: recharts.github.io/en-US/api/Tooltip] — content, cursor, wrapperStyle props
- [VERIFIED: recharts.github.io/en-US/api/Area] — fill, fillOpacity, isAnimationActive, activeDot props
- [VERIFIED: recharts.github.io/en-US/api/XAxis] — hide, type="number", domain, tickFormatter props

### Secondary (MEDIUM confidence)
- [CITED: leanylabs.com/blog/awesome-react-charts-tips/] — SVG linearGradient pattern, SSR ResponsiveContainer approach
- [CITED: github.com/recharts/recharts/issues/1813] — Safari gradient bug with non-default gradientUnits
- [CITED: github.com/recharts/recharts/issues/3595] — ResponsiveContainer SSR issue confirmation

### Project Sources (VERIFIED)
- `web/src/components/results/SegmentTable.tsx` — SegmentData, SegmentRegionScores types
- `web/src/components/results/RegionBreakdown.tsx` — REGION_CONFIG pattern (replicated for TRACK_CONFIG)
- `web/src/app/(app)/results/[id]/page.tsx` — current page layout, import points
- `.planning/phases/24-results-detail-multi-track-neural-activation-timeline/24-CONTEXT.md` — all locked decisions
- `.planning/quick/260409-s0u-.../260409-s0u-SUMMARY.md` — design spec for sections A-E

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Recharts 3.8.1 version verified against npm registry
- Architecture (syncId, gradient): HIGH — verified against official Recharts API docs
- SSR/hydration fix: HIGH — confirmed via Next.js docs + recharts GitHub issue
- Pitfalls: HIGH — SVG gradient collision and SSR issues are documented in official sources

**Research date:** 2026-04-09
**Valid until:** 2026-07-09 (Recharts is a stable library; 90-day window is conservative)
