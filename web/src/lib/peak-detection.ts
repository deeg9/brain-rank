import type { SegmentData, SegmentRegionScores } from '@/components/results/SegmentTable';

/** Human-readable labels for each brain region key. */
export const REGION_LABELS: Record<keyof SegmentRegionScores, string> = {
  attention: 'Attention',
  reward: 'Reward',
  emotional_processing: 'Emotional Processing',
  social_cognition: 'Social Cognition',
} as const;

/** Default activation threshold -- segments below this are not considered peaks. */
const DEFAULT_THRESHOLD = 0.3;

/** Default maximum number of peaks to return. */
const DEFAULT_MAX_PEAKS = 5;

export interface PeakMarker {
  /** Midpoint of the segment in seconds: (start + end) / 2 */
  time: number;
  /** The segment's activation_score (0-1) */
  activationScore: number;
  /** 1-based rank (1 = highest peak) */
  rank: number;
  /** Human-readable name of the highest-scoring region */
  dominantRegion: string;
}

interface FindPeaksOptions {
  threshold?: number;
  maxPeaks?: number;
}

/**
 * Identify the top activation peaks from segment data.
 *
 * Algorithm:
 *   1. Filter segments above threshold
 *   2. Sort by activation_score descending
 *   3. De-duplicate adjacent segments (keep the higher one)
 *   4. Take top maxPeaks
 *   5. Assign ranks 1..N
 */
export function findPeaks(
  segments: SegmentData[],
  options?: FindPeaksOptions
): PeakMarker[] {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const maxPeaks = options?.maxPeaks ?? DEFAULT_MAX_PEAKS;

  if (segments.length === 0) return [];

  // 1. Filter + remember original index for adjacency check
  const candidates = segments
    .map((seg, originalIndex) => ({ seg, originalIndex }))
    .filter(({ seg }) => seg.activation_score >= threshold);

  if (candidates.length === 0) return [];

  // 2. Sort by activation_score descending
  candidates.sort((a, b) => b.seg.activation_score - a.seg.activation_score);

  // 3. Greedy selection: skip if adjacent (within 1 index) to an already-selected segment
  const selectedIndices = new Set<number>();
  const selected: typeof candidates = [];

  for (const candidate of candidates) {
    const idx = candidate.originalIndex;
    let isAdjacent = false;
    for (const usedIdx of selectedIndices) {
      if (Math.abs(idx - usedIdx) <= 1) {
        isAdjacent = true;
        break;
      }
    }
    if (!isAdjacent) {
      selected.push(candidate);
      selectedIndices.add(idx);
      if (selected.length >= maxPeaks) break;
    }
  }

  // 4. Build PeakMarker results with ranks
  return selected.map(({ seg }, i) => ({
    time: (seg.start + seg.end) / 2,
    activationScore: seg.activation_score,
    rank: i + 1,
    dominantRegion: getDominantRegion(seg.regions),
  }));
}

function getDominantRegion(regions: SegmentRegionScores): string {
  let maxKey: keyof SegmentRegionScores = 'attention';
  let maxVal = -Infinity;

  for (const key of Object.keys(regions) as (keyof SegmentRegionScores)[]) {
    if (regions[key] > maxVal) {
      maxVal = regions[key];
      maxKey = key;
    }
  }

  return REGION_LABELS[maxKey];
}
