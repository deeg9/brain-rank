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
