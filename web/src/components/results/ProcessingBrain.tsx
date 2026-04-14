'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BrainViewerCanvas } from './BrainViewerCanvas';
import { REGION_COLORS } from './brain-utils';
import type { SegmentRegionScores } from './brain-utils';
import { VERTEX_COUNT } from '@/lib/vertex-codec';

type NetworkVertexMap = Record<keyof SegmentRegionScores, number[]>;

const NETWORK_KEYS = Object.keys(REGION_COLORS) as (keyof SegmentRegionScores)[];

const BASE_R = 0.85;
const BASE_G = 0.85;
const BASE_B = 0.87;

function hexToRGB(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

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

    const t = Math.max(0.3, Math.min(1, score * 2.0));
    const emissiveBoost = score > 0.3 ? 1.0 + (score - 0.3) * 1.5 : 1.0;

    for (const idx of indices) {
      if (idx >= VERTEX_COUNT) continue;
      out[idx * 3]     = (BASE_R + (cr - BASE_R) * t) * emissiveBoost;
      out[idx * 3 + 1] = (BASE_G + (cg - BASE_G) * t) * emissiveBoost;
      out[idx * 3 + 2] = (BASE_B + (cb - BASE_B) * t) * emissiveBoost;
    }
  }
}

function generateRandomRegions(): SegmentRegionScores {
  const regions = {} as SegmentRegionScores;
  // Pick 2-4 random networks to activate, leave others low
  const activeCount = 2 + Math.floor(Math.random() * 3);
  const shuffled = [...NETWORK_KEYS].sort(() => Math.random() - 0.5);

  for (const key of NETWORK_KEYS) {
    regions[key] = 0.02 + Math.random() * 0.08; // baseline flicker
  }
  for (let i = 0; i < activeCount; i++) {
    regions[shuffled[i]] = 0.3 + Math.random() * 0.6; // bright activation
  }
  return regions;
}

export function ProcessingBrain() {
  const [vertexMap, setVertexMap] = useState<NetworkVertexMap | null>(null);
  const regionColorsRef = useRef<Float32Array | null>(null);
  const [regionColors, setRegionColors] = useState<Float32Array | null>(null);
  const targetRegionsRef = useRef<SegmentRegionScores>(generateRandomRegions());
  const currentRegionsRef = useRef<SegmentRegionScores>(generateRandomRegions());

  // Load vertex map
  useEffect(() => {
    fetch('/data/network-vertex-map.json')
      .then((r) => r.json())
      .then((data) => setVertexMap(data as NetworkVertexMap))
      .catch(() => {});
  }, []);

  // Generate new random targets every 1.2s
  useEffect(() => {
    const interval = setInterval(() => {
      targetRegionsRef.current = generateRandomRegions();
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Smooth lerp animation at ~30fps
  useEffect(() => {
    if (!vertexMap) return;

    const buf = new Float32Array(VERTEX_COUNT * 3);
    regionColorsRef.current = buf;

    const interval = setInterval(() => {
      const current = currentRegionsRef.current;
      const target = targetRegionsRef.current;
      const lerpSpeed = 0.08;

      // Lerp current toward target
      for (const key of NETWORK_KEYS) {
        current[key] += (target[key] - current[key]) * lerpSpeed;
      }

      buildRegionColors(current, vertexMap, buf);
      setRegionColors(new Float32Array(buf));
    }, 33); // ~30fps

    return () => clearInterval(interval);
  }, [vertexMap]);

  if (!vertexMap) return null;

  return (
    <div className="w-full h-[380px] relative pointer-events-none">
      <Canvas
        camera={{ position: [0, 10, 200], fov: 45 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent', pointerEvents: 'none' }}
        gl={{ alpha: true }}
      >
        <BrainViewerCanvas
          vertexDataA={null}
          vertexDataB={null}
          blendFactor={0}
          regionColors={regionColors}
          autoRotateSpeed={2.0}
        />
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.9}
            luminanceSmoothing={0.4}
            intensity={0.8}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
