'use client';

import { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Center } from '@react-three/drei';
import { BrainGlowMesh } from './BrainGlowMesh';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

interface BrainViewerCanvasProps {
  vertexDataA: Float32Array | null;
  vertexDataB: Float32Array | null;
  blendFactor: number;
  regionColors: Float32Array | null;
  locked?: boolean;
  autoRotateSpeed?: number;
  onHoverVertex?: (vertexIndex: number | null, clientX: number, clientY: number) => void;
}

export interface BrainViewerCanvasHandle {
  setView: (position: [number, number, number]) => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

const IDLE_TIMEOUT_MS = 3000;
const AUTO_ROTATE_SPEED = 0.5;

const CAMERA_DISTANCE = 190;
const ZOOM_STEP = 40;
const MIN_DISTANCE = 100;
const MAX_DISTANCE = 400;

export const BrainViewerCanvas = forwardRef<BrainViewerCanvasHandle, BrainViewerCanvasProps>(
  function BrainViewerCanvas({ vertexDataA, vertexDataB, blendFactor, regionColors, locked, autoRotateSpeed: autoRotateSpeedProp, onHoverVertex }, ref) {
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const { camera } = useThree();
    const [isIdle, setIsIdle] = useState(false);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetIdleTimer = useCallback(() => {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT_MS);
    }, []);

    useEffect(() => {
      const timer = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
      return () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      setView(position: [number, number, number]) {
        camera.position.set(...position);
        camera.lookAt(0, 0, 0);
        controlsRef.current?.target.set(0, 0, 0);
        controlsRef.current?.update();
        resetIdleTimer();
      },
      zoomIn() {
        const dir = camera.position.clone().normalize();
        const dist = Math.max(MIN_DISTANCE, camera.position.length() - ZOOM_STEP);
        camera.position.copy(dir.multiplyScalar(dist));
        controlsRef.current?.update();
        resetIdleTimer();
      },
      zoomOut() {
        const dir = camera.position.clone().normalize();
        const dist = Math.min(MAX_DISTANCE, camera.position.length() + ZOOM_STEP);
        camera.position.copy(dir.multiplyScalar(dist));
        controlsRef.current?.update();
        resetIdleTimer();
      },
    }), [camera, resetIdleTimer]);

    return (
      <>
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} />
        <directionalLight position={[-3, -2, 4]} intensity={0.35} />

        <Center>
          <group rotation={[-Math.PI / 2, 0, 0]}>
            {vertexDataA ? (
              <BrainGlowMesh vertexDataA={vertexDataA} vertexDataB={vertexDataB} blendFactor={blendFactor} onHoverVertex={onHoverVertex} />
            ) : regionColors ? (
              <BrainGlowMesh regionColors={regionColors} onHoverVertex={onHoverVertex} />
            ) : null}
          </group>
        </Center>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableRotate={!locked}
          enableZoom={!locked}
          minDistance={MIN_DISTANCE}
          maxDistance={MAX_DISTANCE}
          autoRotate={!locked && isIdle}
          autoRotateSpeed={autoRotateSpeedProp ?? AUTO_ROTATE_SPEED}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.8}
          onStart={resetIdleTimer}
        />
      </>
    );
  }
);

useGLTF.preload('/models/brain-fsaverage5-unified.glb');
