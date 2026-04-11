'use client';

import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { BrainViewerCanvas } from './BrainViewerCanvas';
import { ActivationLegend } from './ActivationLegend';
import { getAdjacentSegments, getRegionsAtTime } from './brain-utils';
import type { SegmentData } from '@/components/results/SegmentTable';
import { decodeVertexData, VERTEX_COUNT } from '@/lib/vertex-codec';

interface BrainViewerProps {
  segments: SegmentData[];
  currentTimeRef: React.RefObject<number>;
  currentTime: number; // React state (~4Hz) — drives vertex data updates at segment boundaries
}

/**
 * Generate a uniform activation array from region scores when per-vertex
 * data is not available. Uses the average of all region scores so the
 * brain still lights up proportionally.
 */
function syntheticVertexData(segments: SegmentData[], time: number): Float32Array | null {
  const regions = getRegionsAtTime(segments, time);
  if (!regions) return null;
  const values = Object.values(regions) as number[];
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const arr = new Float32Array(VERTEX_COUNT);
  arr.fill(avg);
  return arr;
}

export function BrainViewer({ segments, currentTime }: BrainViewerProps) {
  // Get current + next segment vertex data and blend factor for smooth transitions
  const adjacent = getAdjacentSegments(segments, currentTime);
  const hasVertexData = !!adjacent;

  const vertexDataA = useMemo(() => {
    if (adjacent) {
      try {
        return decodeVertexData(adjacent.currentVertexData);
      } catch {
        return null;
      }
    }
    // Fallback: generate uniform activation from region scores
    return syntheticVertexData(segments, currentTime);
  }, [adjacent?.currentVertexData, hasVertexData, segments, currentTime]);

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
