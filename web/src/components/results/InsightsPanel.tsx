'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { formatTimestamp } from '@/lib/results';
import {
  type BenchmarkResult,
  type TierName,
  type TierColor,
} from '@/lib/benchmark';

// ─── Tier color mapping ──────────────────────────────────────────────────────

function tierBadgeClasses(color: TierColor): string {
  switch (color) {
    case 'tertiary':
      return 'bg-tertiary-fixed-dim/20 text-tertiary-fixed';
    case 'primary':
      return 'bg-primary/20 text-primary';
    case 'error':
      return 'bg-error/20 text-error';
  }
}

function tierSummary(tier: TierName): string {
  switch (tier) {
    case 'Elite':
      return 'Exceptional neural engagement -- this content is engineered to go viral';
    case 'Strong':
      return 'Strong neural activation -- above average viral potential';
    case 'Average':
      return 'Moderate engagement -- targeted improvements could boost virality';
    case 'Weak':
      return 'Below average activation -- significant optimization opportunities exist';
    case 'Critical':
      return 'Low neural engagement -- fundamental rethinking of content approach recommended';
  }
}

function scoreBarColor(value: number): string {
  if (value >= 0.70) return 'bg-tertiary-fixed';
  if (value >= 0.45) return 'bg-primary';
  return 'bg-error';
}

// ─── Component ───────────────────────────────────────────────────────────────

interface InsightsPanelProps {
  benchmark: BenchmarkResult;
}

export function InsightsPanel({ benchmark }: InsightsPanelProps) {
  const [researchOpen, setResearchOpen] = useState(false);
  const { virality, hook, dropoffs, shareMoments, flowStates, recommendations } = benchmark;

  // Collect all key moments chronologically
  const moments: { time: number; node: React.ReactNode }[] = [];

  shareMoments.forEach((m) => {
    moments.push({
      time: m.timestamp,
      node: (
        <div key={`share-${m.segmentIndex}`} className="flex items-start gap-3">
          <span className="material-symbols-outlined text-tertiary-fixed text-lg mt-0.5">share</span>
          <p className="text-on-surface">
            <span className="font-bold">Share Moment</span> at{' '}
            <span className="font-bold text-tertiary-fixed">{formatTimestamp(m.timestamp)}</span> --
            social cognition peaks at {Math.round(m.score * 100)}%
          </p>
        </div>
      ),
    });
  });

  dropoffs.forEach((d) => {
    moments.push({
      time: d.timestamp,
      node: (
        <div key={`drop-${d.segmentIndex}`} className="flex items-start gap-3">
          <span className="material-symbols-outlined text-error text-lg mt-0.5">warning</span>
          <p className="text-on-surface">
            <span className="font-bold">Drop-off Risk</span> at{' '}
            <span className="font-bold text-error">{formatTimestamp(d.timestamp)}</span> --
            emotional engagement drops {Math.round(d.drop * 100)}%
          </p>
        </div>
      ),
    });
  });

  flowStates.forEach((f, i) => {
    moments.push({
      time: f.startTime,
      node: (
        <div key={`flow-${i}`} className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-lg mt-0.5">play_circle</span>
          <p className="text-on-surface">
            <span className="font-bold">Flow State</span>{' '}
            <span className="font-bold text-primary">
              {formatTimestamp(f.startTime)}-{formatTimestamp(f.endTime)}
            </span>{' '}
            -- {f.segmentCount} segments of sustained engagement
          </p>
        </div>
      ),
    });
  });

  moments.sort((a, b) => a.time - b.time);

  const priorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const cls =
      priority === 'high'
        ? 'bg-error/20 text-error'
        : priority === 'medium'
          ? 'bg-primary/20 text-primary'
          : 'bg-tertiary-fixed-dim/20 text-tertiary-fixed';
    return (
      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${cls}`}>
        {priority}
      </span>
    );
  };

  const componentLabels: Record<string, string> = {
    hookStrength: 'Hook',
    retention: 'Retention',
    emotionalArc: 'Emotional Arc',
    shareability: 'Shareability',
  };

  return (
    <div className="space-y-4">
      {/* Section 1: Virality Verdict */}
      <Card className="p-8 glass-surface overflow-hidden">
        <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
          Virality Verdict
        </p>

        <div className="flex items-center gap-6 mb-4">
          <p
            className="font-headline text-5xl font-black animate-score-in"
            style={{
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {Math.round(virality.score * 100)}%
          </p>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${tierBadgeClasses(virality.tier.color)}`}
          >
            {virality.tier.label}
          </span>
        </div>

        <p className="text-on-surface-variant text-sm mb-6">{tierSummary(virality.tier.tier)}</p>

        {/* Component scores */}
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(virality.components) as [string, number][]).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] font-headline uppercase tracking-wider text-on-surface-variant w-20 shrink-0">
                {componentLabels[key] ?? key}
              </span>
              <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreBarColor(value)}`}
                  style={{ width: `${Math.round(value * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant w-8 text-right">
                {Math.round(value * 100)}%
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 2: Hook Analysis */}
      <Card className="p-6">
        <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
          Hook Analysis (0-5s)
        </p>

        <p className="font-headline font-bold text-lg text-on-surface mb-1">{hook.headline}</p>
        <p className="text-on-surface-variant text-sm mb-4">{hook.description}</p>

        <div className="flex gap-6 mb-3">
          {[
            { label: 'Reward', value: hook.reward },
            { label: 'Attention', value: hook.attention },
          ].map((metric) => (
            <div key={metric.label} className="flex items-center gap-2">
              <span className="text-[10px] font-headline uppercase tracking-wider text-on-surface-variant">
                {metric.label}
              </span>
              <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreBarColor(metric.value)}`}
                  style={{ width: `${Math.round(metric.value * 100)}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${metric.value >= 0.70 ? 'text-tertiary-fixed' : metric.value >= 0.45 ? 'text-primary' : 'text-error'}`}>
                {Math.round(metric.value * 100)}%
              </span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-on-surface-variant italic">
          Based on Stanford finding: NAcc + mPFC activity in first 4 seconds predicts virality
        </p>
      </Card>

      {/* Section 3: Key Moments */}
      <Card className="p-6">
        <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
          Key Moments
        </p>

        <div className="space-y-3">
          {moments.length > 0 ? (
            moments.map((m, i) => <div key={i}>{m.node}</div>)
          ) : (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary-fixed text-lg mt-0.5">
                check_circle
              </span>
              <p className="text-on-surface">
                No significant moments detected -- video has consistent engagement throughout
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Section 4: Recommendations */}
      <Card className="p-6">
        <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
          Recommendations
        </p>

        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-on-surface-variant text-lg mt-0.5">
                {rec.icon}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-headline font-bold text-on-surface">{rec.title}</span>
                  {priorityBadge(rec.priority)}
                </div>
                <p className="text-on-surface-variant text-sm">{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 5: Research Attribution */}
      <div className="px-2">
        <button
          onClick={() => setResearchOpen(!researchOpen)}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-xs"
        >
          <span
            className="material-symbols-outlined text-sm transition-transform"
            style={{ transform: researchOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            chevron_right
          </span>
          <span className="font-headline uppercase tracking-widest">Research basis</span>
        </button>

        {researchOpen && (
          <div className="mt-2 pl-6 space-y-1 text-[11px] text-on-surface-variant">
            <p>Stanford/PNAS 2020 -- Brain activity forecasts video engagement in population-scale data</p>
            <p>PNAS Nexus 2024 -- Mega-analysis of 16 fMRI datasets on message effectiveness</p>
            <p>Meta TRIBE v2 -- Brain-predictive foundation model for content analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
