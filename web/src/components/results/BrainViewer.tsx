'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { BrainViewerCanvas } from './BrainViewerCanvas';
import { getRegionsAtTime, REGION_COLORS } from './brain-utils';
import type { SegmentData } from '@/components/results/SegmentTable';

interface BrainViewerProps {
  segments: SegmentData[];
  currentTime: number;
}

const REGION_LABELS: Record<string, string> = {
  attention: 'Attention',
  reward: 'Reward',
  emotional_processing: 'Emotional',
  social_cognition: 'Social',
};

export function BrainViewer({ segments, currentTime }: BrainViewerProps) {
  const regionScores = getRegionsAtTime(segments, currentTime);

  return (
    <div>
      <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
        Neural Activation Map
      </h3>
      <div className="h-[400px] w-full rounded-xl overflow-hidden glass-surface ghost-border relative">
        <Canvas
          camera={{ position: [0, 0, 200], fov: 45 }}
          dpr={[1, 1.5]}
          style={{ background: '#0a0a0f' }}
        >
          <Suspense fallback={null}>
            <BrainViewerCanvas regionScores={regionScores} />
          </Suspense>
        </Canvas>
      </div>
      <div className="flex items-center justify-center gap-6 mt-3">
        {Object.entries(REGION_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px] font-headline uppercase tracking-wider text-on-surface-variant">
              {REGION_LABELS[key] ?? key}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
