'use client';

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { VERTEX_COUNT } from '@/lib/vertex-codec';
import { buildColormapLUT, applyThresholdGlow } from '@/lib/colormap';

type BaseProps = {
  onHoverVertex?: (vertexIndex: number | null, clientX: number, clientY: number) => void;
};

type PerVertexProps = BaseProps & {
  vertexDataA: Float32Array;
  vertexDataB?: Float32Array | null;
  blendFactor?: number;
  regionColors?: never;
};

type RegionProps = BaseProps & {
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
  const { onHoverVertex } = props;
  const { nodes } = useGLTF('/models/brain-fsaverage5-unified.glb') as unknown as { nodes: GLTFNodes };

  const isRegionMode = 'regionColors' in props && !!props.regionColors;

  const lutData = useMemo(() => buildColormapLUT('inferno'), []);
  const lerpBuffer = useMemo(() => new Float32Array(VERTEX_COUNT), []);
  const colorBuffer = useMemo(() => new Float32Array(VERTEX_COUNT * 3), []);

  const colorAttr = useMemo(() => {
    const attr = new THREE.BufferAttribute(colorBuffer, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    return attr;
  }, [colorBuffer]);

  const clonedGeometry = useMemo(() => {
    const geo = nodes.brain.geometry.clone();
    geo.setAttribute('color', colorAttr);
    return geo;
  }, [nodes.brain.geometry, colorAttr]);

  useEffect(() => {
    return () => { clonedGeometry.dispose(); };
  }, [clonedGeometry]);

  const needsColorUpdate = useRef(true);

  useEffect(() => {
    if (isRegionMode) {
      const src = props.regionColors!;
      colorBuffer.set(src);
    } else {
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

  // Find closest vertex from a face intersection
  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!onHoverVertex) return;
    e.stopPropagation();

    const face = e.face;
    if (!face) {
      onHoverVertex(null, 0, 0);
      return;
    }

    // Find which of the 3 face vertices is closest to the hit point
    const position = clonedGeometry.attributes.position;
    const point = e.point;
    const vA = new THREE.Vector3().fromBufferAttribute(position, face.a);
    const vB = new THREE.Vector3().fromBufferAttribute(position, face.b);
    const vC = new THREE.Vector3().fromBufferAttribute(position, face.c);

    // Transform vertices by the mesh's world matrix to match hit point space
    const mesh = e.object as THREE.Mesh;
    vA.applyMatrix4(mesh.matrixWorld);
    vB.applyMatrix4(mesh.matrixWorld);
    vC.applyMatrix4(mesh.matrixWorld);

    const dA = point.distanceToSquared(vA);
    const dB = point.distanceToSquared(vB);
    const dC = point.distanceToSquared(vC);

    let closestIdx = face.a;
    if (dB < dA && dB < dC) closestIdx = face.b;
    else if (dC < dA && dC < dB) closestIdx = face.c;

    onHoverVertex(closestIdx, e.nativeEvent.clientX, e.nativeEvent.clientY);
  }, [onHoverVertex, clonedGeometry]);

  const handlePointerOut = useCallback(() => {
    if (onHoverVertex) onHoverVertex(null, 0, 0);
  }, [onHoverVertex]);

  return (
    <mesh
      geometry={clonedGeometry}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
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
