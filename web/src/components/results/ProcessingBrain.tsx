'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BrainViewerCanvas } from './BrainViewerCanvas';
import { REGION_COLORS } from './brain-utils';
import type { SegmentRegionScores } from './brain-utils';
import { VERTEX_COUNT } from '@/lib/vertex-codec';

type NetworkVertexMap = Record<keyof SegmentRegionScores, number[]>;

const NETWORK_KEYS = Object.keys(REGION_COLORS) as (keyof SegmentRegionScores)[];

// Lighter/whiter base so colors pop more
const BASE_R = 0.93;
const BASE_G = 0.93;
const BASE_B = 0.95;

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

    const t = Math.max(0.4, Math.min(1, score * 2.5));
    const emissiveBoost = score > 0.2 ? 1.0 + (score - 0.2) * 2.5 : 1.0;

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
    regions[key] = 0.05 + Math.random() * 0.15; // baseline flicker
  }
  for (let i = 0; i < activeCount; i++) {
    regions[shuffled[i]] = 0.5 + Math.random() * 0.5; // bright activation (0.5-1.0)
  }
  return regions;
}

const CAMERA_DISTANCE = 200;

function CameraLock() {
  const { camera } = useThree();
  useFrame(() => {
    const dir = camera.position.clone().normalize();
    camera.position.copy(dir.multiplyScalar(CAMERA_DISTANCE));
  });
  return null;
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

  // Generate new random targets every 800ms — frequent enough to never look frozen
  useEffect(() => {
    const interval = setInterval(() => {
      targetRegionsRef.current = generateRandomRegions();
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Smooth lerp animation at ~30fps — runs forever
  useEffect(() => {
    if (!vertexMap) return;

    const buf = new Float32Array(VERTEX_COUNT * 3);
    regionColorsRef.current = buf;
    let frameId: number;

    let frameCount = 0;

    const animate = () => {
      const current = currentRegionsRef.current;
      const target = targetRegionsRef.current;
      const lerpSpeed = 0.06;

      for (const key of NETWORK_KEYS) {
        // Add subtle noise so it never fully converges
        const noise = (Math.random() - 0.5) * 0.01;
        current[key] += (target[key] - current[key]) * lerpSpeed + noise;
        current[key] = Math.max(0, Math.min(1, current[key]));
      }

      buildRegionColors(current, vertexMap, buf);

      // Update React state every 6th frame (~10fps) to keep the animation
      // alive without overwhelming Turbopack's dev instrumentation.
      frameCount++;
      if (frameCount % 6 === 0) {
        try {
          setRegionColors(new Float32Array(buf));
        } catch {
          // Turbopack DataCloneError in dev — ignore, animation continues
        }
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
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
        {/* Lock camera distance so brain doesn't zoom in/out during rotation */}
        <CameraLock />
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
