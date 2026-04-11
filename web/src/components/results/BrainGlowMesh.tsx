'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { VERTEX_COUNT } from '@/lib/vertex-codec';
import { buildColormapLUT, applyThresholdGlow } from '@/lib/colormap';

interface BrainGlowMeshProps {
  vertexDataA: Float32Array;          // Current segment's decoded vertex data
  vertexDataB: Float32Array | null;   // Next segment's decoded vertex data (null = no lerp)
  blendFactor: number;                // 0.0-1.0, from BrainViewer
}

/**
 * Linearly interpolate two vertex arrays into a pre-allocated output buffer.
 * No allocations -- writes directly into `out`.
 */
function lerpVertexData(
  a: Float32Array,
  b: Float32Array,
  t: number,
  out: Float32Array,
): void {
  for (let i = 0; i < a.length; i++) {
    out[i] = a[i] + (b[i] - a[i]) * t;
  }
}

type GLTFNodes = Record<string, THREE.Mesh>;

export function BrainGlowMesh({ vertexDataA, vertexDataB, blendFactor }: BrainGlowMeshProps) {
  const { nodes } = useGLTF('/models/brain-fsaverage5-unified.glb') as unknown as { nodes: GLTFNodes };

  // Build 256-entry LUT once (inferno colormap for threshold glow)
  const lutData = useMemo(() => buildColormapLUT('inferno'), []);

  // Pre-allocate lerp buffer for blending between segments (never allocate in render loop)
  const lerpBuffer = useMemo(() => new Float32Array(VERTEX_COUNT), []);

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
    if (blendFactor > 0 && vertexDataB !== null) {
      // Lerp between current and next segment into pre-allocated buffer
      lerpVertexData(vertexDataA, vertexDataB, blendFactor, lerpBuffer);
      applyThresholdGlow(lerpBuffer, lutData, colorBuffer);
    } else {
      // No blending needed -- use current segment directly
      applyThresholdGlow(vertexDataA, lutData, colorBuffer);
    }
    needsColorUpdate.current = true;
  }, [vertexDataA, vertexDataB, blendFactor, lutData, colorBuffer, lerpBuffer]);

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
        toneMapped={false}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
}

useGLTF.preload('/models/brain-fsaverage5-unified.glb');
