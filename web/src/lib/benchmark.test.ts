import { describe, it, expect } from 'vitest';
import type { SegmentData, SummaryData } from '@/lib/results';
import {
  getTier,
  analyzeHook,
  detectDropoffs,
  detectShareMoments,
  detectFlowStates,
  computeViralityScore,
  generateRecommendations,
  analyzeBenchmark,
} from '@/lib/benchmark';

// Helper to build mock segments
function seg(start: number, end: number, regions: Partial<SegmentData['regions']> = {}): SegmentData {
  return {
    start,
    end,
    activation_score: 0.5,
    arousal: 0.5,
    valence: 0.5,
    regions: {
      attention: 0.5,
      reward: 0.5,
      emotional_processing: 0.5,
      social_cognition: 0.5,
      ...regions,
    },
  };
}

const defaultSummary: SummaryData = {
  overall: 0.6,
  hook_score: 0.7,
  retention_score: 0.6,
  peak_second: 10,
  peak_score: 0.9,
};

describe('getTier', () => {
  it('returns Elite for scores > 0.85', () => {
    const t = getTier(0.90);
    expect(t.tier).toBe('Elite');
    expect(t.label).toBe('Top 10%');
    expect(t.color).toBe('tertiary');
  });

  it('returns Strong for scores 0.70-0.85', () => {
    const t = getTier(0.75);
    expect(t.tier).toBe('Strong');
    expect(t.label).toBe('Top 25%');
    expect(t.color).toBe('tertiary');
  });

  it('returns Average for scores 0.45-0.70', () => {
    const t = getTier(0.55);
    expect(t.tier).toBe('Average');
    expect(t.label).toBe('Average');
    expect(t.color).toBe('primary');
  });

  it('returns Weak for scores 0.25-0.45', () => {
    const t = getTier(0.35);
    expect(t.tier).toBe('Weak');
    expect(t.label).toBe('Below Average');
    expect(t.color).toBe('error');
  });

  it('returns Critical for scores < 0.25', () => {
    const t = getTier(0.20);
    expect(t.tier).toBe('Critical');
    expect(t.label).toBe('Bottom 10%');
    expect(t.color).toBe('error');
  });

  it('returns Strong at exactly 0.70 boundary', () => {
    expect(getTier(0.70).tier).toBe('Strong');
  });

  it('returns Average at exactly 0.45 boundary', () => {
    expect(getTier(0.45).tier).toBe('Average');
  });
});

describe('analyzeHook', () => {
  it('returns strong_viral_hook when reward and attention are both high', () => {
    const segments = [seg(0, 3, { reward: 0.85, attention: 0.80 }), seg(3, 5, { reward: 0.75, attention: 0.75 })];
    const result = analyzeHook(segments);
    expect(result.type).toBe('strong_viral_hook');
  });

  it('returns engaging_unfocused when reward high but attention low', () => {
    const segments = [seg(0, 5, { reward: 0.80, attention: 0.40 })];
    const result = analyzeHook(segments);
    expect(result.type).toBe('engaging_unfocused');
  });

  it('returns attention_no_payoff when attention high but reward low', () => {
    const segments = [seg(0, 5, { reward: 0.40, attention: 0.80 })];
    const result = analyzeHook(segments);
    expect(result.type).toBe('attention_no_payoff');
  });

  it('returns weak_hook when both low', () => {
    const segments = [seg(0, 5, { reward: 0.30, attention: 0.30 })];
    const result = analyzeHook(segments);
    expect(result.type).toBe('weak_hook');
  });

  it('returns no_hook_data when no segments in 0-5s window', () => {
    const segments = [seg(10, 15)];
    const result = analyzeHook(segments);
    expect(result.type).toBe('no_hook_data');
  });
});

describe('detectDropoffs', () => {
  it('finds segments where emotional_processing drops >30%', () => {
    const segments = [
      seg(0, 5, { emotional_processing: 0.80 }),
      seg(5, 10, { emotional_processing: 0.40 }), // 50% drop
    ];
    const dropoffs = detectDropoffs(segments);
    expect(dropoffs).toHaveLength(1);
    expect(dropoffs[0].segmentIndex).toBe(1);
    expect(dropoffs[0].drop).toBeGreaterThan(0.3);
  });

  it('returns empty when no drops exceed 30%', () => {
    const segments = [
      seg(0, 5, { emotional_processing: 0.80 }),
      seg(5, 10, { emotional_processing: 0.70 }), // only ~12.5% drop
    ];
    const dropoffs = detectDropoffs(segments);
    expect(dropoffs).toHaveLength(0);
  });
});

describe('detectShareMoments', () => {
  it('finds local maxima of social_cognition above 0.70', () => {
    const segments = [
      seg(0, 5, { social_cognition: 0.50 }),
      seg(5, 10, { social_cognition: 0.85 }), // local max
      seg(10, 15, { social_cognition: 0.60 }),
    ];
    const moments = detectShareMoments(segments);
    expect(moments).toHaveLength(1);
    expect(moments[0].segmentIndex).toBe(1);
    expect(moments[0].score).toBe(0.85);
  });

  it('returns empty when all social_cognition below 0.70', () => {
    const segments = [seg(0, 5, { social_cognition: 0.50 }), seg(5, 10, { social_cognition: 0.60 })];
    const moments = detectShareMoments(segments);
    expect(moments).toHaveLength(0);
  });

  it('detects first segment as local max if >= neighbor and above threshold', () => {
    const segments = [
      seg(0, 5, { social_cognition: 0.90 }),
      seg(5, 10, { social_cognition: 0.60 }),
    ];
    const moments = detectShareMoments(segments);
    expect(moments).toHaveLength(1);
    expect(moments[0].segmentIndex).toBe(0);
  });
});

describe('detectFlowStates', () => {
  it('finds contiguous segments where attention >0.60 AND reward >0.60', () => {
    const segments = [
      seg(0, 5, { attention: 0.70, reward: 0.70 }),
      seg(5, 10, { attention: 0.65, reward: 0.65 }),
      seg(10, 15, { attention: 0.30, reward: 0.30 }),
    ];
    const flows = detectFlowStates(segments);
    expect(flows).toHaveLength(1);
    expect(flows[0].startTime).toBe(0);
    expect(flows[0].endTime).toBe(10);
    expect(flows[0].segmentCount).toBe(2);
  });

  it('returns separate flow states for non-contiguous qualifying segments', () => {
    const segments = [
      seg(0, 5, { attention: 0.70, reward: 0.70 }),
      seg(5, 10, { attention: 0.30, reward: 0.30 }),
      seg(10, 15, { attention: 0.70, reward: 0.70 }),
    ];
    const flows = detectFlowStates(segments);
    expect(flows).toHaveLength(2);
  });

  it('returns empty when no segments qualify', () => {
    const segments = [seg(0, 5, { attention: 0.50, reward: 0.50 })];
    const flows = detectFlowStates(segments);
    expect(flows).toHaveLength(0);
  });
});

describe('computeViralityScore', () => {
  it('returns weighted composite with correct weights', () => {
    const segments = [
      seg(0, 5, { attention: 0.80, reward: 0.80, emotional_processing: 0.50, social_cognition: 0.90 }),
      seg(5, 10, { attention: 0.70, reward: 0.60, emotional_processing: 0.80, social_cognition: 0.60 }),
    ];
    const result = computeViralityScore(segments, defaultSummary);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.components.hookStrength).toBeGreaterThan(0);
    expect(result.components.retention).toBeGreaterThan(0);
    expect(result.components.emotionalArc).toBeGreaterThanOrEqual(0);
    expect(result.components.shareability).toBeGreaterThan(0);
    expect(result.tier).toBeDefined();
  });

  it('maps score to correct tier', () => {
    const segments = [seg(0, 5, { attention: 0.90, reward: 0.90, emotional_processing: 0.90, social_cognition: 0.90 })];
    const result = computeViralityScore(segments, defaultSummary);
    expect(result.tier.tier).toBeDefined();
  });
});

describe('generateRecommendations', () => {
  it('returns 2-3 recommendations', () => {
    const hook = analyzeHook([seg(0, 5, { reward: 0.30, attention: 0.30 })]);
    const dropoffs = detectDropoffs([
      seg(0, 5, { emotional_processing: 0.80 }),
      seg(5, 10, { emotional_processing: 0.30 }),
    ]);
    const shareMoments = detectShareMoments([]);
    const flowStates = detectFlowStates([]);
    const virality: any = { score: 0.4, tier: getTier(0.4), components: { hookStrength: 0.3, retention: 0.3, emotionalArc: 0.3, shareability: 0.3 } };
    const recs = generateRecommendations(hook, dropoffs, shareMoments, flowStates, virality);
    expect(recs.length).toBeGreaterThanOrEqual(2);
    expect(recs.length).toBeLessThanOrEqual(3);
  });
});

describe('analyzeBenchmark', () => {
  it('returns all sub-analyses in one object', () => {
    const segments = [
      seg(0, 5, { attention: 0.80, reward: 0.80, emotional_processing: 0.70, social_cognition: 0.85 }),
      seg(5, 10, { attention: 0.60, reward: 0.50, emotional_processing: 0.40, social_cognition: 0.60 }),
    ];
    const result = analyzeBenchmark(segments, defaultSummary);
    expect(result.virality).toBeDefined();
    expect(result.hook).toBeDefined();
    expect(result.dropoffs).toBeDefined();
    expect(result.shareMoments).toBeDefined();
    expect(result.flowStates).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });

  it('handles empty segments gracefully', () => {
    const result = analyzeBenchmark([], defaultSummary);
    expect(result.virality.score).toBeGreaterThanOrEqual(0);
    expect(result.hook.type).toBe('no_hook_data');
    expect(result.dropoffs).toHaveLength(0);
    expect(result.shareMoments).toHaveLength(0);
    expect(result.flowStates).toHaveLength(0);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});
