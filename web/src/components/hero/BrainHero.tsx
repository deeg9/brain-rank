'use client';

import { Suspense, useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { REGION_COLORS } from '../results/brain-utils';
import type { SegmentRegionScores } from '../results/brain-utils';
import { VERTEX_COUNT } from '@/lib/vertex-codec';

type GLTFNodes = Record<string, THREE.Mesh>;
type NetworkVertexMap = Record<keyof SegmentRegionScores, number[]>;

const NETWORK_KEYS = Object.keys(REGION_COLORS) as (keyof SegmentRegionScores)[];

const BASE_R = 0.75;
const BASE_G = 0.75;
const BASE_B = 0.78;

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

function DecorativeBrainMesh({ reducedMotion }: { reducedMotion: boolean }) {
  const { nodes } = useGLTF('/models/brain-fsaverage5-unified.glb') as unknown as { nodes: GLTFNodes };

  const { clonedGeometry, colorAttr } = useMemo(() => {
    const geo = nodes.brain.geometry.clone();
    const vertexCount = geo.attributes.position.count;
    const colorBuffer = new Float32Array(vertexCount * 3);
    const attr = new THREE.BufferAttribute(colorBuffer, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('color', attr);
    return { clonedGeometry: geo, colorAttr: attr };
  }, [nodes.brain.geometry]);

  const positionsRef = useRef<Float32Array | null>(null);
  const [vertexMap, setVertexMap] = useState<NetworkVertexMap | null>(null);
  const targetRegionsRef = useRef<SegmentRegionScores>(generateRandomRegions());
  const currentRegionsRef = useRef<SegmentRegionScores>(generateRandomRegions());
  const regionColorBuffer = useMemo(() => new Float32Array(VERTEX_COUNT * 3), []);

  useEffect(() => {
    const pos = clonedGeometry.attributes.position;
    if (pos) positionsRef.current = pos.array as Float32Array;
  }, [clonedGeometry]);

  useEffect(() => {
    return () => { clonedGeometry.dispose(); };
  }, [clonedGeometry]);

  // Load network vertex map
  useEffect(() => {
    fetch('/data/network-vertex-map.json')
      .then((r) => r.json())
      .then((data) => setVertexMap(data as NetworkVertexMap))
      .catch(() => {});
  }, []);

  // Cycle random network activations every 800ms
  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      targetRegionsRef.current = generateRandomRegions();
    }, 800);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  useFrame(({ clock }) => {
    const positions = positionsRef.current;
    if (!positions) return;

    const colors = colorAttr.array as Float32Array;
    const t = clock.getElapsedTime();

    if (vertexMap) {
      // Lerp region scores toward targets
      const current = currentRegionsRef.current;
      const target = targetRegionsRef.current;
      const lerpSpeed = 0.06;

      for (const key of NETWORK_KEYS) {
        const noise = (Math.random() - 0.5) * 0.01;
        current[key] += (target[key] - current[key]) * lerpSpeed + noise;
        current[key] = Math.max(0, Math.min(1, current[key]));
      }

      // Build region colors into buffer
      buildRegionColors(current, vertexMap, regionColorBuffer);

      // Apply aurora shimmer on top + copy to vertex colors
      const vertexCount = positions.length / 3;
      for (let i = 0; i < vertexCount; i++) {
        const px = positions[i * 3];
        const py = positions[i * 3 + 1];
        const wave1 = Math.sin(px * 0.06 + t * 1.2);
        const wave2 = Math.sin(py * 0.07 - t * 0.9);
        const shimmer = (wave1 + wave2) * 0.03;

        colors[i * 3]     = regionColorBuffer[i * 3] + shimmer;
        colors[i * 3 + 1] = regionColorBuffer[i * 3 + 1] + shimmer;
        colors[i * 3 + 2] = regionColorBuffer[i * 3 + 2] + shimmer;
      }
    } else {
      // Fallback: monochrome shimmer while vertex map loads
      const vertexCount = positions.length / 3;
      for (let i = 0; i < vertexCount; i++) {
        const px = positions[i * 3];
        const wave = Math.sin(px * 0.05 + t * Math.PI) * 0.5 + 0.5;
        const emissive = 0.12 + wave * 0.06;
        const val = 0.2 + emissive;
        colors[i * 3] = val;
        colors[i * 3 + 1] = val;
        colors[i * 3 + 2] = val;
      }
    }
    colorAttr.needsUpdate = true;
  });

  return (
    <mesh geometry={clonedGeometry}>
      <meshStandardMaterial
        vertexColors
        toneMapped={false}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
}

function SlowRotatingGroup({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    // Slow counterclockwise spin around vertical axis
    if (outerRef.current) outerRef.current.rotation.z -= delta * 0.15;
  });
  // Inner group flips brain upright, outer group spins it like a turntable
  return (
    <group ref={outerRef} rotation={[-Math.PI / 2, 0, 0]}>
      {children}
    </group>
  );
}

export function BrainHero() {
  const glRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    return () => {
      if (glRef.current) {
        const ext = glRef.current.getExtension('WEBGL_lose_context');
        ext?.loseContext();
        glRef.current = null;
      }
    };
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 190], fov: 45 }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => { glRef.current = gl.getContext(); }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.0} />
          <directionalLight position={[5, 5, 5]} intensity={0.7} />
          <directionalLight position={[-3, -2, 4]} intensity={0.35} />
          <SlowRotatingGroup>
            <Center>
              <DecorativeBrainMesh reducedMotion={reducedMotion} />
            </Center>
          </SlowRotatingGroup>
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
    </div>
  );
}

useGLTF.preload('/models/brain-fsaverage5-unified.glb');
