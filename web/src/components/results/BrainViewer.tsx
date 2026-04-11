'use client';

import React, { Suspense, useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { BrainViewerCanvas } from './BrainViewerCanvas';
import { NetworkLegend } from './NetworkLegend';
import { getAdjacentSegments, getRegionsAtTime, REGION_COLORS } from './brain-utils';
import type { SegmentData, SegmentRegionScores } from '@/components/results/SegmentTable';
import { decodeVertexData, VERTEX_COUNT } from '@/lib/vertex-codec';

export type NetworkVertexMap = Record<keyof SegmentRegionScores, number[]>;

interface BrainViewerProps {
  segments: SegmentData[];
  currentTimeRef: React.RefObject<number>;
  currentTime: number;
}

export interface HoverInfo {
  network: keyof SegmentRegionScores;
  label: string;
  score: number;
  color: string;
  screenX: number;
  screenY: number;
}

const NETWORK_LABELS: Record<keyof SegmentRegionScores, string> = {
  attention: 'Attention',
  reward: 'Reward',
  emotional_processing: 'Emotional Processing',
  social_cognition: 'Social Cognition',
  visual_processing: 'Visual Processing',
  auditory_processing: 'Auditory Processing',
  language_narrative: 'Language & Narrative',
  default_mode: 'Default Mode',
  motion_processing: 'Motion Processing',
};

function hexToRGB(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

const BASE_R = 0.102;
const BASE_G = 0.102;
const BASE_B = 0.118;

function buildRegionColors(
  regions: SegmentRegionScores,
  vertexMap: NetworkVertexMap,
  out: Float32Array,
): void {
  for (let i = 0; i < VERTEX_COUNT; i++) {
    out[i * 3] = BASE_R;
    out[i * 3 + 1] = BASE_G;
    out[i * 3 + 2] = BASE_B;
  }

  for (const [network, indices] of Object.entries(vertexMap)) {
    const score = regions[network as keyof SegmentRegionScores] ?? 0;
    if (score < 0.05) continue;

    const color = REGION_COLORS[network as keyof SegmentRegionScores];
    if (!color) continue;
    const [cr, cg, cb] = hexToRGB(color);

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

/**
 * Build a reverse lookup: vertex index → network name.
 * When a vertex belongs to multiple networks, the first one wins.
 */
function buildVertexToNetwork(
  vertexMap: NetworkVertexMap,
): Uint8Array {
  const NETWORK_KEYS = Object.keys(vertexMap) as (keyof SegmentRegionScores)[];
  // 0 = no network, 1-9 = network index + 1
  const map = new Uint8Array(VERTEX_COUNT);
  for (let ni = 0; ni < NETWORK_KEYS.length; ni++) {
    const indices = vertexMap[NETWORK_KEYS[ni]];
    for (const idx of indices) {
      if (idx < VERTEX_COUNT && map[idx] === 0) {
        map[idx] = ni + 1;
      }
    }
  }
  return map;
}

export function BrainViewer({ segments, currentTime }: BrainViewerProps) {
  const [vertexMap, setVertexMap] = useState<NetworkVertexMap | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/data/network-vertex-map.json')
      .then(r => r.json())
      .then(setVertexMap)
      .catch(() => setVertexMap(null));
  }, []);

  // Build reverse vertex→network lookup
  const vertexToNetwork = useMemo(() => {
    if (!vertexMap) return null;
    return buildVertexToNetwork(vertexMap);
  }, [vertexMap]);

  const networkKeys = useMemo(() => {
    if (!vertexMap) return [];
    return Object.keys(vertexMap) as (keyof SegmentRegionScores)[];
  }, [vertexMap]);

  const regions = getRegionsAtTime(segments, currentTime);

  const handleHoverVertex = useCallback((vertexIndex: number | null, clientX: number, clientY: number) => {
    if (vertexIndex === null || !vertexToNetwork || !regions) {
      setHoverInfo(null);
      return;
    }

    const networkIdx = vertexToNetwork[vertexIndex];
    if (networkIdx === 0) {
      setHoverInfo(null);
      return;
    }

    const network = networkKeys[networkIdx - 1];
    if (!network) {
      setHoverInfo(null);
      return;
    }

    // Convert client coords to position relative to canvas container
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    const screenX = rect ? clientX - rect.left : clientX;
    const screenY = rect ? clientY - rect.top : clientY;

    setHoverInfo({
      network,
      label: NETWORK_LABELS[network],
      score: regions[network] ?? 0,
      color: REGION_COLORS[network],
      screenX,
      screenY,
    });
  }, [vertexToNetwork, networkKeys, regions]);

  const handlePointerLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  const adjacent = getAdjacentSegments(segments, currentTime);
  const hasVertexData = !!adjacent;

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

  const regionColors = useMemo(() => {
    if (vertexDataA) return null;
    if (!vertexMap) return null;
    if (!regions) return null;
    buildRegionColors(regions, vertexMap, regionColorBuffer);
    return regionColorBuffer;
  }, [vertexDataA, vertexMap, segments, currentTime, regionColorBuffer]);

  const blendFactor = adjacent?.blendFactor ?? 0;

  return (
    <div className="bg-surface-container rounded-xl p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-on-surface-variant">neurology</span>
        <h3 className="font-headline text-lg font-bold">Neural Activation Map</h3>
      </div>
      <div
        ref={canvasContainerRef}
        className="flex-1 min-h-[300px] rounded-lg overflow-hidden relative"
        onPointerLeave={handlePointerLeave}
      >
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
              onHoverVertex={handleHoverVertex}
              vertexMap={vertexMap}
              regions={regions}
            />
          </Suspense>
        </Canvas>

        {/* Hover tooltip */}
        {hoverInfo && (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: hoverInfo.screenX + 12,
              top: hoverInfo.screenY - 8,
            }}
          >
            <div className="bg-surface-bright/95 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 shadow-xl">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: hoverInfo.color }}
                />
                <span className="text-xs font-bold text-on-surface">
                  {hoverInfo.label}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Activation: <span className="font-mono font-bold text-on-surface">{Math.round(hoverInfo.score * 100)}%</span>
              </p>
            </div>
          </div>
        )}
      </div>
      <NetworkLegend regions={regions} />
    </div>
  );
}
