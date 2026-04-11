import { describe, it, expect } from 'vitest';
import { findPeaks, type PeakMarker, REGION_LABELS } from './peak-detection';
import type { SegmentData } from '@/components/results/SegmentTable';

function makeSegment(
  start: number,
  end: number,
  activation_score: number,
  regions?: Partial<SegmentData['regions']>
): SegmentData {
  return {
    start,
    end,
    activation_score,
    arousal: 0.5,
    valence: 0.5,
    regions: {
      attention: 0.25,
      reward: 0.25,
      emotional_processing: 0.25,
      social_cognition: 0.25,
      ...regions,
    },
  };
}

describe('findPeaks', () => {
  it('returns empty array for empty segments', () => {
    expect(findPeaks([])).toEqual([]);
  });

  it('returns empty array when all segments are below threshold (0.3)', () => {
    const segments = [
      makeSegment(0, 2, 0.1),
      makeSegment(2, 4, 0.2),
      makeSegment(4, 6, 0.29),
    ];
    expect(findPeaks(segments)).toEqual([]);
  });

  it('returns at most maxPeaks peaks sorted by activation_score descending', () => {
    const segments = Array.from({ length: 10 }, (_, i) =>
      makeSegment(i * 2, (i + 1) * 2, 0.3 + i * 0.05)
    );
    // With default maxPeaks=5, should return at most 5
    const peaks = findPeaks(segments);
    expect(peaks.length).toBeLessThanOrEqual(5);
    // All returned peaks should be sorted by rank (1 = highest)
    for (let i = 1; i < peaks.length; i++) {
      expect(peaks[i].activationScore).toBeLessThanOrEqual(peaks[i - 1].activationScore);
    }
  });

  it('returns all qualifying peaks when fewer than maxPeaks', () => {
    const segments = [
      makeSegment(0, 2, 0.5),
      makeSegment(2, 4, 0.1), // below threshold
      makeSegment(4, 6, 0.6),
      makeSegment(6, 8, 0.1), // below threshold
      makeSegment(8, 10, 0.4),
    ];
    const peaks = findPeaks(segments);
    expect(peaks.length).toBe(3);
  });

  it('computes time as midpoint of segment', () => {
    const segments = [makeSegment(10, 14, 0.8)];
    const peaks = findPeaks(segments);
    expect(peaks[0].time).toBe(12); // (10 + 14) / 2
  });

  it('assigns rank 1-based starting from highest', () => {
    // Separate peaks by low-activation segments to avoid adjacency filtering
    const segments = [
      makeSegment(0, 2, 0.5),    // idx 0
      makeSegment(2, 4, 0.1),    // idx 1 - spacer
      makeSegment(4, 6, 0.9),    // idx 2
      makeSegment(6, 8, 0.1),    // idx 3 - spacer
      makeSegment(8, 10, 0.7),   // idx 4
    ];
    const peaks = findPeaks(segments);
    expect(peaks.length).toBe(3);
    expect(peaks[0].rank).toBe(1);
    expect(peaks[0].activationScore).toBe(0.9);
    expect(peaks[1].rank).toBe(2);
    expect(peaks[1].activationScore).toBe(0.7);
    expect(peaks[2].rank).toBe(3);
    expect(peaks[2].activationScore).toBe(0.5);
  });

  it('identifies dominant region correctly', () => {
    const segments = [
      makeSegment(0, 2, 0.8, { attention: 0.9, reward: 0.3, emotional_processing: 0.2, social_cognition: 0.1 }),
    ];
    const peaks = findPeaks(segments);
    expect(peaks[0].dominantRegion).toBe('Attention');
  });

  it('merges adjacent peaks, keeping the higher one', () => {
    // Indices 2 and 3 are adjacent; both above threshold; index 3 is higher
    const segments = [
      makeSegment(0, 2, 0.1),   // idx 0 - below threshold
      makeSegment(2, 4, 0.1),   // idx 1 - below threshold
      makeSegment(4, 6, 0.5),   // idx 2 - above threshold
      makeSegment(6, 8, 0.7),   // idx 3 - above threshold, adjacent to idx 2
      makeSegment(8, 10, 0.1),  // idx 4 - below threshold
    ];
    const peaks = findPeaks(segments);
    // Should only return the higher one (idx 3, score 0.7)
    expect(peaks.length).toBe(1);
    expect(peaks[0].activationScore).toBe(0.7);
    expect(peaks[0].time).toBe(7); // (6 + 8) / 2
  });

  it('respects custom maxPeaks parameter', () => {
    const segments = Array.from({ length: 20 }, (_, i) =>
      makeSegment(i * 4, (i + 1) * 4, 0.3 + (i % 2) * 0.3) // alternating 0.3 and 0.6, so no adjacency
    );
    const peaks = findPeaks(segments, { maxPeaks: 3 });
    expect(peaks.length).toBeLessThanOrEqual(3);
  });

  it('respects custom threshold parameter', () => {
    const segments = [
      makeSegment(0, 2, 0.5),
      makeSegment(4, 6, 0.6),
      makeSegment(8, 10, 0.7),
    ];
    const peaks = findPeaks(segments, { threshold: 0.65 });
    expect(peaks.length).toBe(1);
    expect(peaks[0].activationScore).toBe(0.7);
  });
});

describe('REGION_LABELS', () => {
  it('has labels for all four regions', () => {
    expect(REGION_LABELS.attention).toBe('Attention');
    expect(REGION_LABELS.reward).toBe('Reward');
    expect(REGION_LABELS.emotional_processing).toBe('Emotional Processing');
    expect(REGION_LABELS.social_cognition).toBe('Social Cognition');
  });
});
