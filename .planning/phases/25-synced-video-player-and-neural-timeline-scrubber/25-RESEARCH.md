# Phase 25: Synced Video Player and Neural Timeline Scrubber - Research

**Researched:** 2026-04-09
**Domain:** HTML5 Video API, Recharts click/ReferenceLine interaction, React video-timeline sync, custom video controls
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use native HTML5 `<video>` element with a custom React wrapper (no third-party player library like react-player).
- **D-02:** Custom controls overlay matching the Neural Editorial design system -- play/pause, progress bar, time display, speed selector (0.5x, 1x, 1.5x, 2x), volume. Dark glassmorphism surface.
- **D-03:** Player sits above the NeuralTimeline on the Results Detail page, replacing the current basic `<video controls>` element at line ~218 of `results/[id]/page.tsx`.
- **D-04:** Shared `currentTime` state managed by the parent page (`results/[id]/page.tsx`) and passed to both VideoPlayer and NeuralTimeline via props/callbacks.
- **D-05:** Video to Timeline: `onTimeUpdate` event fires on the video (~4x/sec), updates `currentTime` state, NeuralTimeline renders a vertical playhead line.
- **D-06:** Timeline to Video: Clicking/dragging on the NeuralTimeline sets `currentTime`, which seeks the video via `videoRef.current.currentTime = newTime`.
- **D-07:** NeuralTimeline needs a new `currentTime` prop and an `onSeek` callback prop. Existing Recharts charts need a `ReferenceLine` at the current time position.
- **D-08:** Floating panel shows 4 brain region values at current playhead position, updates in real-time.
- **D-09:** Find closest segment to `currentTime` and display its region values with matching colors.
- **D-10:** Display as compact horizontal bar near timeline, not a separate card.
- **D-11:** Speed controls: 0.5x, 1x, 1.5x, 2x via `videoRef.current.playbackRate`.
- **D-12:** Clicking anywhere on the NeuralTimeline area charts should seek to that timestamp.
- **D-13:** Optional: draggable scrubber handle. Claude's discretion.

### Claude's Discretion
- Exact layout of speed controls (dropdown vs pill buttons)
- Whether to show mini-waveform or progress bar on video player
- Animation/transition for the playhead line
- Interpolation between segments vs snap to nearest
- Keyboard shortcuts (space for play/pause, arrow keys for seek)
- Whether draggable scrubber handle adds value vs click-to-seek

### Deferred Ideas (OUT OF SCOPE)
- Thumbnail preview on timeline hover
- Segment annotations/markers on timeline
- Side-by-side A/B video comparison
- Export specific segments as clips
</user_constraints>

---

## Summary

This phase adds the core interactive feature of NeuroCut: a synced video player + neural timeline where scrubbing the timeline seeks the video, and playing the video moves a playhead across the 4-track Recharts timeline. The technical challenge is bidirectional sync between an HTML5 `<video>` element and Recharts `ReferenceLine` components at acceptable frame rates.

The HTML5 Video API is well-suited for custom React players. The `useRef` pattern for video element control, `timeupdate` event for playback tracking, and `playbackRate` property for speed control are all stable, well-documented browser APIs. No third-party library is needed (aligned with D-01).

For the Recharts side, the key finding is that `AreaChart` onClick handlers receive `activeLabel` in the callback -- this is the actual x-axis data value (the timestamp in seconds), not a pixel coordinate. Combined with Recharts' `ReferenceLine` component that accepts an `x` prop positioned by data value, the bidirectional sync is straightforward: `onClick` -> `activeLabel` -> parent state -> `ReferenceLine x={currentTime}` + `videoRef.current.currentTime = newTime`.

**Primary recommendation:** Use `onTimeUpdate` (not `requestAnimationFrame`) for video-to-timeline sync at ~4Hz update rate. This is sufficient because Recharts re-renders are not free -- updating a `ReferenceLine` at 60fps would cause performance issues. For timeline-to-video sync, use the `onClick` handler on `AreaChart` which provides `activeLabel` (the data-domain x value). The `ReferenceLine` component renders a vertical line at the data position without pixel math.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.1 | AreaChart, ReferenceLine, chart onClick | Already installed from Phase 24. ReferenceLine accepts data-domain `x` value. [VERIFIED: node_modules type definitions] |
| react | 19.2.4 | useRef, useState, useCallback, useEffect | Already installed. [VERIFIED: web/package.json] |

### No New Dependencies

This phase requires zero new npm packages. HTML5 Video API is built into browsers. Recharts is already installed. All custom controls are built with existing Tailwind CSS utilities.

---

## Architecture Patterns

### Recommended Component Structure
```
web/src/components/results/
├── VideoPlayer.tsx           # New: custom HTML5 video player with controls
├── NeuralTimeline.tsx        # Existing: add currentTime prop, onSeek callback, ReferenceLine
├── RegionValuesBar.tsx       # New: compact real-time region values display
├── SegmentTable.tsx          # Existing: unchanged
└── RegionBreakdown.tsx       # Existing: unchanged

web/src/app/(app)/results/[id]/page.tsx  # Parent: manages shared currentTime state
```

### Pattern 1: Parent State Management (Bidirectional Sync)

The parent page owns `currentTime` and passes it down to both components. This is the simplest React pattern for bidirectional sync. [ASSUMED - standard React lifting state up pattern]

```typescript
// results/[id]/page.tsx
const videoRef = useRef<HTMLVideoElement>(null);
const [currentTime, setCurrentTime] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);

// Video -> Timeline: onTimeUpdate fires ~4x/sec during playback
const handleTimeUpdate = useCallback(() => {
  if (videoRef.current) {
    setCurrentTime(videoRef.current.currentTime);
  }
}, []);

// Timeline -> Video: click on chart seeks the video
const handleSeek = useCallback((time: number) => {
  if (videoRef.current) {
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  }
}, []);
```

### Pattern 2: HTML5 Video Element with useRef

The HTML5 `<video>` element exposes a rich programmatic API via the DOM element reference. Key properties and methods: [CITED: MDN Web Docs]

```typescript
// Core ref pattern
const videoRef = useRef<HTMLVideoElement>(null);

// Playback control
videoRef.current.play();           // returns Promise<void>
videoRef.current.pause();
videoRef.current.currentTime = 30; // seek to 30 seconds
videoRef.current.playbackRate = 2; // 2x speed
videoRef.current.volume = 0.8;     // 0-1 range
videoRef.current.muted = true;

// Key events
// 'timeupdate' - fires ~4x/sec during playback (browser-dependent, typically 250ms intervals)
// 'loadedmetadata' - fires when duration/dimensions available
// 'play' / 'pause' - fires when playback state changes
// 'ended' - fires when video reaches end
// 'waiting' / 'canplay' - buffering states
```

### Pattern 3: Recharts onClick for Click-to-Seek

The `AreaChart` component accepts an `onClick` handler. The first argument is a `MouseHandlerDataParam` object containing `activeLabel` -- the x-axis data value at the click position. Since NeuralTimeline uses `type="number"` on XAxis with timestamp data, `activeLabel` will be the time in seconds. [VERIFIED: recharts types in node_modules/recharts/types/synchronisation/types.d.ts]

```typescript
// Type from recharts source:
type MouseHandlerDataParam = {
  activeTooltipIndex: number | TooltipIndex | undefined;
  isTooltipActive: boolean;
  activeIndex: number | TooltipIndex | undefined;
  activeLabel: string | number | undefined;  // <-- THIS is the x-axis value
  activeDataKey: DataKey<any> | undefined;
  activeCoordinate: Coordinate | undefined;   // pixel {x, y}
};

// Usage in NeuralTimeline:
<AreaChart
  data={data}
  syncId="neural-timeline"
  onClick={(state: MouseHandlerDataParam) => {
    if (state.activeLabel !== undefined && onSeek) {
      onSeek(Number(state.activeLabel));
    }
  }}
>
```

**Critical finding:** `activeLabel` snaps to the nearest data point, NOT arbitrary positions between points. This means clicking between segment timestamps will snap to the nearest segment's start time. For a video scrubber this is acceptable -- segments are typically 2-5 seconds apart, so snapping is precise enough. If finer resolution is needed, we would need to use `activeCoordinate.x` (pixel) and manually convert to data domain, but this adds complexity and is likely unnecessary.

### Pattern 4: Recharts ReferenceLine as Playhead

The `ReferenceLine` component renders a vertical (or horizontal) line at a specific data value. It automatically positions using the chart's scale -- no pixel math needed. [VERIFIED: recharts API docs]

```typescript
import { ReferenceLine } from 'recharts';

// Inside each AreaChart:
<ReferenceLine
  x={currentTime}                    // data-domain value (seconds)
  stroke="rgba(255, 255, 255, 0.8)"  // bright white playhead
  strokeWidth={2}
  strokeDasharray="none"
  ifOverflow="extendDomain"          // render even if outside current domain
  isFront={true}                     // render above the area fill
/>
```

**Key props:**
- `x` -- positions a vertical line at the data-domain x value. Uses number, not pixel. [VERIFIED: recharts ReferenceLine API docs]
- `ifOverflow="extendDomain"` -- prevents the line from being hidden when the value is at the domain boundary
- `isFront` -- not a real prop; use default z-index which renders after Area

### Pattern 5: Video-to-Timeline Sync (onTimeUpdate)

`onTimeUpdate` fires approximately 4 times per second during video playback. This is the correct event for syncing -- NOT `requestAnimationFrame`. Reasons:

1. **Recharts cannot handle 60fps re-renders.** Each state update triggers a full React reconciliation of 4 AreaChart components + their ReferenceLine children. At 60fps this would be 240 chart re-renders per second. [VERIFIED: Recharts performance docs recommend memoization and debouncing for frequent updates]

2. **`requestVideoFrameCallback` fires at video frame rate** (24-60fps depending on video) and provides precise frame metadata including `mediaTime`. However, it would overwhelm Recharts. [CITED: MDN HTMLVideoElement.requestVideoFrameCallback]

3. **`onTimeUpdate` at ~4Hz is sufficient** because segment data points are spaced 2-5 seconds apart. Moving a ReferenceLine 4 pixels per update looks smooth enough for a data overlay.

```typescript
// On the <video> element:
<video
  ref={videoRef}
  onTimeUpdate={handleTimeUpdate}
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
  onLoadedMetadata={() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }}
/>
```

**If smoother playhead movement is desired later:** Use `requestAnimationFrame` to update a SEPARATE playhead element (absolute-positioned div overlay) outside the Recharts render tree, while still using `onTimeUpdate` for the `currentTime` state that feeds region values. This decouples the visual playhead from chart re-renders.

### Pattern 6: Custom Video Controls Component

Build controls as an overlay on top of the video element. Key HTML5 Video API calls: [CITED: MDN HTMLVideoElement, MDN HTMLMediaElement]

```typescript
interface VideoPlayerProps {
  src: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (rate: number) => void;
}

// Play/Pause
const togglePlay = () => {
  if (videoRef.current?.paused) {
    videoRef.current.play();
  } else {
    videoRef.current?.pause();
  }
};

// Speed selector
const speeds = [0.5, 1, 1.5, 2];
const handleSpeed = (rate: number) => {
  if (videoRef.current) videoRef.current.playbackRate = rate;
};

// Progress bar (click to seek)
const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const bar = e.currentTarget;
  const rect = bar.getBoundingClientRect();
  const fraction = (e.clientX - rect.left) / rect.width;
  const newTime = fraction * duration;
  onSeek(newTime);
};

// Volume
const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (videoRef.current) videoRef.current.volume = parseFloat(e.target.value);
};
```

### Pattern 7: Real-Time Region Values at Playhead

Find the closest segment to `currentTime` using a simple linear scan (segments are few, typically 10-30). Display the 4 region values with matching colors.

```typescript
function getRegionsAtTime(segments: SegmentData[], time: number): SegmentRegionScores | null {
  if (segments.length === 0) return null;
  
  // Find the segment that contains `time`, or the closest one
  let closest = segments[0];
  let minDist = Infinity;
  
  for (const seg of segments) {
    // If time is within segment range
    if (time >= seg.start && time <= seg.end) return seg.regions;
    
    // Otherwise track closest by start time
    const dist = Math.min(Math.abs(seg.start - time), Math.abs(seg.end - time));
    if (dist < minDist) {
      minDist = dist;
      closest = seg;
    }
  }
  
  return closest.regions;
}
```

### Pattern 8: Keyboard Shortcuts

Standard video player keyboard shortcuts using a `useEffect` with `keydown` listener:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Only when video player area is focused or no input is focused
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handleSeek(Math.max(0, currentTime - 5));
        break;
      case 'ArrowRight':
        e.preventDefault();
        handleSeek(Math.min(duration, currentTime + 5));
        break;
      case 'j':
        handleSeek(Math.max(0, currentTime - 10));
        break;
      case 'l':
        handleSeek(Math.min(duration, currentTime + 10));
        break;
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [currentTime, duration, isPlaying]);
```

### Anti-Patterns to Avoid

- **Using `requestAnimationFrame` to update Recharts state:** Re-rendering 4 AreaCharts at 60fps will cause severe jank. Use `onTimeUpdate` (~4Hz) instead.
- **Using `setInterval` for time sync:** The browser's `timeupdate` event is specifically designed for this. Timers drift and waste cycles when video is paused.
- **Lifting the `videoRef` to parent as state:** The video ref should be owned by the parent page and passed down. Do NOT store `HTMLVideoElement` in React state -- refs don't trigger re-renders, which is exactly what you want for the video element.
- **Animating ReferenceLine with CSS transitions:** ReferenceLine is an SVG `<line>` element inside the Recharts SVG. CSS transitions on SVG attributes are unreliable across browsers and Recharts re-renders would fight them.
- **Using `react-player` or `video.js`:** D-01 explicitly prohibits third-party player libraries.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Click position to time value | Pixel-to-data coordinate math | Recharts `onClick` -> `activeLabel` | Recharts handles scale conversion internally [VERIFIED: type definitions] |
| Playhead line on chart | SVG overlay with manual positioning | `<ReferenceLine x={currentTime}>` | Auto-positions using chart's scale, handles resize [VERIFIED: Recharts API docs] |
| Cross-chart cursor sync | Manual mousemove state propagation | `syncId` prop (already in place from Phase 24) | Built-in Recharts feature |
| Video time tracking | `setInterval` or `requestAnimationFrame` polling | `onTimeUpdate` event on `<video>` | Browser-native, fires only during playback, ~4Hz is ideal for chart updates |
| Fullscreen API | Custom overlay logic | `videoRef.current.requestFullscreen()` | Browser native, handles escape key, orientation |

---

## Common Pitfalls

### Pitfall 1: Recharts Re-render Performance at High Frequency
**What goes wrong:** Updating `currentTime` state at 60fps (via rAF) causes 4 AreaCharts to re-render every frame, dropping the page to <10fps.
**Why it happens:** Each state change triggers React reconciliation of all Recharts SVG elements. With 4 charts containing CartesianGrid, Area paths, axes, and ReferenceLine, this is hundreds of SVG elements.
**How to avoid:** Use `onTimeUpdate` (~4Hz). The ReferenceLine position update at 4fps is visually adequate because it moves in discrete steps aligned with the chart's data resolution.
**Warning signs:** Browser DevTools shows "Long task" warnings; chart hover becomes sluggish.

### Pitfall 2: activeLabel Snaps to Nearest Data Point
**What goes wrong:** Clicking between two segment timestamps snaps the playhead to the nearest segment start, not the exact click position.
**Why it happens:** Recharts' `activeLabel` returns the x-value of the nearest data point, not an interpolated position.
**How to avoid:** This is acceptable for the NeuroCut use case (segments are 2-5s apart). If pixel-perfect seeking is needed, use the video player's own progress bar for fine control and the timeline for coarse segment-level seeking.
**Warning signs:** User expects frame-accurate scrubbing from the timeline (they should use the progress bar instead).

### Pitfall 3: Video `play()` Promise Rejection
**What goes wrong:** Calling `videoRef.current.play()` throws an unhandled promise rejection.
**Why it happens:** `play()` returns a Promise that rejects if the browser blocks autoplay (no user gesture), or if `pause()` is called before `play()` resolves.
**How to avoid:** Always `await` or `.catch()` the play promise:
```typescript
videoRef.current.play().catch(() => { /* browser blocked autoplay */ });
```
**Warning signs:** Console error: "The play() request was interrupted by a call to pause()."

### Pitfall 4: ReferenceLine Not Visible When x=0
**What goes wrong:** At video start (currentTime=0), the ReferenceLine may not render because it sits at the domain boundary.
**Why it happens:** Default `ifOverflow="discard"` hides lines at domain edges.
**How to avoid:** Set `ifOverflow="extendDomain"` on the ReferenceLine.

### Pitfall 5: Stale Closures in Event Handlers
**What goes wrong:** Keyboard shortcuts or timeupdate handlers use stale `currentTime` values.
**Why it happens:** `useEffect` captures the closure at mount time; if dependencies are wrong, the handler uses old values.
**How to avoid:** Use `useCallback` with correct dependency arrays. For keyboard handlers, use `videoRef.current.currentTime` directly (always current) instead of the React state value.

### Pitfall 6: Video Controls Hidden Behind Dark Surface
**What goes wrong:** Custom controls on a dark video with dark glassmorphism surface are invisible.
**Why it happens:** Low contrast between control elements and video content.
**How to avoid:** Add a gradient overlay at the bottom of the video (from transparent to `rgba(0,0,0,0.6)`) behind the controls. Use bright white icons with drop shadows.

---

## Code Examples

### Complete VideoPlayer Component Structure

```typescript
'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { formatTimestamp } from '@/lib/results';

interface VideoPlayerProps {
  src: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: () => void;
  onPlayStateChange: (playing: boolean) => void;
  onSeek: (time: number) => void;
}

const SPEEDS = [0.5, 1, 1.5, 2] as const;

export function VideoPlayer({
  src,
  videoRef,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onPlayStateChange,
  onSeek,
}: VideoPlayerProps) {
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [videoRef]);

  const handleSpeedChange = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setSpeed(rate);
    }
  }, [videoRef]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(fraction * duration);
  }, [duration, onSeek]);

  return (
    <div
      className="bg-surface-container rounded-xl overflow-hidden relative group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isPlaying || setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-[400px] object-contain bg-black"
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onPlay={() => onPlayStateChange(true)}
        onPause={() => onPlayStateChange(false)}
      />

      {/* Controls overlay with gradient backdrop */}
      <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Gradient background */}
        <div className="bg-gradient-to-t from-black/70 to-transparent pt-12 pb-4 px-4">
          {/* Progress bar */}
          <div
            className="h-1 bg-white/20 rounded-full cursor-pointer mb-3 group/progress"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary rounded-full relative"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                <span className="material-symbols-outlined">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <span className="font-mono text-xs text-white/70">
                {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Speed selector as pill buttons */}
              <div className="flex items-center gap-1">
                {SPEEDS.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      speed === s
                        ? 'bg-primary text-on-primary'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### NeuralTimeline Extension (Adding Playhead + Click-to-Seek)

```typescript
// New props added to NeuralTimeline:
interface NeuralTimelineProps {
  segments: SegmentData[];
  duration: number;
  currentTime?: number;  // NEW: playhead position
  onSeek?: (time: number) => void;  // NEW: click-to-seek callback
}

// Inside each AreaChart (SingleTrack component), add:
import { ReferenceLine } from 'recharts';

// Add onClick to AreaChart:
<AreaChart
  data={data}
  syncId="neural-timeline"
  syncMethod="value"
  onClick={(state) => {
    if (state?.activeLabel !== undefined && onSeek) {
      onSeek(Number(state.activeLabel));
    }
  }}
  style={{ cursor: onSeek ? 'pointer' : undefined }}
>
  {/* ... existing defs, CartesianGrid, XAxis, YAxis, Tooltip, Area ... */}
  
  {/* NEW: Playhead line */}
  {currentTime !== undefined && (
    <ReferenceLine
      x={currentTime}
      stroke="rgba(255, 255, 255, 0.8)"
      strokeWidth={2}
      ifOverflow="extendDomain"
    />
  )}
</AreaChart>
```

### Region Values Bar Component

```typescript
// RegionValuesBar.tsx - compact horizontal display
interface RegionValuesBarProps {
  segments: SegmentData[];
  currentTime: number;
}

const REGION_DISPLAY = [
  { key: 'attention' as const, label: 'ATT', color: '#60a5fa' },
  { key: 'reward' as const, label: 'RWD', color: '#a78bfa' },
  { key: 'emotional_processing' as const, label: 'EMO', color: '#f472b6' },
  { key: 'social_cognition' as const, label: 'SOC', color: '#fbbf24' },
];

export function RegionValuesBar({ segments, currentTime }: RegionValuesBarProps) {
  const regions = getRegionsAtTime(segments, currentTime);
  if (!regions) return null;

  return (
    <div className="flex items-center gap-4 px-6 py-2 bg-surface-container-lowest/50 rounded-lg">
      <span className="font-mono text-[10px] text-on-surface-variant">
        {formatTimestamp(currentTime)}
      </span>
      {REGION_DISPLAY.map(r => (
        <div key={r.key} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />
          <span className="text-[10px] font-headline uppercase tracking-wider text-on-surface-variant">
            {r.label}
          </span>
          <span
            className="text-xs font-bold font-mono tabular-nums"
            style={{ color: r.color }}
          >
            {Math.round(regions[r.key] * 100)}
          </span>
        </div>
      ))}
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `requestAnimationFrame` + manual SVG overlay | `onTimeUpdate` + `<ReferenceLine>` | Recharts 2.x+ (2022+) | No pixel math needed; ReferenceLine handles scale conversion |
| `activeIndex` prop on charts | `Tooltip` `defaultIndex` + `trigger` | Recharts 3.0 (2024) | `activeIndex` removed; use Tooltip control instead |
| `requestAnimationFrame` for video time polling | `requestVideoFrameCallback` | Baseline 2024 (Oct) | Frame-accurate callbacks at video frame rate, but too fast for chart updates |
| Video.js / react-player for custom controls | Native HTML5 `<video>` + useRef | Ongoing trend | Native API is complete enough; libraries add unnecessary weight for simple players |

---

## Environment Availability

Step 2.6: SKIPPED -- Phase is purely code changes. No external tools, CLIs, or services required. HTML5 Video API is available in all modern browsers. Recharts is already installed.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No test framework configured in web/ |
| Config file | none |
| Quick run command | `cd web && npm run build` |
| Full suite command | `cd web && npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-04 | Shared currentTime state syncs video + timeline | manual | Visual inspection | N/A |
| D-05 | Video playback updates timeline playhead | manual | Visual inspection | N/A |
| D-06 | Timeline click seeks video | manual | Visual inspection | N/A |
| D-08 | Region values update at playhead position | manual | Visual inspection | N/A |

### Sampling Rate
- **Per task commit:** `cd web && npm run build` (TypeScript compilation check)
- **Per wave merge:** `cd web && npm run build`
- **Phase gate:** Build passing + visual inspection of sync behavior

### Wave 0 Gaps
None -- existing build infrastructure is sufficient. No automated tests needed for this interactive UI phase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `onTimeUpdate` fires ~4x/sec in modern browsers (Chrome, Firefox, Safari) | Pattern 5 | LOW -- if higher/lower frequency, the visual effect changes slightly but still works. Can throttle with `requestAnimationFrame` if needed. |
| A2 | Recharts `ReferenceLine` re-renders efficiently when only the `x` prop changes and data stays the same | Pattern 4 | MEDIUM -- if it causes full chart re-render, may need to extract playhead to a separate SVG overlay. Mitigated by ~4Hz update rate. |
| A3 | `activeLabel` returns the numeric timestamp (not string) when XAxis `type="number"` is set | Pattern 3 | LOW -- type definition shows `string | number | undefined`, and `Number()` conversion handles both. |
| A4 | `ifOverflow="extendDomain"` makes ReferenceLine visible at x=0 | Pitfall 4 | LOW -- easy to test; fallback is to set domain to `[-0.1, duration]`. |

---

## Open Questions

1. **Draggable scrubber handle on timeline (D-13)**
   - What we know: Click-to-seek (D-12) is confirmed as primary interaction. Drag-to-scrub adds continuous seeking by tracking `onMouseMove` after `onMouseDown`.
   - What's unclear: Recharts' `onMouseMove` provides `activeLabel` during drag, but combined with video seeking at ~30 events/sec may cause jank.
   - Recommendation: Implement click-to-seek first. Draggable scrubber can be added as a follow-up by tracking mousedown/mousemove/mouseup and throttling seek calls to every 100ms during drag.

2. **Smooth playhead animation between onTimeUpdate fires**
   - What we know: `onTimeUpdate` fires ~4x/sec. Between fires, the playhead sits still for ~250ms.
   - What's unclear: Whether the 250ms jumps look choppy or acceptable.
   - Recommendation: Start with raw `onTimeUpdate`. If jumpy, add a CSS `transition: x 0.25s linear` on the ReferenceLine's SVG `<line>` element as a polish pass. If Recharts fights transitions (likely -- it re-renders the entire SVG), fall back to an absolute-positioned div overlay that uses `requestAnimationFrame` for smooth movement, separate from Recharts.

3. **Video URL format and CORS**
   - What we know: `results.video_url` is already used in the current `<video>` element on the page. It works.
   - What's unclear: Whether the URL supports range requests (needed for seeking to arbitrary positions without downloading the full file).
   - Recommendation: Test with actual video URLs. If seeking fails on large videos, may need to add `preload="auto"` or accept that seeking works only in buffered ranges.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A (page already behind auth) |
| V3 Session Management | no | N/A |
| V4 Access Control | no | Page already checks job ownership |
| V5 Input Validation | yes | Validate `currentTime` is within [0, duration] before seeking |
| V6 Cryptography | no | N/A |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Video URL injection via results data | Tampering | video_url comes from server API, not user input on this page |
| XSS via video source | Information Disclosure | `<video src={...}>` does not execute scripts; browser sandboxes media |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: node_modules/recharts/types/synchronisation/types.d.ts] -- `MouseHandlerDataParam` type with `activeLabel`, `activeCoordinate`
- [VERIFIED: node_modules/recharts/types/chart/types.d.ts] -- `CategoricalChartFunc` onClick handler signature
- [CITED: recharts.github.io/en-US/api/ReferenceLine/] -- x, stroke, ifOverflow, isFront props
- [CITED: recharts.github.io/en-US/guide/performance/] -- component isolation, memoization, debouncing strategies
- [CITED: recharts.github.io/en-US/guide/activeIndex/] -- activeIndex removal in v3, Tooltip defaultIndex replacement
- [CITED: developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback] -- API, browser support, frame metadata

### Secondary (MEDIUM confidence)
- [CITED: developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame] -- rAF timing and display sync
- [CITED: github.com/recharts/recharts/issues/163] -- getting data from Area chart clicks (historical discussion)
- [CITED: github.com/recharts/recharts/issues/691] -- Area/Line onClick support evolution

### Tertiary (LOW confidence)
- [WebSearch: "react custom video player html5 video api useRef"] -- confirmed pattern of useRef + native controls is standard
- [WebSearch: "recharts ReferenceLine frequent re-render performance"] -- confirms Recharts recommends memoization for frequent updates

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, HTML5 Video API and Recharts both verified against actual type definitions
- Architecture (bidirectional sync): HIGH -- `activeLabel` from onClick + `ReferenceLine x` prop verified in Recharts types
- Performance (update frequency): HIGH -- Recharts performance docs explicitly recommend debouncing; onTimeUpdate ~4Hz is a safe rate
- Pitfalls: HIGH -- based on verified Recharts API constraints and well-known HTML5 Video gotchas

**Research date:** 2026-04-09
**Valid until:** 2026-07-09 (HTML5 Video API is stable; Recharts 3.x API is stable)
