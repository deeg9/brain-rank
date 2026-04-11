'use client';

import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { BrainViewerCanvas } from './BrainViewerCanvas';
import { getVertexDataAtTime } from './brain-utils';
import type { SegmentData } from '@/components/results/SegmentTable';
import { decodeVertexData } from '@/lib/vertex-codec';

interface BrainViewerProps {
  segments: SegmentData[];
  currentTimeRef: React.RefObject<number>;
  currentTime: number; // React state (~4Hz) — drives vertex data updates at segment boundaries
}

export function BrainViewer({ segments, currentTime }: BrainViewerProps) {
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
            <BrainViewerCanvas vertexData={vertexData} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
