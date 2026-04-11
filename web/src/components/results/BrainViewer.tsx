'use client';

import React, { Suspense, useState, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { BrainViewerCanvas } from './BrainViewerCanvas';
import type { BrainViewerCanvasHandle } from './BrainViewerCanvas';
import { getRegionsAtTime, getVertexDataAtTime, REGION_COLORS } from './brain-utils';
import type { SegmentRegionScores } from './brain-utils';
import type { SegmentData } from '@/components/results/SegmentTable';
import { decodeVertexData } from '@/lib/vertex-codec';
import { COLORMAP_OPTIONS } from '@/lib/colormap';
import type { ColormapName } from '@/lib/colormap';

interface BrainViewerProps {
  segments: SegmentData[];
  currentTimeRef: React.RefObject<number>;
  currentTime: number; // React state (~4Hz) — drives vertex data updates at segment boundaries
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

export function BrainViewer({ segments, currentTimeRef, currentTime }: BrainViewerProps) {
  // Read time from ref for region scores — avoids 60fps React re-renders
  const refTime = currentTimeRef.current;
  const regionScores = getRegionsAtTime(segments, refTime);
  const canvasRef = useRef<BrainViewerCanvasHandle>(null);
  const [viewMode, setViewMode] = useState<'heatmap' | 'regions'>('heatmap');
  const [colormap, setColormap] = useState<ColormapName>('plasma');
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

  // Decode vertex data using React state time (~4Hz) so useMemo re-evaluates at segment boundaries
  const vertexDataBase64 = getVertexDataAtTime(segments, currentTime);
  const vertexData = useMemo(() => {
    if (!vertexDataBase64) return null;
    try {
      return decodeVertexData(vertexDataBase64);
    } catch {
      return null;
    }
  }, [vertexDataBase64]);

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
        <div className="flex items-center gap-3">
          {/* Colormap selector — only visible in heatmap mode */}
          {viewMode === 'heatmap' && (
            <select
              value={colormap}
              onChange={(e) => setColormap(e.target.value as ColormapName)}
              className="bg-surface-container-high border border-white/10 rounded-md px-2 py-1 text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant focus:outline-none focus:border-primary/40 cursor-pointer"
            >
              {COLORMAP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.name}
                </option>
              ))}
            </select>
          )}

          {/* View mode toggle */}
          <div className="flex items-center bg-surface-container rounded-md border border-white/5">
            {(['heatmap', 'regions'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-headline font-bold uppercase tracking-wider transition-colors ${
                  viewMode === mode
                    ? 'bg-surface-container-high border border-white/10 text-on-surface'
                    : 'border border-transparent text-on-surface-variant/60 hover:text-on-surface-variant'
                }`}
              >
                {mode === 'heatmap' ? 'Heatmap' : 'Regions'}
              </button>
            ))}
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
      </div>
      <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden relative">
        <Canvas
          camera={{ position: [0, 0, 200], fov: 45 }}
          dpr={[1, 1.5]}
          style={{ background: '#151520' }}
        >
          <Suspense fallback={null}>
            <BrainViewerCanvas
              ref={canvasRef}
              regionScores={regionScores}
              visibleRegions={visibleRegions}
              viewMode={viewMode}
              colormap={colormap}
              vertexData={vertexData}
            />
          </Suspense>
        </Canvas>
      </div>
      {/* Region legend — only visible in regions mode */}
      {viewMode === 'regions' && (
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
      )}
    </div>
  );
}
