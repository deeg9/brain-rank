'use client';

import type { SegmentRegionScores } from '@/components/results/SegmentTable';
import { REGION_COLORS } from './brain-utils';

const NETWORK_LABELS: Record<keyof SegmentRegionScores, string> = {
  attention: 'Attention',
  reward: 'Reward',
  emotional_processing: 'Emotional',
  social_cognition: 'Social',
  visual_processing: 'Visual',
  auditory_processing: 'Auditory',
  language_narrative: 'Language',
  default_mode: 'Default Mode',
  motion_processing: 'Motion',
};

interface NetworkLegendProps {
  regions: SegmentRegionScores | null;
}

export function NetworkLegend({ regions }: NetworkLegendProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
      {(Object.keys(NETWORK_LABELS) as (keyof SegmentRegionScores)[]).map((key) => {
        const score = regions?.[key] ?? 0;
        const opacity = score > 0.1 ? 1 : 0.4;
        return (
          <div key={key} className="flex items-center gap-1.5" style={{ opacity }}>
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: REGION_COLORS[key] }}
            />
            <span className="text-[10px] font-headline uppercase tracking-wider text-on-surface-variant">
              {NETWORK_LABELS[key]}
            </span>
            {regions && score > 0.1 && (
              <span className="text-[10px] font-mono text-on-surface">
                {Math.round(score * 100)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
