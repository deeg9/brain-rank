'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BrainRegionMeshProps {
  geometry: THREE.BufferGeometry;
  score: number;
  color: string;
  isBase?: boolean;
}

export function BrainRegionMesh({ geometry, score, color, isBase = false }: BrainRegionMeshProps) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const targetIntensity = isBase ? 0.05 : score * 2.5;

  useFrame((_, delta) => {
    if (matRef.current) {
      const lerp = 1 - Math.pow(0.001, delta);
      matRef.current.emissiveIntensity +=
        (targetIntensity - matRef.current.emissiveIntensity) * lerp;
    }
  });

  if (isBase) {
    return (
      <mesh geometry={geometry}>
        <meshStandardMaterial
          ref={matRef}
          color="#0d0d1a"
          emissive="#1a1a2e"
          emissiveIntensity={0.05}
          roughness={0.8}
          metalness={0.1}
          transparent
          opacity={0.4}
        />
      </mesh>
    );
  }

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        ref={matRef}
        color="#1a1a2e"
        emissive={color}
        emissiveIntensity={0}
        roughness={0.6}
        metalness={0.3}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}
