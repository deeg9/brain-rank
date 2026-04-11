'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { VERTEX_COUNT } from '@/lib/vertex-codec';
import { buildColormapLUT, applyColormapFromLUT } from '@/lib/colormap';

interface BrainGlowMeshProps {
  vertexData: Float32Array; // 20,484 normalized values from decodeVertexData
}

type GLTFNodes = Record<string, THREE.Mesh>;

export function BrainGlowMesh({ vertexData }: BrainGlowMeshProps) {
  const { nodes } = useGLTF('/models/brain-fsaverage5-unified.glb') as unknown as { nodes: GLTFNodes };

  // Build 256-entry LUT once (hardcoded plasma colormap)
  const lutData = useMemo(() => buildColormapLUT('plasma'), []);

  // Pre-allocate color buffer (never allocate in render loop)
  const colorBuffer = useMemo(() => new Float32Array(VERTEX_COUNT * 3), []);

  // Create color attribute with DynamicDrawUsage for frequent GPU uploads
  const colorAttr = useMemo(() => {
    const attr = new THREE.BufferAttribute(colorBuffer, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    return attr;
  }, [colorBuffer]);

  // Clone geometry once so we don't mutate the cached original
  const clonedGeometry = useMemo(() => {
    const geo = nodes.brain.geometry.clone();
    geo.setAttribute('color', colorAttr);
    return geo;
  }, [nodes.brain.geometry, colorAttr]);

  // Dispose cloned geometry on unmount or when geometry changes (GPU memory cleanup)
  useEffect(() => {
    return () => {
      clonedGeometry.dispose();
    };
  }, [clonedGeometry]);

  // Dirty flag for GPU sync via useFrame
  const needsColorUpdate = useRef(true);

  // Update color data when inputs change, mark dirty for GPU upload
  useEffect(() => {
    applyColormapFromLUT(vertexData, lutData, colorBuffer);
    needsColorUpdate.current = true;
  }, [vertexData, lutData, colorBuffer]);

  // Sync dirty flag to GPU inside the render loop (not useEffect)
  useFrame(() => {
    if (needsColorUpdate.current && colorAttr) {
      colorAttr.needsUpdate = true;
      needsColorUpdate.current = false;
    }
  });

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
