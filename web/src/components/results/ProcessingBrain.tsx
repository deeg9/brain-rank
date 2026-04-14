'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BrainViewerCanvas } from './BrainViewerCanvas';
import { REGION_COLORS } from './brain-utils';
import type { SegmentRegionScores } from './brain-utils';
import { VERTEX_COUNT } from '@/lib/vertex-codec';

type NetworkVertexMap = Record<keyof SegmentRegionScores, number[]>;

const NETWORK_KEYS = Object.keys(REGION_COLORS) as (keyof SegmentRegionScores)[];

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
  const activeCount = 2 + Math.floor(Math.random() * 3);
  const shuffled = [...NETWORK_KEYS].sort(() => Math.random() - 0.5);

  for (const key of NETWORK_KEYS) {
    regions[key] = 0.05 + Math.random() * 0.15;
  }
  for (let i = 0; i < activeCount; i++) {
    regions[shuffled[i]] = 0.5 + Math.random() * 0.5;
  }
  return regions;
}

/**
 * Inner component that runs inside the Canvas.
 * Uses useFrame for animation — zero React re-renders.
 */
function AnimatedBrainScene({ vertexMap }: { vertexMap: NetworkVertexMap }) {
  const bufRef = useRef(new Float32Array(VERTEX_COUNT * 3));
  const snapshotRef = useRef<Float32Array | null>(null);
  const targetRegionsRef = useRef<SegmentRegionScores>(generateRandomRegions());
  const currentRegionsRef = useRef<SegmentRegionScores>(generateRandomRegions());
  const lastTargetChangeRef = useRef(0);
  const lastSnapshotRef = useRef(0);
  const [regionColors, setRegionColors] = useState<Float32Array | null>(null);

  // Use useFrame for the animation — this runs inside R3F's loop,
  // NOT in React's reconciliation cycle, so no DataCloneError.
  useFrame((_state, _delta) => {
    const now = performance.now();

    // Generate new random targets every 800ms
    if (now - lastTargetChangeRef.current > 800) {
      lastTargetChangeRef.current = now;
      targetRegionsRef.current = generateRandomRegions();
    }

    // Smooth lerp every frame
    const current = currentRegionsRef.current;
    const target = targetRegionsRef.current;
    const lerpSpeed = 0.06;

    for (const key of NETWORK_KEYS) {
      const noise = (Math.random() - 0.5) * 0.01;
      current[key] += (target[key] - current[key]) * lerpSpeed + noise;
      current[key] = Math.max(0, Math.min(1, current[key]));
    }

    buildRegionColors(current, vertexMap, bufRef.current);

    // Snapshot to React state only every 500ms (just for BrainGlowMesh's useEffect).
    // BrainGlowMesh's useFrame shimmer reads from its internal buffer, so this
    // infrequent update is only needed to set the base colors.
    if (now - lastSnapshotRef.current > 500) {
      lastSnapshotRef.current = now;
      const snap = new Float32Array(bufRef.current);
      snapshotRef.current = snap;
      setRegionColors(snap);
    }
  });

  return (
    <>
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
    </>
  );
}

export function ProcessingBrain() {
  const [vertexMap, setVertexMap] = useState<NetworkVertexMap | null>(null);
  const glRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);

  // Explicit WebGL cleanup on unmount
  useEffect(() => {
    return () => {
      if (glRef.current) {
        const ext = glRef.current.getExtension('WEBGL_lose_context');
        ext?.loseContext();
        glRef.current = null;
      }
    };
  }, []);

  // Load vertex map
  useEffect(() => {
    fetch('/data/network-vertex-map.json')
      .then((r) => r.json())
      .then((data) => setVertexMap(data as NetworkVertexMap))
      .catch(() => {});
  }, []);

  if (!vertexMap) return null;

  return (
    <div className="w-full h-[380px] relative pointer-events-none">
      <Canvas
        camera={{ position: [0, 10, 200], fov: 45 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent', pointerEvents: 'none' }}
        gl={{ alpha: true }}
        onCreated={({ gl }) => { glRef.current = gl.getContext(); }}
      >
        <AnimatedBrainScene vertexMap={vertexMap} />
      </Canvas>
    </div>
  );
}
