"use client";

import { getTier, formatScore, normalizeScore, NEURAL_TIERS } from "@/lib/neural-tiers";

interface ScoreBadgeProps {
  /** Score value — accepts 0-1 (decimal) or 0-100 (auto-normalized) */
  value: number | null;
  /** Show the tier label (e.g., "Strong") next to the score */
  showLabel?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ value, showLabel = false, size = "md" }: ScoreBadgeProps) {
  if (value === null || value === undefined) {
    return (
      <span className="text-gray-400 font-headline font-bold text-sm">N/A</span>
    );
  }

  const normalized = normalizeScore(value);
  const tier = getTier(normalized);
  const display = formatScore(normalized);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-3xl",
  };

  const labelSizeClasses = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  return (
    <span className="relative inline-flex items-center gap-1.5 group/score cursor-default">
      <span className={`font-headline font-bold ${sizeClasses[size]} ${tier.color}`}>
        {display}
      </span>
      {showLabel && (
        <span className={`font-headline font-bold uppercase tracking-widest ${labelSizeClasses[size]} ${tier.color}`}>
          {tier.label}
        </span>
      )}

      {/* Hover legend popup — positioned above to avoid overflow clipping */}
      <div className="absolute left-0 bottom-full mb-2 w-64 bg-white rounded-xl border border-gray-200 shadow-2xl opacity-0 invisible group-hover/score:opacity-100 group-hover/score:visible transition-all duration-200 p-4 z-50">
        <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-black mb-3">
          Score Benchmark
        </p>
        <div className="space-y-2">
          {NEURAL_TIERS.map((t) => {
            const isActive = tier.label === t.label;
            return (
              <div
                key={t.label}
                className={`flex items-center justify-between text-[11px] px-2 py-1 rounded ${isActive ? "bg-gray-100" : ""}`}
              >
                <span className={`font-bold text-black ${isActive ? "underline" : ""}`}>
                  {t.label}
                </span>
                <span className="font-bold text-black">
                  {t.min.toFixed(2)} — {t.max.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[9px] text-gray-400 mt-3 leading-tight">
          Scores are neural activation intensity (0-1), not percentages. 0.50 is strong engagement.
        </p>
      </div>
    </span>
  );
}
