'use client';

import React, { Suspense, useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BrainViewerCanvas, type BrainViewerCanvasHandle } from './BrainViewerCanvas';
import { NetworkLegend } from './NetworkLegend';
import { getAdjacentSegments, getRegionsAtTime, REGION_COLORS } from './brain-utils';
import type { SegmentData, SegmentRegionScores } from '@/components/results/SegmentTable';
import { decodeVertexData, VERTEX_COUNT } from '@/lib/vertex-codec';
import { MetricInfo } from '@/components/results/MetricInfo';

export type NetworkVertexMap = Record<keyof SegmentRegionScores, number[]>;

interface BrainViewerProps {
  segments: SegmentData[];
  currentTimeRef: React.RefObject<number>;
  currentTime: number;
}

export interface HoverInfo {
  network: keyof SegmentRegionScores;
  label: string;
  anatomy: string;
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

const NETWORK_ANATOMY: Record<keyof SegmentRegionScores, string> = {
  attention: 'Prefrontal & Parietal Cortex',
  reward: 'Orbitofrontal & Anterior Cingulate',
  emotional_processing: 'Amygdala & Temporal Pole',
  social_cognition: 'Temporal-Parietal Junction',
  visual_processing: 'Occipital Lobe',
  auditory_processing: 'Superior Temporal Gyrus',
  language_narrative: 'Broca\'s & Wernicke\'s Areas',
  default_mode: 'Medial Prefrontal & Posterior Cingulate',
  motion_processing: 'MT/V5 & Premotor Cortex',
};

function hexToRGB(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

// Light gray base for inactive vertices — clean and bright on white backgrounds
const BASE_R = 0.85;
const BASE_G = 0.85;
const BASE_B = 0.87;

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

    // Blend from base toward the region color, then boost above 1.0 for bloom glow
    const t = Math.max(0.3, Math.min(1, score * 2.0));
    // High activations push colors above 1.0 so bloom picks them up
    const emissiveBoost = score > 0.3 ? 1.0 + (score - 0.3) * 1.5 : 1.0;

    for (const idx of indices) {
      if (idx >= VERTEX_COUNT) continue;
      out[idx * 3]     = (BASE_R + (cr - BASE_R) * t) * emissiveBoost;
      out[idx * 3 + 1] = (BASE_G + (cg - BASE_G) * t) * emissiveBoost;
      out[idx * 3 + 2] = (BASE_B + (cb - BASE_B) * t) * emissiveBoost;
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

const CAMERA_DISTANCE = 190;
const VIEW_PRESETS: { label: string; icon: string; position: [number, number, number] }[] = [
  { label: 'Front', icon: 'visibility', position: [0, 0, CAMERA_DISTANCE] },
  { label: 'Top', icon: 'vertical_align_top', position: [0, CAMERA_DISTANCE, 0] },
  { label: 'Left', icon: 'chevron_left', position: [-CAMERA_DISTANCE, 0, 0] },
  { label: 'Right', icon: 'chevron_right', position: [CAMERA_DISTANCE, 0, 0] },
];

export function BrainViewer({ segments, currentTime }: BrainViewerProps) {
  const [vertexMap, setVertexMap] = useState<NetworkVertexMap | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [locked, setLocked] = useState(false);
  const canvasRef = useRef<BrainViewerCanvasHandle>(null);
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
      anatomy: NETWORK_ANATOMY[network],
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
    <div className="rounded-xl p-6 flex flex-col glass-surface">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-on-surface-variant">neurology</span>
        <h3 className="font-headline text-lg font-bold">Neural Activation Map</h3>
        <MetricInfo
          title="Neural Activation Map"
          description="Interactive 3D brain model showing which regions activate as your video plays. Colored areas indicate active neural networks — brighter colors mean stronger activation."
          calculation="BrainRank maps predicted brain activation onto the fsaverage5 cortical surface (10,242 vertices per hemisphere). Each vertex is colored based on the dominant neural network's activation score at the current timestamp."
          interpretation="Rotate the brain to see activation from different angles. Hover over colored regions to see which network is active and its intensity. Use the view buttons (front, top, side) for quick orientation."
        />
      </div>
      <div
        ref={canvasContainerRef}
        className="flex-1 min-h-[300px] rounded-lg overflow-hidden relative"
        onPointerLeave={handlePointerLeave}
      >
        <Canvas
          camera={{ position: [0, 0, 190], fov: 45 }}
          dpr={[1, 1.5]}
          style={{ background: 'transparent' }}
          gl={{ alpha: true }}
        >
          <Suspense fallback={null}>
            <BrainViewerCanvas
              ref={canvasRef}
              vertexDataA={vertexDataA}
              vertexDataB={vertexDataB}
              blendFactor={blendFactor}
              regionColors={regionColors}
              locked={locked}
              onHoverVertex={handleHoverVertex}
            />
            <EffectComposer>
              <Bloom
                luminanceThreshold={0.9}
                luminanceSmoothing={0.4}
                intensity={0.8}
                mipmapBlur
              />
            </EffectComposer>
          </Suspense>
        </Canvas>

        {/* Brain controls — vertical right-aligned */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
          {VIEW_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => canvasRef.current?.setView(preset.position)}
              className="w-7 h-7 rounded bg-surface-container-high/80 backdrop-blur-sm flex items-center justify-center hover:bg-surface-container-highest transition-colors"
              title={preset.label}
            >
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 16 }}>
                {preset.icon}
              </span>
            </button>
          ))}

          {/* Divider */}
          <div className="h-px w-full bg-outline-variant/20 my-0.5" />

          {/* Zoom in */}
          <button
            onClick={() => canvasRef.current?.zoomIn()}
            className="w-7 h-7 rounded bg-surface-container-high/80 backdrop-blur-sm flex items-center justify-center hover:bg-surface-container-highest transition-colors"
            title="Zoom in"
          >
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 16 }}>
              add
            </span>
          </button>

          {/* Zoom out */}
          <button
            onClick={() => canvasRef.current?.zoomOut()}
            className="w-7 h-7 rounded bg-surface-container-high/80 backdrop-blur-sm flex items-center justify-center hover:bg-surface-container-highest transition-colors"
            title="Zoom out"
          >
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 16 }}>
              remove
            </span>
          </button>

          {/* Divider */}
          <div className="h-px w-full bg-outline-variant/20 my-0.5" />

          {/* Lock rotation */}
          <button
            onClick={() => setLocked(prev => !prev)}
            className={`w-7 h-7 rounded backdrop-blur-sm flex items-center justify-center transition-colors ${locked ? 'bg-primary/20 text-primary' : 'bg-surface-container-high/80 hover:bg-surface-container-highest text-on-surface-variant'}`}
            title={locked ? 'Unlock rotation' : 'Lock rotation'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {locked ? 'lock' : 'lock_open'}
            </span>
          </button>
        </div>

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
              <p className="text-[10px] text-on-surface-variant/70 -mt-0.5">
                {hoverInfo.anatomy}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-1">
                Activation: <span className="font-mono font-bold text-on-surface">{Math.round(hoverInfo.score * 100)}%</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
