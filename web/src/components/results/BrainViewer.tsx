'use client';

import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { BrainViewerCanvas } from './BrainViewerCanvas';
import { ActivationLegend } from './ActivationLegend';
import { getAdjacentSegments } from './brain-utils';
import type { SegmentData } from '@/components/results/SegmentTable';
import { decodeVertexData } from '@/lib/vertex-codec';

interface BrainViewerProps {
  segments: SegmentData[];
  currentTimeRef: React.RefObject<number>;
  currentTime: number; // React state (~4Hz) — drives vertex data updates at segment boundaries
}

export function BrainViewer({ segments, currentTime }: BrainViewerProps) {
  // Get current + next segment vertex data and blend factor for smooth transitions
  const adjacent = getAdjacentSegments(segments, currentTime);

  const vertexDataA = useMemo(() => {
    if (!adjacent) return null;
    try {
      return decodeVertexData(adjacent.currentVertexData);
    } catch {
      return null;
    }
  }, [adjacent?.currentVertexData]);

  const vertexDataB = useMemo(() => {
    if (!adjacent?.nextVertexData) return null;
    try {
      return decodeVertexData(adjacent.nextVertexData);
    } catch {
      return null;
    }
  }, [adjacent?.nextVertexData]);

  const blendFactor = adjacent?.blendFactor ?? 0;

  return (
    <div className="bg-surface-container rounded-xl p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-on-surface-variant">neurology</span>
        <h3 className="font-headline text-lg font-bold">Neural Activation Map</h3>
      </div>
      <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden relative">
        <Canvas
          camera={{ position: [0, 0, 200], fov: 45 }}
          dpr={[1, 1.5]}
          style={{ background: '#151520' }}
        >
          <Suspense fallback={null}>
            <BrainViewerCanvas vertexDataA={vertexDataA} vertexDataB={vertexDataB} blendFactor={blendFactor} />
          </Suspense>
        </Canvas>
      </div>
      <ActivationLegend />
    </div>
  );
}
