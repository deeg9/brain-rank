'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
import { useGLTF, OrbitControls, Center } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BrainRegionMesh } from './BrainRegionMesh';
import { BrainHeatmapMesh } from './BrainHeatmapMesh';
import { REGION_COLORS } from './brain-utils';
import type { SegmentRegionScores } from './brain-utils';
import type { ColormapName } from '@/lib/colormap';
import type * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface BrainViewerCanvasProps {
  regionScores: SegmentRegionScores | null;
  visibleRegions: Record<keyof SegmentRegionScores, boolean>;
  viewMode: 'heatmap' | 'regions';
  colormap: ColormapName;
  vertexData: Float32Array | null;
}

export interface BrainViewerCanvasHandle {
  viewFront: () => void;
  viewTop: () => void;
  viewLeft: () => void;
  viewRight: () => void;
  resetView: () => void;
}

const REGION_NAMES = ['attention', 'reward', 'emotional_processing', 'social_cognition'] as const;

type GLTFNodes = Record<string, THREE.Mesh>;

export const BrainViewerCanvas = forwardRef<BrainViewerCanvasHandle, BrainViewerCanvasProps>(
  function BrainViewerCanvas({ regionScores, visibleRegions, viewMode, colormap, vertexData }, ref) {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const { nodes } = useGLTF('/models/brain-fsaverage5.glb') as unknown as { nodes: GLTFNodes };

    useImperativeHandle(ref, () => ({
      viewFront: () => {
        const controls = controlsRef.current;
        if (!controls) return;
        controls.setAzimuthalAngle(0);
        controls.setPolarAngle(Math.PI / 2);
      },
      viewTop: () => {
        const controls = controlsRef.current;
        if (!controls) return;
        controls.setAzimuthalAngle(0);
        controls.setPolarAngle(0.01); // near top-down
      },
      viewLeft: () => {
        const controls = controlsRef.current;
        if (!controls) return;
        controls.setAzimuthalAngle(-Math.PI / 2);
        controls.setPolarAngle(Math.PI / 2);
      },
      viewRight: () => {
        const controls = controlsRef.current;
        if (!controls) return;
        controls.setAzimuthalAngle(Math.PI / 2);
        controls.setPolarAngle(Math.PI / 2);
      },
      resetView: () => {
        const controls = controlsRef.current;
        if (!controls) return;
        controls.setAzimuthalAngle(0);
        controls.setPolarAngle(Math.PI / 2);
      },
    }));

    return (
      <>
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 5, 5]} intensity={0.4} />
        <directionalLight position={[-3, -2, 4]} intensity={0.15} />

        <Center>
          {/* Rotate -90° on X to convert neuroimaging Z-up to Three.js Y-up */}
          <group rotation={[-Math.PI / 2, 0, 0]}>
            {viewMode === 'heatmap' && vertexData ? (
              <BrainHeatmapMesh vertexData={vertexData} colormap={colormap} />
            ) : (
              <>
                {REGION_NAMES.map((name) => {
                  const node = nodes[name];
                  if (!node?.geometry) return null;
                  if (!visibleRegions[name]) return null;
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
              </>
            )}
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

        {viewMode === 'regions' && (
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              intensity={1.5}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </>
    );
  }
);

useGLTF.preload('/models/brain-fsaverage5.glb');
useGLTF.preload('/models/brain-fsaverage5-unified.glb');
