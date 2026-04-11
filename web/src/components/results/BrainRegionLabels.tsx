'use client';

import { useMemo } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { REGION_COLORS } from './brain-utils';
import type { SegmentRegionScores } from '@/components/results/SegmentTable';
import type { NetworkVertexMap } from './BrainViewer';

const NETWORK_SHORT_LABELS: Record<keyof SegmentRegionScores, string> = {
  attention: 'Attention',
  reward: 'Reward',
  emotional_processing: 'Emotion',
  social_cognition: 'Social',
  visual_processing: 'Visual',
  auditory_processing: 'Auditory',
  language_narrative: 'Language',
  default_mode: 'Default Mode',
  motion_processing: 'Motion',
};

// Only show labels for the most prominent networks (skip default_mode - deep/medial)
const VISIBLE_NETWORKS: (keyof SegmentRegionScores)[] = [
  'attention',
  'reward',
  'emotional_processing',
  'social_cognition',
  'visual_processing',
  'auditory_processing',
  'language_narrative',
  'motion_processing',
];

interface BrainRegionLabelsProps {
  vertexMap: NetworkVertexMap;
  regions: SegmentRegionScores | null;
}

type GLTFNodes = Record<string, THREE.Mesh>;

export function BrainRegionLabels({ vertexMap, regions }: BrainRegionLabelsProps) {
  const { nodes } = useGLTF('/models/brain-fsaverage5-unified.glb') as unknown as { nodes: GLTFNodes };

  // Compute centroid of each network's vertices — runs once when vertexMap changes
  const centroids = useMemo(() => {
    const position = nodes.brain.geometry.attributes.position;
    const result: Partial<Record<keyof SegmentRegionScores, THREE.Vector3>> = {};

    for (const network of VISIBLE_NETWORKS) {
      const indices = vertexMap[network];
      if (!indices || indices.length === 0) continue;

      let cx = 0, cy = 0, cz = 0;
      let count = 0;

      for (const idx of indices) {
        cx += position.getX(idx);
        cy += position.getY(idx);
        cz += position.getZ(idx);
        count++;
      }

      if (count > 0) {
        const centroid = new THREE.Vector3(cx / count, cy / count, cz / count);
        // Push the label outward from center so it sits on the surface, not inside
        const dir = centroid.clone().normalize();
        centroid.add(dir.multiplyScalar(8));
        result[network] = centroid;
      }
    }

    return result;
  }, [vertexMap, nodes.brain.geometry]);

  return (
    <>
      {VISIBLE_NETWORKS.map((network) => {
        const pos = centroids[network];
        if (!pos) return null;

        const score = regions?.[network] ?? 0;
        // Only show labels for networks with meaningful activation
        if (score < 0.1) return null;

        const color = REGION_COLORS[network];

        return (
          <Html
            key={network}
            position={pos}
            center
            distanceFactor={300}
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 whitespace-nowrap">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[8px] font-headline uppercase tracking-wider text-white/90">
                {NETWORK_SHORT_LABELS[network]}
              </span>
            </div>
          </Html>
        );
      })}
    </>
  );
}
