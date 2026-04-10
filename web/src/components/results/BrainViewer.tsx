'use client';

import { Suspense, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { BrainViewerCanvas } from './BrainViewerCanvas';
import type { BrainViewerCanvasHandle } from './BrainViewerCanvas';
import { getRegionsAtTime, REGION_COLORS } from './brain-utils';
import type { SegmentRegionScores } from './brain-utils';
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
  visual_processing: 'Visual',
  auditory_processing: 'Auditory',
  language_narrative: 'Language',
  default_mode: 'Default Mode',
  motion_processing: 'Motion',
};

type RegionKey = keyof SegmentRegionScores;

export function BrainViewer({ segments, currentTime }: BrainViewerProps) {
  const regionScores = getRegionsAtTime(segments, currentTime);
  const canvasRef = useRef<BrainViewerCanvasHandle>(null);
  const [visibleRegions, setVisibleRegions] = useState<Record<RegionKey, boolean>>({
    attention: true,
    reward: true,
    emotional_processing: true,
    social_cognition: true,
    visual_processing: true,
    auditory_processing: true,
    language_narrative: true,
    default_mode: true,
    motion_processing: true,
  });

  function toggleRegion(key: RegionKey) {
    setVisibleRegions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="bg-surface-container rounded-xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant">neurology</span>
          <h3 className="font-headline text-lg font-bold">Neural Activation Map</h3>
        </div>
        {/* Preset view controls */}
        <div className="flex items-center gap-1">
          {([
            { label: 'Front', action: () => canvasRef.current?.viewFront(), icon: 'face' },
            { label: 'Top', action: () => canvasRef.current?.viewTop(), icon: 'vertical_align_top' },
            { label: 'Left', action: () => canvasRef.current?.viewLeft(), icon: 'chevron_left' },
            { label: 'Right', action: () => canvasRef.current?.viewRight(), icon: 'chevron_right' },
          ] as const).map(({ label, action, icon }) => (
            <button
              key={label}
              onClick={action}
              className="px-2 py-1 rounded-md text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1"
              title={`${label} view`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden relative">
        <Canvas
          camera={{ position: [0, 0, 200], fov: 45 }}
          dpr={[1, 1.5]}
          style={{ background: '#151520' }}
        >
          <Suspense fallback={null}>
            <BrainViewerCanvas ref={canvasRef} regionScores={regionScores} visibleRegions={visibleRegions} />
          </Suspense>
        </Canvas>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        {(Object.entries(REGION_COLORS) as [RegionKey, string][]).map(([key, color]) => {
          const active = visibleRegions[key];
          const score = regionScores?.[key] ?? 0;
          return (
            <button
              key={key}
              onClick={() => toggleRegion(key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-headline font-bold uppercase tracking-wider transition-all duration-200 border ${
                active
                  ? 'bg-surface-container-high border-white/10 text-on-surface shadow-lg'
                  : 'bg-surface-container border-transparent text-on-surface-variant/40 hover:text-on-surface-variant/60'
              }`}
              style={active ? { boxShadow: `0 0 12px ${color}20, 0 0 4px ${color}10` } : undefined}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-200"
                style={{
                  background: active ? color : '#555',
                  boxShadow: active ? `0 0 6px ${color}80` : 'none',
                }}
              />
              <span>{REGION_LABELS[key] ?? key}</span>
              {active && (
                <span
                  className="font-mono text-[10px] tabular-nums ml-0.5"
                  style={{ color }}
                >
                  {Math.round(score * 100)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
