"use client";

import { NEURAL_TIERS } from "@/lib/neural-tiers";

interface BenchmarkLegendProps {
  compact?: boolean;
}

export function BenchmarkLegend({ compact = false }: BenchmarkLegendProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {NEURAL_TIERS.map((tier) => (
          <div key={tier.label} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tier.dotColor }}
            />
            <span className="text-[9px] font-headline font-bold uppercase tracking-widest text-black">
              {tier.label}
            </span>
            <span className="text-[9px] text-gray-400">
              {tier.min.toFixed(2)}-{tier.max.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-black">
        Score Benchmark
      </h4>
      <div className="grid grid-cols-5 gap-2">
        {NEURAL_TIERS.map((tier) => (
          <div
            key={tier.label}
            className={`rounded-lg p-3 ${tier.bgColor} text-center`}
          >
            <p className={`font-headline font-bold text-sm ${tier.color}`}>
              {tier.label}
            </p>
            <p className="text-[10px] text-gray-500 font-bold mt-0.5">
              {tier.min.toFixed(2)} — {tier.max.toFixed(2)}
            </p>
            <p className="text-[9px] text-gray-400 mt-1 leading-tight">
              {tier.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
