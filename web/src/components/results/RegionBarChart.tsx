"use client";

import { motion } from "framer-motion";
import type { SegmentData, SegmentRegionScores } from "./SegmentTable";
import { getRegionsAtTime } from "./brain-utils";
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
  currentTime?: number;
}

export function RegionBarChart({ segments, currentTime = 0 }: RegionBarChartProps) {
  const currentRegions = getRegionsAtTime(segments, currentTime);

  const scores: Record<string, number> = {};
  for (const region of REGIONS) {
    scores[region.key] = currentRegions?.[region.key] ?? 0;
  }


  return (
    <div className="rounded-xl p-5 glass-surface">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-on-surface-variant">neurology</span>
        <h3 className="font-headline text-base font-bold">Brain Region Activation</h3>
        <MetricInfo
          title="Brain Region Activation"
          description="Shows how strongly each brain network is responding at the current moment. Higher bars indicate stronger neural activation in that region."
          calculation="Displays the region scores for the current 2-second segment. Bars update in real-time as the video plays."
          interpretation="Strong attention (>60%) = your hook grabs focus. Strong reward (>60%) = content feels rewarding. Strong emotional (>60%) = emotionally engaging."
        />
        <span className="flex items-center gap-1 text-[10px] text-on-surface-variant font-medium ml-auto">
          <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" /></span>
          Updates with playback
        </span>
      </div>
      <div className="space-y-3">
        {REGIONS.map((region, i) => {
          const score = scores[region.key] ?? 0;
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
