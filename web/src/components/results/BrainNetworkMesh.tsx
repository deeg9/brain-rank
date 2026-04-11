'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { VERTEX_COUNT } from '@/lib/vertex-codec';
import { REGION_COLORS } from './brain-utils';
import type { SegmentRegionScores } from './brain-utils';

interface BrainNetworkMeshProps {
  regionScores: SegmentRegionScores | null;
  visibleRegions: Record<keyof SegmentRegionScores, boolean>;
}

type NetworkVertexMap = Record<keyof SegmentRegionScores, number[]>;
type GLTFNodes = Record<string, THREE.Mesh>;

const BASE_COLOR: [number, number, number] = [0.102, 0.102, 0.18]; // #1a1a2e

function hexToRGB(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

// Cache parsed colors
const REGION_RGB: Record<string, [number, number, number]> = {};
for (const [key, hex] of Object.entries(REGION_COLORS)) {
  REGION_RGB[key] = hexToRGB(hex);
}

export function BrainNetworkMesh({ regionScores, visibleRegions }: BrainNetworkMeshProps) {
  const { nodes } = useGLTF('/models/brain-fsaverage5-unified.glb') as unknown as { nodes: GLTFNodes };
  const [vertexMap, setVertexMap] = useState<NetworkVertexMap | null>(null);

  // Fetch network-vertex-map.json once
  useEffect(() => {
    fetch('/data/network-vertex-map.json')
      .then((res) => res.json())
      .then((data: NetworkVertexMap) => setVertexMap(data))
      .catch((err) => console.error('Failed to load network vertex map:', err));
  }, []);

  // Clone geometry once so we don't mutate the cached original
  const clonedGeometry = useMemo(() => {
    return nodes.brain.geometry.clone();
  }, [nodes.brain.geometry]);

  // Pre-allocate color buffer
  const colorBuffer = useMemo(() => new Float32Array(VERTEX_COUNT * 3), []);

  // Set up the color attribute on the cloned geometry
  useMemo(() => {
    clonedGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colorBuffer, 3),
    );
  }, [clonedGeometry, colorBuffer]);

  // Update colors when scores, visibility, or vertex map changes
  useEffect(() => {
    if (!vertexMap) return;

    // Fill with base color
    for (let i = 0; i < VERTEX_COUNT; i++) {
      colorBuffer[i * 3] = BASE_COLOR[0];
      colorBuffer[i * 3 + 1] = BASE_COLOR[1];
      colorBuffer[i * 3 + 2] = BASE_COLOR[2];
    }

    // Track best score per vertex for overlap handling
    const bestScore = new Float32Array(VERTEX_COUNT);

    const networks = Object.keys(REGION_COLORS) as Array<keyof SegmentRegionScores>;

    for (const network of networks) {
      if (!visibleRegions[network]) continue;

      const indices = vertexMap[network];
      if (!indices) continue;

      const score = regionScores?.[network] ?? 0;
      const rgb = REGION_RGB[network];

      // Blend color intensity with score (min 0.15 so visible networks always show)
      const intensity = Math.max(0.15, score);

      for (const idx of indices) {
        if (idx >= VERTEX_COUNT) continue;

        // For overlapping vertices, use the network with the highest score
        if (score > bestScore[idx]) {
          bestScore[idx] = score;
          colorBuffer[idx * 3] = rgb[0] * intensity;
          colorBuffer[idx * 3 + 1] = rgb[1] * intensity;
          colorBuffer[idx * 3 + 2] = rgb[2] * intensity;
        }
      }
    }

    const attr = clonedGeometry.attributes.color as THREE.BufferAttribute;
    if (attr) {
      attr.needsUpdate = true;
    }
  }, [regionScores, visibleRegions, vertexMap, colorBuffer, clonedGeometry]);

  // Compute max visible score for emissive glow
  const maxScore = useMemo(() => {
    if (!regionScores) return 0;
    const networks = Object.keys(REGION_COLORS) as Array<keyof SegmentRegionScores>;
    let max = 0;
    for (const network of networks) {
      if (visibleRegions[network]) {
        max = Math.max(max, regionScores[network] ?? 0);
      }
    }
    return max;
  }, [regionScores, visibleRegions]);

  return (
    <mesh geometry={clonedGeometry}>
      <meshStandardMaterial
        vertexColors
        roughness={0.6}
        metalness={0.2}
        emissive="#1a1a2e"
        emissiveIntensity={maxScore * 2.0}
      />
    </mesh>
  );
}

useGLTF.preload('/models/brain-fsaverage5-unified.glb');
