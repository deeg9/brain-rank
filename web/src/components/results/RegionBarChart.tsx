"use client";

import { motion } from "framer-motion";
import type { SegmentData, SegmentRegionScores } from "./SegmentTable";
import { MetricInfo } from "./MetricInfo";

const REGIONS: {
  key: keyof SegmentRegionScores;
  label: string;
  color: string;
}[] = [
  { key: "attention", label: "Attention", color: "#60a5fa" },
  { key: "reward", label: "Reward", color: "#a78bfa" },
  { key: "emotional_processing", label: "Emotional Processing", color: "#f472b6" },
  { key: "social_cognition", label: "Social Cognition", color: "#fbbf24" },
  { key: "visual_processing", label: "Visual Processing", color: "#4ade80" },
  { key: "auditory_processing", label: "Auditory Processing", color: "#fb923c" },
  { key: "language_narrative", label: "Language / Narrative", color: "#22d3ee" },
  { key: "default_mode", label: "Default Mode", color: "#fb7185" },
  { key: "motion_processing", label: "Motion Processing", color: "#a3e635" },
];

interface RegionBarChartProps {
  segments: SegmentData[];
}

export function RegionBarChart({ segments }: RegionBarChartProps) {
  // Average scores across all segments
  const avgScores: Record<string, number> = {};
  for (const region of REGIONS) {
    const total = segments.reduce((sum, seg) => sum + (seg.regions[region.key] ?? 0), 0);
    avgScores[region.key] = segments.length > 0 ? total / segments.length : 0;
  }

  // Sort by score descending so strongest activations appear first
  const sorted = [...REGIONS].sort((a, b) => (avgScores[b.key] ?? 0) - (avgScores[a.key] ?? 0));

  return (
    <div className="rounded-xl p-5 glass-surface">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-on-surface-variant">neurology</span>
        <h3 className="font-headline text-base font-bold">Brain Region Activation</h3>
        <MetricInfo
          title="Brain Region Activation"
          description="Shows how strongly each brain network responded to your content. Higher bars indicate stronger neural activation in that region."
          calculation="Averaged across all 2-second segments. For short clips (under 10s), this gives a clear snapshot of which brain regions your content triggers."
          interpretation="Strong attention (>60%) = your hook grabs focus. Strong reward (>60%) = content feels rewarding. Strong emotional (>60%) = emotionally engaging."
        />
      </div>
      <div className="space-y-3">
        {sorted.map((region, i) => {
          const score = avgScores[region.key] ?? 0;
          const pct = Math.round(score * 100);

          return (
            <motion.div
              key={region.key}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <span className="text-xs font-headline font-bold text-gray-500 w-[140px] text-right shrink-0 truncate">
                {region.label}
              </span>
              <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden relative">
                <motion.div
                  className="h-full rounded-md"
                  style={{ backgroundColor: region.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 2)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                />
              </div>
              <span className="text-sm font-headline font-bold text-gray-900 w-[42px] text-right tabular-nums">
                {pct}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
