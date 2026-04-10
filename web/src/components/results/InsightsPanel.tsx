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

function engagementSummary(tier: TierName): string {
  switch (tier) {
    case 'Elite':
      return 'Exceptional neural response — this content triggers strong activation across all brain regions';
    case 'Strong':
      return 'Strong brain engagement — viewers show high activation in attention and reward systems';
    case 'Average':
      return 'Moderate neural response — some regions activate strongly while others show room for growth';
    case 'Weak':
      return 'Below average brain activation — viewers show limited engagement across most regions';
    case 'Critical':
      return 'Low neural response — the brain shows minimal reaction to this content';
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
          <span className="material-symbols-outlined text-tertiary-fixed text-lg mt-0.5">group</span>
          <p className="text-on-surface">
            <span className="font-bold">High Social Processing</span> at{' '}
            <span className="font-bold text-tertiary-fixed">{formatTimestamp(m.timestamp)}</span> —
            the brain is thinking about other people ({Math.round(m.score * 100)}% social cognition)
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
          <span className="material-symbols-outlined text-error text-lg mt-0.5">trending_down</span>
          <p className="text-on-surface">
            <span className="font-bold">Attention Shift</span> at{' '}
            <span className="font-bold text-error">{formatTimestamp(d.timestamp)}</span> —
            emotional processing drops {Math.round(d.drop * 100)}%, the brain is disengaging
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
          <span className="material-symbols-outlined text-primary text-lg mt-0.5">neurology</span>
          <p className="text-on-surface">
            <span className="font-bold">Deep Engagement</span>{' '}
            <span className="font-bold text-primary">
              {formatTimestamp(f.startTime)}–{formatTimestamp(f.endTime)}
            </span>{' '}
            — sustained attention + reward activation for {f.segmentCount} segments
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

  const regionLabels: Record<string, string> = {
    hookStrength: 'First Impressions',
    retention: 'Sustained Attention',
    emotionalArc: 'Emotional Range',
    shareability: 'Social Processing',
  };

  return (
    <div className="space-y-4">
      {/* Section 1: Neural Response Overview */}
      <Card className="p-8 glass-surface overflow-hidden">
        <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
          Neural Response Analysis
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
            {Math.round(virality.score * 100)}
          </p>
          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${tierBadgeClasses(virality.tier.color)}`}
            >
              {virality.tier.tier} Response
            </span>
            <p className="text-on-surface-variant text-xs mt-1">Overall Brain Engagement Score</p>
          </div>
        </div>

        <p className="text-on-surface-variant text-sm mb-6">{engagementSummary(virality.tier.tier)}</p>

        {/* Region breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(virality.components) as [string, number][]).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] font-headline uppercase tracking-wider text-on-surface-variant w-24 shrink-0">
                {regionLabels[key] ?? key}
              </span>
              <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreBarColor(value)}`}
                  style={{ width: `${Math.round(value * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant w-8 text-right">
                {Math.round(value * 100)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 2: First Impressions (Hook Analysis) */}
      <Card className="p-6">
        <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
          First Impressions (0–5s)
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
          What the brain does in the first 5 seconds determines whether viewers stay or scroll
        </p>
      </Card>

      {/* Section 3: Brain Activity Moments */}
      <Card className="p-6">
        <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
          Brain Activity Moments
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
                Consistent neural response throughout — no significant shifts detected
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Section 4: Neural Observations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
            Observations
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
      )}

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
          <span className="font-headline uppercase tracking-widest">Powered by neuroscience</span>
        </button>

        {researchOpen && (
          <div className="mt-2 pl-6 space-y-1 text-[11px] text-on-surface-variant">
            <p>Meta TRIBE v2 — Brain-predictive foundation model trained on 500+ hours of fMRI data from 720 subjects</p>
            <p>Stanford/PNAS 2020 — Brain activity forecasts video engagement in population-scale data</p>
            <p>PNAS Nexus 2024 — Mega-analysis of 16 fMRI datasets on message effectiveness</p>
          </div>
        )}
      </div>
    </div>
  );
}
