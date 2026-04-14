'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { formatTimestamp } from '@/lib/results';
import type { BenchmarkResult } from '@/lib/benchmark';

// ─── Component ───────────────────────────────────────────────────────────────

interface InsightsPanelProps {
  benchmark: BenchmarkResult;
}

export function InsightsPanel({ benchmark }: InsightsPanelProps) {
  const [researchOpen, setResearchOpen] = useState(false);
  const { dropoffs, shareMoments } = benchmark;

  // Collect brain activity moments (dropoffs + social processing only)
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
            social cognition activation at {Math.round(m.score * 100)}%
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
            <span className="font-bold">Attention Drop</span> at{' '}
            <span className="font-bold text-error">{formatTimestamp(d.timestamp)}</span> —
            emotional processing drops {Math.round(d.drop * 100)}%
          </p>
        </div>
      ),
    });
  });

  moments.sort((a, b) => a.time - b.time);

  return (
    <div className="space-y-4">
      {/* Brain Activity Moments */}
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

      {/* Research Attribution */}
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
            <p>Brain-predictive foundation model trained on 500+ hours of fMRI data from 720 subjects</p>
            <p>Stanford/PNAS 2020 — Brain activity forecasts video engagement in population-scale data</p>
            <p>PNAS Nexus 2024 — Mega-analysis of 16 fMRI datasets on message effectiveness</p>
          </div>
        )}
      </div>
    </div>
  );
}
