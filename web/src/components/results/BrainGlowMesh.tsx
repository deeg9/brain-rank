'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { VERTEX_COUNT } from '@/lib/vertex-codec';
import { buildColormapLUT, applyThresholdGlow } from '@/lib/colormap';

/**
 * BrainGlowMesh supports two rendering modes:
 *
 * 1. Per-vertex mode (vertexDataA provided): Uses threshold glow with inferno
 *    colormap. This is the full-fidelity path when per-vertex activation data
 *    is available from the inference pipeline.
 *
 * 2. Region mode (regionColors provided): Uses pre-computed RGB color buffer
 *    from network-vertex-map.json. Each functional network's vertices are
 *    painted with that network's color scaled by its activation score.
 */

type PerVertexProps = {
  vertexDataA: Float32Array;
  vertexDataB?: Float32Array | null;
  blendFactor?: number;
  regionColors?: never;
};

type RegionProps = {
  regionColors: Float32Array;
  vertexDataA?: never;
  vertexDataB?: never;
  blendFactor?: never;
};

type BrainGlowMeshProps = PerVertexProps | RegionProps;

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

export function BrainGlowMesh(props: BrainGlowMeshProps) {
  const { nodes } = useGLTF('/models/brain-fsaverage5-unified.glb') as unknown as { nodes: GLTFNodes };

  const isRegionMode = 'regionColors' in props && !!props.regionColors;

  // Build 256-entry LUT once (inferno colormap for per-vertex mode)
  const lutData = useMemo(() => buildColormapLUT('inferno'), []);

  // Pre-allocate lerp buffer for per-vertex blending
  const lerpBuffer = useMemo(() => new Float32Array(VERTEX_COUNT), []);

  // Pre-allocate color buffer
  const colorBuffer = useMemo(() => new Float32Array(VERTEX_COUNT * 3), []);

  // Create color attribute with DynamicDrawUsage for frequent GPU uploads
  const colorAttr = useMemo(() => {
    const attr = new THREE.BufferAttribute(colorBuffer, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    return attr;
  }, [colorBuffer]);

  // Clone geometry once
  const clonedGeometry = useMemo(() => {
    const geo = nodes.brain.geometry.clone();
    geo.setAttribute('color', colorAttr);
    return geo;
  }, [nodes.brain.geometry, colorAttr]);

  useEffect(() => {
    return () => { clonedGeometry.dispose(); };
  }, [clonedGeometry]);

  const needsColorUpdate = useRef(true);

  // Update colors when inputs change
  useEffect(() => {
    if (isRegionMode) {
      // Region mode: copy pre-computed RGB directly into color buffer
      const src = props.regionColors!;
      colorBuffer.set(src);
    } else {
      // Per-vertex mode: threshold glow with optional lerp
      const { vertexDataA, vertexDataB, blendFactor = 0 } = props as PerVertexProps;
      if (blendFactor > 0 && vertexDataB) {
        lerpVertexData(vertexDataA, vertexDataB, blendFactor, lerpBuffer);
        applyThresholdGlow(lerpBuffer, lutData, colorBuffer);
      } else {
        applyThresholdGlow(vertexDataA, lutData, colorBuffer);
      }
    }
    needsColorUpdate.current = true;
  }, [isRegionMode, props, lutData, colorBuffer, lerpBuffer]);

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
