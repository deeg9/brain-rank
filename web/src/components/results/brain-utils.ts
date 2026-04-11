import type { SegmentData, SegmentRegionScores } from '@/components/results/SegmentTable';

export type { SegmentRegionScores };

/**
 * Look up region scores at a given time by finding the segment that contains
 * the time, or the nearest segment if time falls in a gap.
 */
export function getRegionsAtTime(segments: SegmentData[], time: number): SegmentRegionScores | null {
  if (segments.length === 0) return null;

  let closest = segments[0];
  let minDist = Infinity;

  for (const seg of segments) {
    if (time >= seg.start && time <= seg.end) return seg.regions;

    const dist = Math.min(Math.abs(seg.start - time), Math.abs(seg.end - time));
    if (dist < minDist) {
      minDist = dist;
      closest = seg;
    }
  }

  return closest.regions;
}

/**
 * Look up vertex data at a given time by finding the segment that contains
 * the time, or the nearest segment if time falls in a gap.
 */
export function getVertexDataAtTime(segments: SegmentData[], time: number): string | null {
  if (segments.length === 0) return null;

  let closest = segments[0];
  let minDist = Infinity;

  for (const seg of segments) {
    if (time >= seg.start && time <= seg.end) return seg.vertex_data ?? null;

    const dist = Math.min(Math.abs(seg.start - time), Math.abs(seg.end - time));
    if (dist < minDist) {
      minDist = dist;
      closest = seg;
    }
  }

  return closest.vertex_data ?? null;
}

/**
 * Canonical colors for each brain region, used by BrainViewer and BrainNetworkMesh.
 */
export const REGION_COLORS: Record<keyof SegmentRegionScores, string> = {
  attention: '#60a5fa',
  reward: '#a78bfa',
  emotional_processing: '#f472b6',
  social_cognition: '#fbbf24',
  visual_processing: '#4ade80',
  auditory_processing: '#fb923c',
  language_narrative: '#22d3ee',
  default_mode: '#fb7185',
  motion_processing: '#a3e635',
};
