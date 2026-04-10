"use client";

export interface RegionScores {
  attention: number;
  reward: number;
  emotional_processing: number;
  social_cognition: number;
}

interface RegionBreakdownProps {
  regions: RegionScores;
}

const REGION_CONFIG = [
  {
    key: "attention" as const,
    label: "Attention (Focus)",
    textColor: "text-primary",
    barColor: "bg-primary",
  },
  {
    key: "reward" as const,
    label: "Reward (Motivation)",
    textColor: "text-tertiary-fixed-dim",
    barColor: "bg-tertiary-fixed-dim",
  },
  {
    key: "emotional_processing" as const,
    label: "Emotional Processing",
    textColor: "text-secondary",
    barColor: "bg-secondary",
  },
  {
    key: "social_cognition" as const,
    label: "Social Cognition",
    textColor: "text-on-surface-variant",
    barColor: "bg-on-surface-variant",
  },
];

export function RegionBreakdown({ regions }: RegionBreakdownProps) {
  return (
    <div className="bg-surface-container-high rounded-xl p-8">
      <h3 className="font-headline text-lg font-bold mb-6">
        Region Performance
      </h3>
      <div className="space-y-6">
        {REGION_CONFIG.map((region) => {
          const value = regions[region.key];
          const pct = Math.round(value * 100);

          return (
            <div key={region.key} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="font-headline text-xs font-medium">
                  {region.label}
                </span>
                <span
                  className={`font-headline text-xl font-bold ${region.textColor}`}
                >
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden transition-all duration-500">
                <div
                  className={`h-full ${region.barColor} rounded-full animate-bar-fill`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
