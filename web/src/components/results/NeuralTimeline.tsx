'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { type SegmentData, type SegmentRegionScores } from '@/components/results/SegmentTable';
import { formatTimestamp } from '@/lib/results';

const TRACK_CONFIG = [
  { key: 'attention' as const, label: 'Attention', color: '#60a5fa', gradientId: 'gradient-attention' },
  { key: 'reward' as const, label: 'Reward', color: '#a78bfa', gradientId: 'gradient-reward' },
  { key: 'emotional_processing' as const, label: 'Emotional Processing', color: '#f472b6', gradientId: 'gradient-emotional' },
  { key: 'social_cognition' as const, label: 'Social Cognition', color: '#fbbf24', gradientId: 'gradient-social' },
] satisfies { key: keyof SegmentRegionScores; label: string; color: string; gradientId: string }[];

interface TimelinePoint {
  t: number;
  value: number;
}

function toTimelineData(segments: SegmentData[], key: keyof SegmentRegionScores): TimelinePoint[] {
  return segments.map(seg => ({ t: seg.start, value: seg.regions[key] }));
}

function buildLookup(allTracks: { label: string; color: string; data: TimelinePoint[] }[]) {
  const lookup = new Map<number, { label: string; color: string; value: number }[]>();
  allTracks.forEach(({ label, color, data }) => {
    data.forEach(pt => {
      if (!lookup.has(pt.t)) lookup.set(pt.t, []);
      lookup.get(pt.t)!.push({ label, color, value: pt.value });
    });
  });
  return lookup;
}

function CustomTooltipContent({
  active,
  label,
  lookup,
}: {
  active?: boolean;
  label?: string | number;
  lookup: Map<number, { label: string; color: string; value: number }[]>;
}) {
  if (!active || label === undefined) return null;
  const numLabel = typeof label === 'string' ? parseFloat(label) : label;
  const entries = lookup.get(numLabel) ?? [];
  return (
    <div className="bg-surface-bright/90 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="font-mono text-[10px] text-on-surface-variant mb-2">
        {formatTimestamp(numLabel)}
      </p>
      {entries.map(e => (
        <div key={e.label} className="flex items-center gap-2 text-xs font-headline">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
          <span className="text-on-surface-variant">{e.label}</span>
          <span className="ml-auto font-bold" style={{ color: e.color }}>
            {Math.round(e.value * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

interface SingleTrackProps {
  data: TimelinePoint[];
  config: (typeof TRACK_CONFIG)[number];
  duration: number;
  isLast: boolean;
  showTooltip: boolean;
  lookup: Map<number, { label: string; color: string; value: number }[]>;
  currentTime?: number;
  onSeek?: (time: number) => void;
}

function SingleTrack({ data, config, duration, isLast, showTooltip, lookup, currentTime, onSeek }: SingleTrackProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 shrink-0 text-right">
        <span
          className="font-headline text-[9px] uppercase tracking-widest"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      </div>

      <div className="flex-1" style={{ height: 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            syncId="neural-timeline"
            syncMethod="value"
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            onClick={(state) => {
              if (state?.activeLabel !== undefined && onSeek) {
                onSeek(Number(state.activeLabel));
              }
            }}
            style={{ cursor: onSeek ? 'pointer' : undefined }}
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
              tickFormatter={(v: number) => Math.round(v * 100).toString()}
              tickCount={3}
              axisLine={false}
              tickLine={false}
            />
            {showTooltip ? (
              <Tooltip
                content={<CustomTooltipContent lookup={lookup} />}
                cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
              />
            ) : (
              <Tooltip
                content={() => null}
                cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
              />
            )}
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
            {currentTime !== undefined && (
              <ReferenceLine
                x={currentTime}
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth={2}
                ifOverflow="extendDomain"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface NeuralTimelineProps {
  segments: SegmentData[];
  duration: number;
  currentTime?: number;
  onSeek?: (time: number) => void;
}

export function NeuralTimeline({ segments, duration, currentTime, onSeek }: NeuralTimelineProps) {
  const trackData = TRACK_CONFIG.map(config => ({
    ...config,
    data: toTimelineData(segments, config.key),
  }));

  const lookup = buildLookup(
    trackData.map(t => ({ label: t.label, color: t.color, data: t.data }))
  );

  return (
    <div className="bg-surface-container rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-on-surface-variant">psychology</span>
        <h3 className="font-headline text-lg font-bold">Neural Activation Timeline</h3>
      </div>

      <div className="space-y-1">
        {trackData.map((track, index) => (
          <SingleTrack
            key={track.key}
            data={track.data}
            config={track}
            duration={duration}
            isLast={index === TRACK_CONFIG.length - 1}
            showTooltip={index === 0}
            lookup={lookup}
            currentTime={currentTime}
            onSeek={onSeek}
          />
        ))}
      </div>
    </div>
  );
}
