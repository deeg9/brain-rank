'use client';

import { useRef } from 'react';
import { useGLTF, OrbitControls, Center } from '@react-three/drei';
import { BrainGlowMesh } from './BrainGlowMesh';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface BrainViewerCanvasProps {
  vertexData: Float32Array | null;
}

export function BrainViewerCanvas({ vertexData }: BrainViewerCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />
      <directionalLight position={[-3, -2, 4]} intensity={0.15} />

      <Center>
        {/* Rotate -90deg on X to convert neuroimaging Z-up to Three.js Y-up */}
        <group rotation={[-Math.PI / 2, 0, 0]}>
          {vertexData && <BrainGlowMesh vertexData={vertexData} />}
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
