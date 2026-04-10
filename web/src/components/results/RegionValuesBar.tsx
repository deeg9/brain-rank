'use client';

import { type SegmentData, type SegmentRegionScores } from '@/components/results/SegmentTable';
import { formatTimestamp } from '@/lib/results';

const REGION_DISPLAY = [
  { key: 'attention' as const, label: 'ATT', color: '#60a5fa' },
  { key: 'reward' as const, label: 'RWD', color: '#a78bfa' },
  { key: 'emotional_processing' as const, label: 'EMO', color: '#f472b6' },
  { key: 'social_cognition' as const, label: 'SOC', color: '#fbbf24' },
] satisfies { key: keyof SegmentRegionScores; label: string; color: string }[];

function getRegionsAtTime(segments: SegmentData[], time: number): SegmentRegionScores | null {
  if (segments.length === 0) return null;

  let closest = segments[0];
  let minDist = Infinity;

  for (const seg of segments) {
    if (time >= seg.start && time <= seg.end) return seg.regions;

    const dist = Math.min(Math.abs(seg.start - time), Math.abs(seg.end - time));
    if (dist < minDist) {
      minDist = dist;
      closest = seg;
    }
  }

  return closest.regions;
}

interface RegionValuesBarProps {
  segments: SegmentData[];
  currentTime: number;
}

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
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.color }} />
          <span className="text-[9px] font-headline uppercase tracking-wider text-on-surface-variant">
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
