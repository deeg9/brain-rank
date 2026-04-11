'use client';

import { useRef } from 'react';
import { useGLTF, OrbitControls, Center } from '@react-three/drei';
import { BrainGlowMesh } from './BrainGlowMesh';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface BrainViewerCanvasProps {
  vertexDataA: Float32Array | null;
  vertexDataB: Float32Array | null;
  blendFactor: number;
}

export function BrainViewerCanvas({ vertexDataA, vertexDataB, blendFactor }: BrainViewerCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />
      <directionalLight position={[-3, -2, 4]} intensity={0.15} />

      <Center>
        {/* Rotate -90deg on X to convert neuroimaging Z-up to Three.js Y-up */}
        <group rotation={[-Math.PI / 2, 0, 0]}>
          {vertexDataA && <BrainGlowMesh vertexDataA={vertexDataA} vertexDataB={vertexDataB} blendFactor={blendFactor} />}
        </group>
      </Center>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={100}
        maxDistance={400}
        autoRotate={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.8}
      />
    </>
  );
}

useGLTF.preload('/models/brain-fsaverage5-unified.glb');
