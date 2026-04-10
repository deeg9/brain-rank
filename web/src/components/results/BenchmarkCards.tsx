'use client';

import { Card } from '@/components/ui';
import { type BenchmarkResult, getTier } from '@/lib/benchmark';

interface BenchmarkCardsProps {
  benchmark: BenchmarkResult;
}

const BENCHMARKS = [
  { key: 'hookStrength' as const, label: 'Hook Strength', benchmark: 0.75 },
  { key: 'retention' as const, label: 'Retention Power', benchmark: 0.60 },
  { key: 'shareability' as const, label: 'Shareability', benchmark: 0.68 },
  { key: 'emotionalArc' as const, label: 'Emotional Arc', benchmark: 0.50 },
] as const;

function tierBadgeClasses(color: 'tertiary' | 'primary' | 'error'): string {
  switch (color) {
    case 'tertiary':
      return 'bg-tertiary-fixed-dim/20 text-tertiary-fixed';
    case 'primary':
      return 'bg-primary/20 text-primary';
    case 'error':
      return 'bg-error/20 text-error';
  }
}

export function BenchmarkCards({ benchmark }: BenchmarkCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {BENCHMARKS.map(({ key, label, benchmark: benchmarkValue }) => {
        const userScore = benchmark.virality.components[key];
        const tier = getTier(userScore);
        const delta = userScore - benchmarkValue;

        let deltaIcon: string;
        let deltaColor: string;
        if (delta > 0.005) {
          deltaIcon = 'trending_up';
          deltaColor = 'text-tertiary-fixed';
        } else if (delta < -0.005) {
          deltaIcon = 'trending_down';
          deltaColor = 'text-error';
        } else {
          deltaIcon = 'drag_handle';
          deltaColor = 'text-on-surface-variant';
        }

        return (
          <Card
            key={key}
            className="p-5 glass-surface hover:glow-primary transition-all duration-300"
          >
            <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">
              {label}
            </p>

            <div className="flex items-end gap-2 mb-1">
              <p className="font-headline text-2xl font-bold text-on-surface">
                {Math.round(userScore * 100)}%
              </p>
              <span className={`material-symbols-outlined text-lg ${deltaColor}`}>
                {deltaIcon}
              </span>
            </div>

            <p className="text-[10px] text-on-surface-variant mb-3">
              Viral avg: {Math.round(benchmarkValue * 100)}%
            </p>

            <span
              className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${tierBadgeClasses(tier.color)}`}
            >
              {tier.label}
            </span>
          </Card>
        );
      })}
    </div>
  );
}
