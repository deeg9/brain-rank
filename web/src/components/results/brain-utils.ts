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
 * Canonical colors for each brain region, used by BrainViewer and RegionValuesBar.
 */
export const REGION_COLORS: Record<keyof SegmentRegionScores, string> = {
  attention: '#60a5fa',
  reward: '#a78bfa',
  emotional_processing: '#f472b6',
  social_cognition: '#fbbf24',
};
