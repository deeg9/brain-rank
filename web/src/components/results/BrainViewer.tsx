'use client';

import React, { Suspense, useMemo, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { BrainViewerCanvas } from './BrainViewerCanvas';
import { NetworkLegend } from './NetworkLegend';
import { getAdjacentSegments, getRegionsAtTime, REGION_COLORS } from './brain-utils';
import type { SegmentData, SegmentRegionScores } from '@/components/results/SegmentTable';
import { decodeVertexData, VERTEX_COUNT } from '@/lib/vertex-codec';

type NetworkVertexMap = Record<keyof SegmentRegionScores, number[]>;

interface BrainViewerProps {
  segments: SegmentData[];
  currentTimeRef: React.RefObject<number>;
  currentTime: number;
}

/**
 * Convert hex color string to [r, g, b] normalized to [0,1].
 */
function hexToRGB(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

// Dark base color for inactive vertices
const BASE_R = 0.102; // #1a
const BASE_G = 0.102;
const BASE_B = 0.118; // #1e

/**
 * Build a per-vertex activation array from region scores + vertex map.
 * Each vertex gets painted with its network's color scaled by score.
 * Returns a Float32Array of length VERTEX_COUNT * 3 (RGB).
 */
function buildRegionColors(
  regions: SegmentRegionScores,
  vertexMap: NetworkVertexMap,
  out: Float32Array,
): void {
  // Fill with dark base
  for (let i = 0; i < VERTEX_COUNT; i++) {
    out[i * 3] = BASE_R;
    out[i * 3 + 1] = BASE_G;
    out[i * 3 + 2] = BASE_B;
  }

  // Paint each network's vertices with its color * score
  for (const [network, indices] of Object.entries(vertexMap)) {
    const score = regions[network as keyof SegmentRegionScores] ?? 0;
    if (score < 0.05) continue; // Skip nearly-zero networks

    const color = REGION_COLORS[network as keyof SegmentRegionScores];
    if (!color) continue;
    const [cr, cg, cb] = hexToRGB(color);

    // Intensity: blend between base and full color based on score
    // Score > 0.5 gets emissive boost (values > 1.0 with toneMapped=false)
    const intensity = Math.max(0.15, score);
    const emissiveBoost = score > 0.5 ? 1 + (score - 0.5) * 2 : 1;

    for (const idx of indices) {
      if (idx >= VERTEX_COUNT) continue;
      out[idx * 3] = cr * intensity * emissiveBoost;
      out[idx * 3 + 1] = cg * intensity * emissiveBoost;
      out[idx * 3 + 2] = cb * intensity * emissiveBoost;
    }
  }
}

export function BrainViewer({ segments, currentTime }: BrainViewerProps) {
  const [vertexMap, setVertexMap] = useState<NetworkVertexMap | null>(null);

  // Load network-vertex-map.json once
  useEffect(() => {
    fetch('/data/network-vertex-map.json')
      .then(r => r.json())
      .then(setVertexMap)
      .catch(() => setVertexMap(null));
  }, []);

  // Get current + next segment vertex data and blend factor for smooth transitions
  const adjacent = getAdjacentSegments(segments, currentTime);
  const hasVertexData = !!adjacent;

  // Pre-allocate color buffer for region-based mode
  const regionColorBuffer = useMemo(() => new Float32Array(VERTEX_COUNT * 3), []);

  const vertexDataA = useMemo(() => {
    if (adjacent) {
      try {
        return decodeVertexData(adjacent.currentVertexData);
      } catch {
        // fall through to region-based
      }
    }
    return null;
  }, [adjacent?.currentVertexData, hasVertexData]);

  const vertexDataB = useMemo(() => {
    if (!adjacent?.nextVertexData) return null;
    try {
      return decodeVertexData(adjacent.nextVertexData);
    } catch {
      return null;
    }
  }, [adjacent?.nextVertexData]);

  // Region-based colors when vertex_data is unavailable
  const regionColors = useMemo(() => {
    if (vertexDataA) return null; // per-vertex mode, skip
    if (!vertexMap) return null;
    const regions = getRegionsAtTime(segments, currentTime);
    if (!regions) return null;
    buildRegionColors(regions, vertexMap, regionColorBuffer);
    return regionColorBuffer;
  }, [vertexDataA, vertexMap, segments, currentTime, regionColorBuffer]);

  const blendFactor = adjacent?.blendFactor ?? 0;

  // Determine which mode we're in
  const useRegionMode = !vertexDataA && !!regionColors;

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
            <BrainViewerCanvas
              vertexDataA={vertexDataA}
              vertexDataB={vertexDataB}
              blendFactor={blendFactor}
              regionColors={regionColors}
            />
          </Suspense>
        </Canvas>
      </div>
      <NetworkLegend
        regions={getRegionsAtTime(segments, currentTime)}
      />
    </div>
  );
}
