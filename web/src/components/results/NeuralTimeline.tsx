'use client';

import React, { useRef, useCallback, useState } from 'react';
import { type SegmentData, type SegmentRegionScores } from '@/components/results/SegmentTable';
import { formatTimestamp } from '@/lib/results';
import type { PeakMarker } from '@/lib/peak-detection';
import { MetricInfo } from '@/components/results/MetricInfo';
import { AreaChart, Area, Grid, ChartTooltip, type TooltipRow } from '@/components/charts/AreaChart';

const TRACK_INFO: Record<string, { description: string; calculation: string; interpretation: string }> = {
  attention: {
    description: "How strongly the viewer's attentional networks activate — measuring focused concentration on your content.",
    calculation: "Predicted from dorsal and ventral attention network activity (frontal eye fields, intraparietal sulcus) via BrainRank.",
    interpretation: "High attention (>70%) = content commands focus. Drops indicate moments where viewers may lose interest or get distracted.",
  },
  reward: {
    description: "Activation of the brain's reward circuitry — measuring how pleasurable or satisfying the content feels.",
    calculation: "Predicted from ventral striatum and orbitofrontal cortex activation patterns via BrainRank.",
    interpretation: "High reward (>70%) = content triggers dopamine-associated pleasure responses. Key driver of likes, shares, and repeat views.",
  },
  emotional_processing: {
    description: "Activity in emotional processing regions — measuring the intensity of emotional response to content.",
    calculation: "Predicted from amygdala and insula cortex activation patterns via BrainRank.",
    interpretation: "High emotional processing (>70%) = strong emotional reaction (positive or negative). Emotional peaks drive memorability.",
  },
  social_cognition: {
    description: "Engagement of social brain networks — measuring how much the viewer processes social and interpersonal cues.",
    calculation: "Predicted from temporoparietal junction and medial prefrontal cortex activation via BrainRank.",
    interpretation: "High social cognition (>70%) = content with faces, dialogue, or social interactions. Drives connection and empathy.",
  },
  visual_processing: {
    description: "Activity in visual cortex areas — measuring how visually stimulating and complex the content is.",
    calculation: "Predicted from V1-V5 visual cortex activation patterns via BrainRank's V-JEPA2 encoder.",
    interpretation: "High visual processing (>70%) = visually rich content (fast cuts, bright colors, motion). Low = static or simple visuals.",
  },
  auditory_processing: {
    description: "Engagement of auditory cortex — measuring how the brain processes sounds, music, and speech in your content.",
    calculation: "Predicted from primary and secondary auditory cortex activation via BrainRank's Wav2Vec-BERT encoder.",
    interpretation: "High auditory (>70%) = strong audio presence (music drops, speech emphasis, sound effects). Important for ASMR and music content.",
  },
  language_narrative: {
    description: "Activity in language comprehension networks — measuring how the brain processes narrative and verbal content.",
    calculation: "Predicted from Broca's and Wernicke's area activation via BrainRank's LLaMA 3.2 text encoder.",
    interpretation: "High language (>70%) = content with strong narrative, storytelling, or verbal explanation. Key for educational and commentary content.",
  },
  default_mode: {
    description: "Default mode network activity — measures mind-wandering, self-reflection, and internal thought during viewing.",
    calculation: "Predicted from medial prefrontal cortex and posterior cingulate cortex activation via BrainRank.",
    interpretation: "High default mode (>60%) = viewer's mind is wandering (content not engaging enough). Low = fully absorbed in content.",
  },
  motion_processing: {
    description: "Activity in motion-sensitive visual areas — measuring how the brain tracks movement in your content.",
    calculation: "Predicted from MT/V5 motion processing cortex activation via BrainRank's V-JEPA2 encoder.",
    interpretation: "High motion (>70%) = content with significant movement (action, sports, transitions). Low = static shots or talking heads.",
  },
};

const TRACK_CONFIG = [
  { key: 'attention' as const, label: 'Attention', color: '#60a5fa' },
  { key: 'reward' as const, label: 'Reward', color: '#a78bfa' },
  { key: 'emotional_processing' as const, label: 'Emotional Processing', color: '#f472b6' },
  { key: 'social_cognition' as const, label: 'Social Cognition', color: '#fbbf24' },
  { key: 'visual_processing' as const, label: 'Visual Processing', color: '#4ade80' },
  { key: 'auditory_processing' as const, label: 'Auditory Processing', color: '#fb923c' },
  { key: 'language_narrative' as const, label: 'Language / Narrative', color: '#22d3ee' },
  { key: 'default_mode' as const, label: 'Default Mode', color: '#fb7185' },
  { key: 'motion_processing' as const, label: 'Motion Processing', color: '#a3e635' },
] satisfies { key: keyof SegmentRegionScores; label: string; color: string }[];

// Convert seconds to Date for visx's time-based x-axis
const EPOCH_BASE = new Date(2000, 0, 1).getTime();
function secondsToDate(s: number): Date {
  return new Date(EPOCH_BASE + s * 1000);
}
function dateToSeconds(d: Date): number {
  return (d.getTime() - EPOCH_BASE) / 1000;
}

interface ChartPoint {
  date: Date;
  value: number;
  t: number; // original seconds for tooltip
}

function toChartData(segments: SegmentData[], key: keyof SegmentRegionScores): ChartPoint[] {
  return segments.map(seg => ({
    date: secondsToDate(seg.start),
    value: seg.regions[key] ?? 0,
    t: seg.start,
  }));
}

function buildLookup(allTracks: { label: string; color: string; data: ChartPoint[] }[]) {
  const lookup = new Map<number, { label: string; color: string; value: number }[]>();
  allTracks.forEach(({ label, color, data }) => {
    data.forEach(pt => {
      if (!lookup.has(pt.t)) lookup.set(pt.t, []);
      const val = pt.value ?? 0;
      if (!isNaN(val) && val > 0) {
        lookup.get(pt.t)!.push({ label, color, value: val });
      }
    });
  });
  return lookup;
}

interface SingleTrackProps {
  data: ChartPoint[];
  config: (typeof TRACK_CONFIG)[number];
  duration: number;
  showTooltip: boolean;
  lookup: Map<number, { label: string; color: string; value: number }[]>;
  currentTime?: number;
  onSeek?: (time: number) => void;
}

function SingleTrack({ data, config, duration, showTooltip, lookup, currentTime, onSeek }: SingleTrackProps) {
  const tooltipRows = useCallback(
    (point: Record<string, unknown>): TooltipRow[] => {
      const t = point.t as number;
      const entries = lookup.get(t) ?? [];
      return entries.map(e => ({
        color: e.color,
        label: e.label,
        value: `${Math.round(e.value * 100)}%`,
      }));
    },
    [lookup]
  );

  const tooltipTitle = useCallback(
    (props: { point: Record<string, unknown>; index: number }) => {
      const t = props.point.t as number;
      return (
        <div className="px-3 py-2.5">
          <div className="mb-2 font-mono text-[10px] text-on-surface-variant">
            {formatTimestamp(t)}
          </div>
          {(lookup.get(t) ?? []).map(e => (
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
    },
    [lookup]
  );

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 md:w-24 shrink-0 text-right flex items-center justify-end gap-1">
        <span className="font-headline text-[9px] uppercase tracking-widest text-on-surface font-bold">
          {config.label}
        </span>
        <MetricInfo
          title={config.label}
          description={TRACK_INFO[config.key]?.description ?? "Brain network activation track."}
          calculation={TRACK_INFO[config.key]?.calculation ?? "Predicted by BrainRank from brain activation patterns."}
          interpretation={TRACK_INFO[config.key]?.interpretation ?? "Higher values indicate stronger neural response."}
        />
      </div>

      <div className="flex-1" style={{ height: 80 }}>
        <AreaChart
          data={data as unknown as Record<string, unknown>[]}
          xDataKey="date"
          margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
          animationDuration={800}
          aspectRatio="auto"
          className="h-full"
        >
          <Grid
            horizontal
            vertical={false}
            numTicksRows={3}
            stroke="rgba(0,0,0,0.04)"
            strokeDasharray="3,3"
          />
          <Area
            dataKey="value"
            fill={config.color}
            fillOpacity={0.35}
            stroke={config.color}
            strokeWidth={2}
            gradientToOpacity={0}
            animate
            showHighlight
          />
          {showTooltip && (
            <ChartTooltip
              showDatePill={false}
              showCrosshair
              showDots
              content={tooltipTitle}
            />
          )}
        </AreaChart>
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

function TimeAxis({ segments }: { segments: SegmentData[] }) {
  // Use the actual data extent to match the chart's auto-scaled x-axis
  const maxTime = segments.length > 0
    ? Math.max(...segments.map(s => s.start))
    : 0;
  const tickCount = maxTime <= 30 ? 6 : maxTime <= 120 ? 8 : 10;
  const ticks: number[] = [];
  for (let i = 0; i <= tickCount; i++) {
    ticks.push((i / tickCount) * maxTime);
  }

  // On mobile, show fewer ticks to avoid overlap — keep first, last, and every other
  const mobileTickStride = tickCount >= 6 ? 2 : 1;

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 md:w-24 shrink-0" />
      <div className="flex-1 relative h-5">
        {ticks.map((t, idx) => {
          const pct = (t / maxTime) * 100;
          const hideOnMobile =
            idx !== 0 && idx !== ticks.length - 1 && idx % mobileTickStride !== 0;
          return (
            <span
              key={t}
              className={`absolute font-mono text-[10px] text-on-surface-variant/60 ${hideOnMobile ? "hidden md:inline" : ""}`}
              style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
            >
              {formatTimestamp(t)}
            </span>
          );
        })}
      </div>
    </div>
  );
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
    const rect = container.getBoundingClientRect();
    // Account for the 24px label column + 8px gap
    const chartLeft = 104; // w-24 (96px) + gap-2 (8px)
    const chartWidth = rect.width - chartLeft;
    const x = e.clientX - rect.left - chartLeft;
    const ratio = Math.max(0, Math.min(1, x / chartWidth));
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

  // Filter out segments beyond the actual video duration
  const filteredSegments = segments.filter(s => s.start < duration);

  const trackData = TRACK_CONFIG.map(config => ({
    ...config,
    data: toChartData(filteredSegments, config.key),
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
          calculation="BrainRank processes video, audio, and text features through neural encoders, then predicts activation levels for 9 brain networks every 2 seconds."
          interpretation="Higher peaks = stronger neural response. Compare tracks to see which brain systems your content engages most. Attention and Reward tracks are key for viewer retention."
        />
      </div>

      {/* Icon Markers Row */}
      {iconMarkers && iconMarkers.length > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <div className="w-24 shrink-0" />
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
        {(expanded ? trackData : trackData.slice(0, DEFAULT_VISIBLE_COUNT)).map((track) => (
          <SingleTrack
            key={track.key}
            data={track.data}
            config={track}
            duration={duration}
            showTooltip
            lookup={lookup}
            currentTime={currentTime}
            onSeek={onSeek}
          />
        ))}
      </div>

      <TimeAxis segments={filteredSegments} />

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
