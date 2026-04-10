'use client';

import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { VERTEX_COUNT } from '@/lib/vertex-codec';
import { applyColormap } from '@/lib/colormap';
import type { ColormapName } from '@/lib/colormap';

interface BrainHeatmapMeshProps {
  vertexData: Float32Array; // 20,484 normalized values from decodeVertexData
  colormap: ColormapName;
}

type GLTFNodes = Record<string, THREE.Mesh>;

export function BrainHeatmapMesh({ vertexData, colormap }: BrainHeatmapMeshProps) {
  const { nodes } = useGLTF('/models/brain-fsaverage5-unified.glb') as unknown as { nodes: GLTFNodes };

  // Clone geometry once so we don't mutate the cached original
  const clonedGeometry = useMemo(() => {
    const geo = nodes.brain.geometry.clone();
    return geo;
  }, [nodes.brain.geometry]);

  // Pre-allocate color buffer (never allocate in render loop)
  const colorBuffer = useMemo(() => new Float32Array(VERTEX_COUNT * 3), []);

  // Set up the color attribute on the cloned geometry
  useMemo(() => {
    clonedGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colorBuffer, 3),
    );
  }, [clonedGeometry, colorBuffer]);

  // Update colors only when vertexData or colormap changes
  useEffect(() => {
    applyColormap(vertexData, colormap, colorBuffer);
    const attr = clonedGeometry.attributes.color as THREE.BufferAttribute;
    if (attr) {
      attr.needsUpdate = true;
    }
  }, [vertexData, colormap, colorBuffer, clonedGeometry]);

  return (
    <mesh geometry={clonedGeometry}>
      <meshStandardMaterial
        vertexColors
        roughness={0.6}
        metalness={0.2}
      />
    </mesh>
  );
}

useGLTF.preload('/models/brain-fsaverage5-unified.glb');
