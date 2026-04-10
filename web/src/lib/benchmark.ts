import type { SegmentData, SummaryData } from '@/lib/results';
import { formatTimestamp } from '@/lib/results';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TierName = 'Elite' | 'Strong' | 'Average' | 'Weak' | 'Critical';
export type TierColor = 'tertiary' | 'primary' | 'error';

export interface Tier {
  tier: TierName;
  label: string;
  color: TierColor;
}

export type HookType =
  | 'strong_viral_hook'
  | 'engaging_unfocused'
  | 'attention_no_payoff'
  | 'weak_hook'
  | 'no_hook_data';

export interface HookAnalysis {
  type: HookType;
  headline: string;
  description: string;
  reward: number;
  attention: number;
  tier: Tier;
}

export interface DropoffPoint {
  segmentIndex: number;
  timestamp: number;
  drop: number;
  recommendation: string;
}

export interface ShareMoment {
  segmentIndex: number;
  timestamp: number;
  score: number;
}

export interface FlowState {
  startTime: number;
  endTime: number;
  segmentCount: number;
  avgAttention: number;
  avgReward: number;
}

export interface ViralityScore {
  score: number;
  tier: Tier;
  components: {
    hookStrength: number;
    retention: number;
    emotionalArc: number;
    shareability: number;
  };
}

export interface Recommendation {
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface BenchmarkResult {
  virality: ViralityScore;
  hook: HookAnalysis;
  dropoffs: DropoffPoint[];
  shareMoments: ShareMoment[];
  flowStates: FlowState[];
  recommendations: Recommendation[];
}

// ─── Functions ───────────────────────────────────────────────────────────────

/**
 * Map a 0-1 score to a tier per D-02 thresholds.
 */
export function getTier(score: number): Tier {
  if (score > 0.85) return { tier: 'Elite', label: 'Top 10%', color: 'tertiary' };
  if (score >= 0.70) return { tier: 'Strong', label: 'Top 25%', color: 'tertiary' };
  if (score >= 0.45) return { tier: 'Average', label: 'Average', color: 'primary' };
  if (score >= 0.25) return { tier: 'Weak', label: 'Below Average', color: 'error' };
  return { tier: 'Critical', label: 'Bottom 10%', color: 'error' };
}

/**
 * Analyze hook strength in the 0-5s window per D-03 quadrant classification.
 */
export function analyzeHook(segments: SegmentData[]): HookAnalysis {
  const hookSegments = segments.filter((s) => s.start < 5);

  if (hookSegments.length === 0) {
    return {
      type: 'no_hook_data',
      headline: 'No hook data available',
      description:
        'Video is too short or missing early segments to analyze the opening hook.',
      reward: 0,
      attention: 0,
      tier: getTier(0),
    };
  }

  const avgReward =
    hookSegments.reduce((sum, s) => sum + s.regions.reward, 0) /
    hookSegments.length;
  const avgAttention =
    hookSegments.reduce((sum, s) => sum + s.regions.attention, 0) /
    hookSegments.length;

  const highReward = avgReward >= 0.70;
  const highAttention = avgAttention >= 0.70;

  let type: HookType;
  let headline: string;
  let description: string;

  if (highReward && highAttention) {
    type = 'strong_viral_hook';
    headline = 'Strong viral hook';
    description = `Your opening activates reward centers at ${Math.round(avgReward * 100)}% and captures attention at ${Math.round(avgAttention * 100)}% -- that's the combination that predicts virality.`;
  } else if (highReward && !highAttention) {
    type = 'engaging_unfocused';
    headline = 'Engaging but unfocused';
    description = `Reward activation is strong at ${Math.round(avgReward * 100)}%, but attention is only ${Math.round(avgAttention * 100)}%. Tighten the visual -- viewers feel the dopamine but their eyes are wandering.`;
  } else if (!highReward && highAttention) {
    type = 'attention_no_payoff';
    headline = 'Attention without payoff';
    description = `Attention is high at ${Math.round(avgAttention * 100)}%, but reward is only ${Math.round(avgReward * 100)}%. You're grabbing eyes but not delivering satisfaction -- add a stronger payoff in the first 5 seconds.`;
  } else {
    type = 'weak_hook';
    headline = 'Weak hook';
    description = `Both reward (${Math.round(avgReward * 100)}%) and attention (${Math.round(avgAttention * 100)}%) are below threshold. Consider a more surprising, pattern-breaking opener to activate both systems.`;
  }

  const combined = (avgReward + avgAttention) / 2;
  return { type, headline, description, reward: avgReward, attention: avgAttention, tier: getTier(combined) };
}

/**
 * Find segments where emotional_processing drops >30% from previous per D-04.
 */
export function detectDropoffs(segments: SegmentData[]): DropoffPoint[] {
  const dropoffs: DropoffPoint[] = [];

  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1].regions.emotional_processing;
    const curr = segments[i].regions.emotional_processing;

    if (prev === 0) continue;

    const dropRatio = (prev - curr) / prev;
    if (dropRatio > 0.30) {
      dropoffs.push({
        segmentIndex: i,
        timestamp: segments[i].start,
        drop: dropRatio,
        recommendation: `Add a pattern interrupt at ${formatTimestamp(segments[i].start)} (cut, zoom, or music change) to re-engage viewers.`,
      });
    }
  }

  return dropoffs;
}

/**
 * Find local maxima of social_cognition above 0.70 per D-05.
 */
export function detectShareMoments(segments: SegmentData[]): ShareMoment[] {
  const moments: ShareMoment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const score = segments[i].regions.social_cognition;
    if (score <= 0.70) continue;

    const prev = i > 0 ? segments[i - 1].regions.social_cognition : -Infinity;
    const next =
      i < segments.length - 1
        ? segments[i + 1].regions.social_cognition
        : -Infinity;

    if (score >= prev && score >= next) {
      moments.push({
        segmentIndex: i,
        timestamp: segments[i].start,
        score,
      });
    }
  }

  return moments;
}

/**
 * Find contiguous segments where attention >0.60 AND reward >0.60 per D-06.
 */
export function detectFlowStates(segments: SegmentData[]): FlowState[] {
  const flows: FlowState[] = [];
  let runStart = -1;
  let runSegments: SegmentData[] = [];

  function flushRun() {
    if (runSegments.length > 0) {
      flows.push({
        startTime: runSegments[0].start,
        endTime: runSegments[runSegments.length - 1].end,
        segmentCount: runSegments.length,
        avgAttention:
          runSegments.reduce((s, seg) => s + seg.regions.attention, 0) /
          runSegments.length,
        avgReward:
          runSegments.reduce((s, seg) => s + seg.regions.reward, 0) /
          runSegments.length,
      });
      runSegments = [];
      runStart = -1;
    }
  }

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (s.regions.attention > 0.60 && s.regions.reward > 0.60) {
      if (runStart === -1) runStart = i;
      runSegments.push(s);
    } else {
      flushRun();
    }
  }
  flushRun();

  return flows;
}

/**
 * Compute weighted virality score per D-07.
 */
export function computeViralityScore(
  segments: SegmentData[],
  summary: SummaryData
): ViralityScore {
  // Hook strength: avg (reward + attention) / 2 for segments where start < 5
  const hookSegs = segments.filter((s) => s.start < 5);
  let hookStrength: number;
  if (hookSegs.length > 0) {
    hookStrength =
      hookSegs.reduce(
        (sum, s) => sum + (s.regions.reward + s.regions.attention) / 2,
        0
      ) / hookSegs.length;
  } else {
    hookStrength = summary.hook_score;
  }

  // Retention: avg attention across all segments
  let retention: number;
  if (segments.length > 0) {
    retention =
      segments.reduce((sum, s) => sum + s.regions.attention, 0) /
      segments.length;
  } else {
    retention = summary.retention_score;
  }

  // Emotional arc: population variance of emotional_processing, capped at 0.1 = 1.0
  let emotionalArc = 0;
  if (segments.length > 0) {
    const values = segments.map((s) => s.regions.emotional_processing);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    emotionalArc = Math.min(1, variance / 0.1);
  }

  // Shareability: max social_cognition
  let shareability = 0;
  if (segments.length > 0) {
    shareability = Math.max(...segments.map((s) => s.regions.social_cognition));
  }

  // Weighted composite
  const score =
    hookStrength * 0.3 +
    retention * 0.25 +
    emotionalArc * 0.2 +
    shareability * 0.25;

  return {
    score,
    tier: getTier(score),
    components: { hookStrength, retention, emotionalArc, shareability },
  };
}

/**
 * Generate 2-3 actionable recommendations based on weakest areas.
 */
export function generateRecommendations(
  hook: HookAnalysis,
  dropoffs: DropoffPoint[],
  shareMoments: ShareMoment[],
  flowStates: FlowState[],
  virality: ViralityScore
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Weak/critical hook
  if (hook.type === 'weak_hook' || hook.type === 'attention_no_payoff' || hook.type === 'engaging_unfocused') {
    const desc =
      hook.type === 'weak_hook'
        ? 'Your opening 5 seconds need a stronger pattern-breaking moment to activate both reward and attention systems simultaneously.'
        : hook.type === 'attention_no_payoff'
          ? 'Add a satisfying reveal or surprise in the first 5 seconds to convert attention into dopamine activation.'
          : 'Tighten the visual composition in your opener -- the reward signal is strong but viewers\' attention is scattered.';
    recs.push({
      icon: 'edit_note',
      title: 'Strengthen your hook',
      description: desc,
      priority: 'high',
    });
  }

  // Drop-offs exist
  if (dropoffs.length > 0) {
    const worst = dropoffs.reduce((a, b) => (b.drop > a.drop ? b : a));
    recs.push({
      icon: 'trending_up',
      title: 'Add pattern interrupts',
      description: `Emotional engagement drops ${Math.round(worst.drop * 100)}% at ${formatTimestamp(worst.timestamp)}. Insert a cut, zoom, or music change to re-engage viewers at that point.`,
      priority: 'high',
    });
  }

  // No share moments
  if (shareMoments.length === 0) {
    recs.push({
      icon: 'share',
      title: 'Add relatable moments',
      description:
        'No segments triggered strong social cognition. Add relatable, opinion-provoking, or emotionally resonant moments that make viewers think about sharing.',
      priority: 'medium',
    });
  }

  // No flow states
  if (flowStates.length === 0) {
    recs.push({
      icon: 'psychology',
      title: 'Tighten pacing for flow',
      description:
        'No sustained engagement zones detected. Aim for at least one 10-15 second stretch where both attention and reward stay high -- tighten pacing and remove dead air.',
      priority: 'medium',
    });
  }

  // If virality is average or below and we have room, target weakest component
  if (recs.length < 3 && virality.tier.tier !== 'Elite' && virality.tier.tier !== 'Strong') {
    const { hookStrength, retention, emotionalArc, shareability } =
      virality.components;
    const weakest = Object.entries({ hookStrength, retention, emotionalArc, shareability }).sort(
      ([, a], [, b]) => a - b
    )[0];

    const compRecs: Record<string, Recommendation> = {
      hookStrength: {
        icon: 'edit_note',
        title: 'Boost your opening',
        description:
          'Your hook is the weakest component. Lead with your most visually striking or emotionally provocative moment.',
        priority: 'medium',
      },
      retention: {
        icon: 'trending_up',
        title: 'Improve retention',
        description:
          'Attention drops through the video. Use escalating stakes, callbacks, or open loops to keep viewers watching.',
        priority: 'medium',
      },
      emotionalArc: {
        icon: 'psychology',
        title: 'Create emotional contrast',
        description:
          'Your emotional arc is flat. Alternate between high and low emotional intensity to create a more compelling narrative rhythm.',
        priority: 'low',
      },
      shareability: {
        icon: 'share',
        title: 'Increase shareability',
        description:
          'Social cognition activation is low. Add moments that trigger opinion, empathy, or "I need to show this to someone" reactions.',
        priority: 'low',
      },
    };

    // Avoid duplicate recommendations
    const existing = new Set(recs.map((r) => r.title));
    const candidate = compRecs[weakest[0]];
    if (candidate && !existing.has(candidate.title)) {
      recs.push(candidate);
    }
  }

  // Cap at 3, sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recs
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 3);
}

/**
 * Top-level benchmark analysis -- calls all sub-analyses per D-01.
 */
export function analyzeBenchmark(
  segments: SegmentData[],
  summary: SummaryData
): BenchmarkResult {
  const hook = analyzeHook(segments);
  const dropoffs = detectDropoffs(segments);
  const shareMoments = detectShareMoments(segments);
  const flowStates = detectFlowStates(segments);
  const virality = computeViralityScore(segments, summary);
  const recommendations = generateRecommendations(
    hook,
    dropoffs,
    shareMoments,
    flowStates,
    virality
  );

  return { virality, hook, dropoffs, shareMoments, flowStates, recommendations };
}
