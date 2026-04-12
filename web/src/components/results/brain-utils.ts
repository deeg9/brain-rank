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

/** Duration in seconds before a segment boundary where lerp blending begins. */
const BLEND_WINDOW = 0.3;

export interface AdjacentSegmentResult {
  currentVertexData: string;       // base64 vertex_data for current segment
  nextVertexData: string | null;   // base64 vertex_data for next segment (null if last or same segment)
  blendFactor: number;             // 0.0 = fully current, 1.0 = fully next
}

/**
 * Find the current and next segment vertex data at a given time, plus a blend
 * factor that ramps from 0 to 1 over the last 300ms before a segment boundary.
 * This enables smooth lerp transitions instead of hard snaps.
 */
export function getAdjacentSegments(
  segments: SegmentData[],
  time: number,
): AdjacentSegmentResult | null {
  if (segments.length === 0) return null;

  // Find current segment index
  let currentIdx = -1;
  let closestIdx = 0;
  let minDist = Infinity;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (time >= seg.start && time <= seg.end) {
      currentIdx = i;
      break;
    }
    const dist = Math.min(Math.abs(seg.start - time), Math.abs(seg.end - time));
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }

  if (currentIdx === -1) currentIdx = closestIdx;

  const current = segments[currentIdx];
  const currentVD = current.vertex_data;
  if (!currentVD) return null;

  // Check for next segment
  const nextIdx = currentIdx + 1;
  const next = nextIdx < segments.length ? segments[nextIdx] : null;
  const nextVD = next?.vertex_data ?? null;

  // Compute blend factor: ramp up in the last BLEND_WINDOW seconds of the current segment
  let blendFactor = 0;
  if (nextVD !== null) {
    const blendStart = current.end - BLEND_WINDOW;
    if (time >= blendStart && time <= current.end) {
      blendFactor = Math.min(1, Math.max(0, (time - blendStart) / BLEND_WINDOW));
    }
  }

  return { currentVertexData: currentVD, nextVertexData: nextVD, blendFactor };
}

/**
 * Canonical colors for each brain region, used by BrainViewer and BrainNetworkMesh.
 */
export const REGION_COLORS: Record<keyof SegmentRegionScores, string> = {
  attention: '#3b82f6',
  reward: '#8b5cf6',
  emotional_processing: '#ec4899',
  social_cognition: '#f59e0b',
  visual_processing: '#22c55e',
  auditory_processing: '#f97316',
  language_narrative: '#06b6d4',
  default_mode: '#f43f5e',
  motion_processing: '#84cc16',
};
