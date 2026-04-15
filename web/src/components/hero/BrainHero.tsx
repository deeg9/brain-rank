'use client';

import { Suspense, useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

type GLTFNodes = Record<string, THREE.Mesh>;

function DecorativeBrainMesh() {
  const { nodes } = useGLTF('/models/brain-fsaverage5-unified.glb') as unknown as { nodes: GLTFNodes };

  const { clonedGeometry, colorAttr } = useMemo(() => {
    const geo = nodes.brain.geometry.clone();
    const vertexCount = geo.attributes.position.count;
    const colorBuffer = new Float32Array(vertexCount * 3);
    const attr = new THREE.BufferAttribute(colorBuffer, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('color', attr);
    return { clonedGeometry: geo, colorAttr: attr };
  }, [nodes.brain.geometry]);

  const positionsRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    const pos = clonedGeometry.attributes.position;
    if (pos) {
      positionsRef.current = pos.array as Float32Array;
    }
  }, [clonedGeometry]);

  useEffect(() => {
    return () => { clonedGeometry.dispose(); };
  }, [clonedGeometry]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const positions = positionsRef.current;
    if (!positions) return;

    const colors = colorAttr.array as Float32Array;
    const vertexCount = positions.length / 3;

    for (let i = 0; i < vertexCount; i++) {
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      const wave = Math.sin(px * 0.05 + t * Math.PI) * 0.5 + 0.5;
      const emissive = 0.12 + wave * 0.06;
      const val = 0.2 + emissive;
      colors[i * 3] = val;
      colors[i * 3 + 1] = val;
      colors[i * 3 + 2] = val;
    }
    colorAttr.needsUpdate = true;
  });

  return (
    <mesh geometry={clonedGeometry}>
      <meshStandardMaterial
        vertexColors
        toneMapped={false}
        roughness={0.7}
        metalness={0.1}
        emissive="#ffffff"
        emissiveIntensity={0.15}
        color="#333333"
      />
    </mesh>
  );
}

function RotatingGroup({ children, reducedMotion }: { children: React.ReactNode; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current && !reducedMotion) ref.current.rotation.y += delta * 0.3;
  });
  return <group ref={ref} rotation={[-Math.PI / 2, 0, 0]}>{children}</group>;
}

export function BrainHero() {
  const glRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    return () => {
      if (glRef.current) {
        const ext = glRef.current.getExtension('WEBGL_lose_context');
        ext?.loseContext();
        glRef.current = null;
      }
    };
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 190], fov: 45 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => { glRef.current = gl.getContext(); }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} color="#ffffff" />
          <pointLight position={[2, 3, 4]} intensity={0.8} color="#ffffff" />
          <Center>
            <RotatingGroup reducedMotion={reducedMotion}>
              <DecorativeBrainMesh />
            </RotatingGroup>
          </Center>
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.6}
              luminanceSmoothing={0.4}
              intensity={1.5}
              radius={0.8}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/brain-fsaverage5-unified.glb');
