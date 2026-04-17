import { computeEngagement, computeRetention } from './engagement'

export interface RegionScores {
  attention: number
  reward: number
  emotional_processing: number
  social_cognition: number
}

export interface SegmentData {
  start: number
  end: number
  activation_score: number
  arousal: number
  valence: number
  regions: RegionScores
}

export interface SummaryData {
  overall: number
  hook_score: number
  retention_score: number
  peak_second: number
  peak_score: number
}

export interface ResultsData {
  video_url: string
  duration_seconds: number
  segments: SegmentData[]
  summary: SummaryData
  raw_shape: number[]
}

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function getEngagementLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.7) return 'high'
  if (score >= 0.4) return 'medium'
  return 'low'
}

/**
 * Extract the canonical 0-100 engagement score from a job's results JSON.
 *
 * Prefers the engagement composite (40% peak + 30% hook + 30% retention) when
 * the full summary + segments are available — this matches what the dashboard
 * shows so every surface (dashboard, discover, profile, /u/[username],
 * bookmarks) displays the same number for the same analysis.
 *
 * Falls back to summary.overall * 100, then to the legacy overall_score field.
 * Returns null when no usable score is present.
 */
export function extractOverallScore(results: Record<string, unknown> | null | undefined): number | null {
  if (!results) return null

  const summary = results.summary as
    | { hook_score?: number; peak_score?: number; overall?: number }
    | undefined
  const segments = results.segments as { activation_score: number }[] | undefined

  if (
    summary &&
    segments &&
    segments.length > 0 &&
    typeof summary.hook_score === 'number' &&
    typeof summary.peak_score === 'number'
  ) {
    const retention = computeRetention(segments)
    const engagement = computeEngagement({
      peak: summary.peak_score,
      hook: summary.hook_score,
      retention,
    })
    return Math.round(engagement * 100)
  }

  if (typeof summary?.overall === 'number') return Math.round(summary.overall * 100)
  const legacy = (results as { overall_score?: unknown }).overall_score
  if (typeof legacy === 'number') return Math.round(legacy)
  return null
}

export function parseJobResults(results: Record<string, unknown> | null): ResultsData | null {
  if (!results) return null

  // Validate required top-level fields
  if (
    typeof results.video_url !== 'string' ||
    typeof results.duration_seconds !== 'number' ||
    !Array.isArray(results.segments) ||
    !results.summary ||
    typeof results.summary !== 'object'
  ) {
    return null
  }

  const summary = results.summary as Record<string, unknown>
  if (
    typeof summary.overall !== 'number' ||
    typeof summary.hook_score !== 'number' ||
    typeof summary.retention_score !== 'number' ||
    typeof summary.peak_second !== 'number' ||
    typeof summary.peak_score !== 'number'
  ) {
    return null
  }

  // Validate segments have required numeric fields
  const segments = results.segments as Record<string, unknown>[]
  for (const seg of segments) {
    if (
      typeof seg.start !== 'number' ||
      typeof seg.end !== 'number' ||
      typeof seg.activation_score !== 'number' ||
      typeof seg.arousal !== 'number' ||
      typeof seg.valence !== 'number' ||
      !seg.regions ||
      typeof seg.regions !== 'object'
    ) {
      return null
    }
  }

  return results as unknown as ResultsData
}
