"use client";

import { getTier, formatScore, normalizeScore, NEURAL_TIERS } from "@/lib/neural-tiers";

interface ScoreBreakdown {
  hook: number;       // 0-1
  peak: number;       // 0-1
  retention: number;  // 0-1
}

interface ScoreBadgeProps {
  /** Score value — accepts 0-1 (decimal) or 0-100 (auto-normalized) */
  value: number | null;
  /** Show the tier label (e.g., "Strong") next to the score */
  showLabel?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional icon rendered inside the hover area, before the score number */
  icon?: React.ReactNode;
  /** Optional sub-component breakdown — when provided, popup shows what's driving the score */
  breakdown?: ScoreBreakdown;
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="font-bold text-black w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-black rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-bold text-black tabular-nums w-9 text-right">{value.toFixed(2)}</span>
    </div>
  );
}

export function ScoreBadge({ value, showLabel = false, size = "md", icon, breakdown }: ScoreBadgeProps) {
  if (value === null || value === undefined) {
    return (
      <span className="inline-flex items-center gap-1">
        {icon}
        <span className="text-gray-400 font-headline font-bold text-sm">N/A</span>
      </span>
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
      {icon}
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

        {breakdown && (
          <div className="hidden md:block mt-3 pt-3 border-t border-gray-100">
            <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-black mb-2">
              What&apos;s driving it
            </p>
            <div className="space-y-1.5">
              <BreakdownRow label="Hook" value={breakdown.hook} />
              <BreakdownRow label="Peak" value={breakdown.peak} />
              <BreakdownRow label="Retention" value={breakdown.retention} />
            </div>
          </div>
        )}
      </div>
    </span>
  );
}
