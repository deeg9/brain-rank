'use client';

import React, { useRef, useCallback, useState } from 'react';
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
import type { PeakMarker } from '@/lib/peak-detection';
import { MetricInfo } from '@/components/results/MetricInfo';

const TRACK_INFO: Record<string, { description: string; calculation: string; interpretation: string }> = {
  attention: {
    description: "How strongly the viewer's attentional networks activate — measuring focused concentration on your content.",
    calculation: "Predicted from dorsal and ventral attention network activity (frontal eye fields, intraparietal sulcus) via TRIBE v2.",
    interpretation: "High attention (>70%) = content commands focus. Drops indicate moments where viewers may lose interest or get distracted.",
  },
  reward: {
    description: "Activation of the brain's reward circuitry — measuring how pleasurable or satisfying the content feels.",
    calculation: "Predicted from ventral striatum and orbitofrontal cortex activation patterns via TRIBE v2.",
    interpretation: "High reward (>70%) = content triggers dopamine-associated pleasure responses. Key driver of likes, shares, and repeat views.",
  },
  emotional_processing: {
    description: "Activity in emotional processing regions — measuring the intensity of emotional response to content.",
    calculation: "Predicted from amygdala and insula cortex activation patterns via TRIBE v2.",
    interpretation: "High emotional processing (>70%) = strong emotional reaction (positive or negative). Emotional peaks drive memorability.",
  },
  social_cognition: {
    description: "Engagement of social brain networks — measuring how much the viewer processes social and interpersonal cues.",
    calculation: "Predicted from temporoparietal junction and medial prefrontal cortex activation via TRIBE v2.",
    interpretation: "High social cognition (>70%) = content with faces, dialogue, or social interactions. Drives connection and empathy.",
  },
  visual_processing: {
    description: "Activity in visual cortex areas — measuring how visually stimulating and complex the content is.",
    calculation: "Predicted from V1-V5 visual cortex activation patterns via TRIBE v2's V-JEPA2 encoder.",
    interpretation: "High visual processing (>70%) = visually rich content (fast cuts, bright colors, motion). Low = static or simple visuals.",
  },
  auditory_processing: {
    description: "Engagement of auditory cortex — measuring how the brain processes sounds, music, and speech in your content.",
    calculation: "Predicted from primary and secondary auditory cortex activation via TRIBE v2's Wav2Vec-BERT encoder.",
    interpretation: "High auditory (>70%) = strong audio presence (music drops, speech emphasis, sound effects). Important for ASMR and music content.",
  },
  language_narrative: {
    description: "Activity in language comprehension networks — measuring how the brain processes narrative and verbal content.",
    calculation: "Predicted from Broca's and Wernicke's area activation via TRIBE v2's LLaMA 3.2 text encoder.",
    interpretation: "High language (>70%) = content with strong narrative, storytelling, or verbal explanation. Key for educational and commentary content.",
  },
  default_mode: {
    description: "Default mode network activity — measures mind-wandering, self-reflection, and internal thought during viewing.",
    calculation: "Predicted from medial prefrontal cortex and posterior cingulate cortex activation via TRIBE v2.",
    interpretation: "High default mode (>60%) = viewer's mind is wandering (content not engaging enough). Low = fully absorbed in content.",
  },
  motion_processing: {
    description: "Activity in motion-sensitive visual areas — measuring how the brain tracks movement in your content.",
    calculation: "Predicted from MT/V5 motion processing cortex activation via TRIBE v2's V-JEPA2 encoder.",
    interpretation: "High motion (>70%) = content with significant movement (action, sports, transitions). Low = static shots or talking heads.",
  },
};

const TRACK_CONFIG = [
  { key: 'attention' as const, label: 'Attention', color: '#60a5fa', gradientId: 'gradient-attention' },
  { key: 'reward' as const, label: 'Reward', color: '#a78bfa', gradientId: 'gradient-reward' },
  { key: 'emotional_processing' as const, label: 'Emotional Processing', color: '#f472b6', gradientId: 'gradient-emotional' },
  { key: 'social_cognition' as const, label: 'Social Cognition', color: '#fbbf24', gradientId: 'gradient-social' },
  { key: 'visual_processing' as const, label: 'Visual Processing', color: '#4ade80', gradientId: 'gradient-visual' },
  { key: 'auditory_processing' as const, label: 'Auditory Processing', color: '#fb923c', gradientId: 'gradient-auditory' },
  { key: 'language_narrative' as const, label: 'Language / Narrative', color: '#22d3ee', gradientId: 'gradient-language' },
  { key: 'default_mode' as const, label: 'Default Mode', color: '#fb7185', gradientId: 'gradient-default-mode' },
  { key: 'motion_processing' as const, label: 'Motion Processing', color: '#a3e635', gradientId: 'gradient-motion' },
] satisfies { key: keyof SegmentRegionScores; label: string; color: string; gradientId: string }[];

interface TimelinePoint {
  t: number;
  value: number;
}

function toTimelineData(segments: SegmentData[], key: keyof SegmentRegionScores): TimelinePoint[] {
  return segments.map(seg => ({ t: seg.start, value: seg.regions[key] ?? 0 }));
}

function buildLookup(allTracks: { label: string; color: string; data: TimelinePoint[] }[]) {
  const lookup = new Map<number, { label: string; color: string; value: number }[]>();
  allTracks.forEach(({ label, color, data }) => {
    data.forEach(pt => {
      if (!lookup.has(pt.t)) lookup.set(pt.t, []);
      // Skip networks with no data (NaN/undefined/zero)
      const val = pt.value ?? 0;
      if (!isNaN(val) && val > 0) {
        lookup.get(pt.t)!.push({ label, color, value: val });
      }
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
    <div className="bg-surface-bright/90 backdrop-blur-sm border border-outline-variant/30 rounded-lg p-3 shadow-xl">
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
  syncId?: string;
}

function SingleTrack({ data, config, duration, isLast, showTooltip, lookup, currentTime, onSeek, syncId }: SingleTrackProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 shrink-0 text-right flex items-center justify-end gap-1">
        <span className="font-headline text-[9px] uppercase tracking-widest text-on-surface font-bold">
          {config.label}
        </span>
        <MetricInfo
          title={config.label}
          description={TRACK_INFO[config.key]?.description ?? "Brain network activation track."}
          calculation={TRACK_INFO[config.key]?.calculation ?? "Predicted by TRIBE v2 from brain activation patterns."}
          interpretation={TRACK_INFO[config.key]?.interpretation ?? "Higher values indicate stronger neural response."}
        />
      </div>

      <div className="flex-1" style={{ height: isLast ? 100 : 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            syncId={syncId ?? "neural-timeline"}
            syncMethod="value"
            tabIndex={-1}
            margin={{ top: 4, right: 8, bottom: isLast ? 24 : 4, left: 0 }}
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
              tick={{ fill: '#000', fontSize: 10, fontFamily: 'monospace', fontWeight: 700 }}
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
                cursor={false}
              />
            ) : (
              <Tooltip
                content={() => null}
                cursor={false}
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
                stroke="rgba(0, 0, 0, 0.6)"
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

export interface ZoneMarker {
  startTime: number;
  endTime: number;
  type: 'flow' | 'dropoff' | 'neutral';
}

export interface IconMarker {
  time: number;
  type: 'share' | 'warning';
}

interface NeuralTimelineProps {
  segments: SegmentData[];
  duration: number;
  currentTime?: number;
  onSeek?: (time: number) => void;
  zones?: ZoneMarker[];
  iconMarkers?: IconMarker[];
  peakMarkers?: PeakMarker[];
  syncId?: string;
}

const DEFAULT_VISIBLE_COUNT = 3;

export function NeuralTimeline({ segments, duration, currentTime, onSeek, zones, iconMarkers, peakMarkers, syncId }: NeuralTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [expanded, setExpanded] = useState(false);

  const getTimeFromMouseEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
    const container = containerRef.current;
    if (!container || !onSeek) return;
    // Find the actual Recharts plot area by looking for the first .recharts-cartesian-grid rect
    // or fall back to the first SVG's clipPath rect — this is the actual drawable chart region
    const plotArea = container.querySelector('.recharts-cartesian-grid') as SVGElement | null;
    if (plotArea) {
      const plotRect = plotArea.getBoundingClientRect();
      const x = e.clientX - plotRect.left;
      const ratio = Math.max(0, Math.min(1, x / plotRect.width));
      return ratio * duration;
    }
    // Fallback: use container with estimated offsets
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    return ratio * duration;
  }, [duration, onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onSeek) return;
    isDragging.current = true;
    const time = getTimeFromMouseEvent(e);
    if (time !== undefined) onSeek(time);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const time = getTimeFromMouseEvent(e);
      if (time !== undefined) onSeek(time);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [onSeek, getTimeFromMouseEvent]);

  const trackData = TRACK_CONFIG.map(config => ({
    ...config,
    data: toTimelineData(segments, config.key),
  }));

  const lookup = buildLookup(
    trackData.map(t => ({ label: t.label, color: t.color, data: t.data }))
  );

  return (
    <div className="rounded-xl p-6 glass-surface">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-on-surface-variant">psychology</span>
        <h3 className="font-headline text-lg font-bold">Neural Activation Timeline</h3>
        <MetricInfo
          title="Neural Activation Timeline"
          description="Real-time brain activation across neural networks as your video plays. Each track shows how strongly a specific brain region responds to the content over time."
          calculation="TRIBE v2 (Meta) processes video, audio, and text features through V-JEPA2, Wav2Vec-BERT, and LLaMA 3.2 encoders, then predicts activation levels for 9 brain networks every 2 seconds."
          interpretation="Higher peaks = stronger neural response. Compare tracks to see which brain systems your content engages most. Attention and Reward tracks are key for viewer retention."
        />
      </div>

      {/* Icon Markers Row */}
      {iconMarkers && iconMarkers.length > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <div className="w-20 shrink-0" />
          <div className="flex-1 relative h-5">
            {iconMarkers.map((marker, i) => {
              const leftPct = (marker.time / duration) * 100;
              const iconName = marker.type === 'share' ? 'share' : 'warning';
              const colorCls = marker.type === 'share' ? 'text-tertiary-fixed' : 'text-error';
              return (
                <span
                  key={`${marker.type}-${i}`}
                  className={`material-symbols-outlined absolute ${colorCls}`}
                  style={{
                    left: `${leftPct}%`,
                    transform: 'translateX(-50%)',
                    fontSize: '14px',
                    top: 0,
                  }}
                >
                  {iconName}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="space-y-1 relative select-none outline-none"
        style={{ cursor: onSeek ? 'crosshair' : undefined }}
        onMouseDown={handleMouseDown}
      >
        {(expanded ? trackData : trackData.slice(0, DEFAULT_VISIBLE_COUNT)).map((track, index, arr) => (
          <SingleTrack
            key={track.key}
            data={track.data}
            config={track}
            duration={duration}
            isLast={index === arr.length - 1}
            showTooltip={index === 0}
            lookup={lookup}
            currentTime={currentTime}
            onSeek={onSeek}
            syncId={syncId}
          />
        ))}
      </div>

      {TRACK_CONFIG.length > DEFAULT_VISIBLE_COUNT && (
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="w-full mt-3 py-2 text-xs font-headline uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center gap-1.5"
        >
          <span>{expanded ? 'Show less' : `Show ${TRACK_CONFIG.length - DEFAULT_VISIBLE_COUNT} more`}</span>
          <span className="material-symbols-outlined text-sm" style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
            expand_more
          </span>
        </button>
      )}

    </div>
  );
}
