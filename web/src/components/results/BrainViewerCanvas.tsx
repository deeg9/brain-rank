'use client';

import { useGLTF, OrbitControls, Center } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BrainRegionMesh } from './BrainRegionMesh';
import { REGION_COLORS } from './brain-utils';
import type { SegmentRegionScores } from './brain-utils';
import type * as THREE from 'three';

interface BrainViewerCanvasProps {
  regionScores: SegmentRegionScores | null;
}

const REGION_NAMES = ['attention', 'reward', 'emotional_processing', 'social_cognition'] as const;

type GLTFNodes = Record<string, THREE.Mesh>;

export function BrainViewerCanvas({ regionScores }: BrainViewerCanvasProps) {
  const { nodes } = useGLTF('/models/brain-fsaverage5.glb') as unknown as { nodes: GLTFNodes };

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[5, 5, 5]} intensity={0.3} />

      <Center>
        <group>
          {REGION_NAMES.map((name) => {
            const node = nodes[name];
            if (!node?.geometry) return null;
            const score = regionScores?.[name] ?? 0;
            return (
              <BrainRegionMesh
                key={name}
                geometry={node.geometry}
                score={score}
                color={REGION_COLORS[name]}
              />
            );
          })}
          {nodes.base?.geometry && (
            <BrainRegionMesh
              geometry={nodes.base.geometry}
              score={0}
              color="#1a1a2e"
              isBase
            />
          )}
        </group>
      </Center>

      <OrbitControls
        enablePan={false}
        minDistance={120}
        maxDistance={350}
        autoRotate
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.05}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.5}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

useGLTF.preload('/models/brain-fsaverage5.glb');
