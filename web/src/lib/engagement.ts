const RETENTION_WINDOW = 5; // 5 × 2s segments = 10s

export function computeRetention(segments: { activation_score: number }[]): number {
  if (segments.length === 0) return 0;
  if (segments.length <= RETENTION_WINDOW) {
    return segments.reduce((s, x) => s + x.activation_score, 0) / segments.length;
  }
  let min = Infinity;
  for (let i = 0; i <= segments.length - RETENTION_WINDOW; i++) {
    let sum = 0;
    for (let j = 0; j < RETENTION_WINDOW; j++) sum += segments[i + j].activation_score;
    const mean = sum / RETENTION_WINDOW;
    if (mean < min) min = mean;
  }
  return min;
}

export function computeEngagement(opts: {
  peak: number;
  hook: number;
  retention: number;
}): number {
  return 0.4 * opts.peak + 0.3 * opts.hook + 0.3 * opts.retention;
}
