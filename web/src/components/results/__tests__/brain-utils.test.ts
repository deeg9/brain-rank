import { describe, it, expect } from 'vitest';
import { getRegionsAtTime, REGION_COLORS } from '../brain-utils';
import type { SegmentData } from '@/components/results/SegmentTable';

const makeSegment = (start: number, end: number, scores: { attention: number; reward: number; emotional_processing: number; social_cognition: number }): SegmentData => ({
  start,
  end,
  activation_score: 0.5,
  arousal: 0.5,
  valence: 0.5,
  regions: scores,
});

const seg1 = makeSegment(0, 5, { attention: 0.8, reward: 0.3, emotional_processing: 0.5, social_cognition: 0.2 });
const seg2 = makeSegment(10, 15, { attention: 0.4, reward: 0.9, emotional_processing: 0.1, social_cognition: 0.6 });
const seg3 = makeSegment(20, 25, { attention: 0.1, reward: 0.2, emotional_processing: 0.9, social_cognition: 0.8 });

describe('getRegionsAtTime', () => {
  it('returns null for empty segments array', () => {
    expect(getRegionsAtTime([], 5)).toBeNull();
  });

  it('returns exact region scores when time falls within a segment', () => {
    const result = getRegionsAtTime([seg1, seg2, seg3], 12);
    expect(result).toEqual(seg2.regions);
  });

  it('returns closest segment scores when time is between segments (gap)', () => {
    // time=7 is between seg1 (0-5) and seg2 (10-15)
    // distance to seg1.end=5 is 2, distance to seg2.start=10 is 3
    const result = getRegionsAtTime([seg1, seg2, seg3], 7);
    expect(result).toEqual(seg1.regions);
  });

  it('returns first segment scores when time is before all segments', () => {
    const segments = [makeSegment(10, 15, seg1.regions)];
    const result = getRegionsAtTime(segments, 2);
    expect(result).toEqual(seg1.regions);
  });

  it('returns last segment scores when time is after all segments', () => {
    const result = getRegionsAtTime([seg1, seg2, seg3], 100);
    expect(result).toEqual(seg3.regions);
  });

  it('REGION_COLORS contains all four region keys with hex color strings', () => {
    expect(REGION_COLORS).toHaveProperty('attention');
    expect(REGION_COLORS).toHaveProperty('reward');
    expect(REGION_COLORS).toHaveProperty('emotional_processing');
    expect(REGION_COLORS).toHaveProperty('social_cognition');
    for (const color of Object.values(REGION_COLORS)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
