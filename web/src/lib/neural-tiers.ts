/**
 * Neural activation score tier system.
 *
 * BrainRank outputs normalized activation values from 0.0 to 1.0,
 * representing predicted cortical activation intensity — NOT a percentage grade.
 *
 * Baseline cortical activity sits around 0.15-0.25 (brain is always active at rest).
 * A score of 0.50 is genuinely strong engagement, not "half."
 */

export interface NeuralTier {
  label: string;
  color: string;       // tailwind text color class
  bgColor: string;     // tailwind bg color class
  dotColor: string;    // hex for charts/dots
  min: number;
  max: number;
  description: string;
}

export const NEURAL_TIERS: NeuralTier[] = [
  {
    label: "Baseline",
    color: "text-gray-900",
    bgColor: "bg-gray-100",
    dotColor: "#9ca3af",
    min: 0,
    max: 0.25,
    description: "Resting brain activity — content not yet registering",
  },
  {
    label: "Moderate",
    color: "text-gray-900",
    bgColor: "bg-blue-50",
    dotColor: "#3b82f6",
    min: 0.25,
    max: 0.45,
    description: "Content is registering — viewer is casually engaged",
  },
  {
    label: "Strong",
    color: "text-gray-900",
    bgColor: "bg-emerald-50",
    dotColor: "#059669",
    min: 0.45,
    max: 0.65,
    description: "High engagement — viewer is locked in",
  },
  {
    label: "Exceptional",
    color: "text-gray-900",
    bgColor: "bg-amber-50",
    dotColor: "#f59e0b",
    min: 0.65,
    max: 0.85,
    description: "Peak neural response — rare and powerful moments",
  },
  {
    label: "Intense",
    color: "text-gray-900",
    bgColor: "bg-red-50",
    dotColor: "#ef4444",
    min: 0.85,
    max: 1.0,
    description: "Extremely rare activation — maximum neural intensity",
  },
];

/**
 * Get the tier for a given activation value (0.0 - 1.0)
 */
export function getTier(value: number): NeuralTier {
  for (const tier of NEURAL_TIERS) {
    if (value < tier.max) return tier;
  }
  return NEURAL_TIERS[NEURAL_TIERS.length - 1];
}

/**
 * Format a 0-1 activation value as a decimal string (e.g., 0.52)
 */
export function formatScore(value: number): string {
  return value.toFixed(2);
}

/**
 * Format a 0-100 score (like overall_score from API) back to decimal
 */
export function normalizeScore(value: number): number {
  if (value > 1) return value / 100;
  return value;
}
