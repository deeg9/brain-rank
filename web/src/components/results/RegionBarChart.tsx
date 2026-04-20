"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { SegmentData, SegmentRegionScores } from "./SegmentTable";
import { getRegionsAtTime } from "./brain-utils";
import { MetricInfo } from "./MetricInfo";

const DEFAULT_VISIBLE_COUNT = 3;

const REGIONS: {
  key: keyof SegmentRegionScores;
  label: string;
  color: string;
  info: {
    description: string;
    calculation: string;
    interpretation: string;
  };
}[] = [
  {
    key: "attention",
    label: "Attention",
    color: "#60a5fa",
    info: {
      description:
        "Predicted activation in the brain's attention network — primarily frontal and parietal regions — which governs focused concentration on a stimulus.",
      calculation:
        "TRIBE v2 predicts fMRI signal in the attention network for each 2-second segment, trained on real brain recordings of people watching video.",
      interpretation:
        "High values mean the viewer is locked in; dips indicate attention drift or cognitive disengagement.",
    },
  },
  {
    key: "reward",
    label: "Reward",
    color: "#a78bfa",
    info: {
      description:
        "Predicted activation in reward circuits — nucleus accumbens, ventral striatum, and dopaminergic midbrain — that signal how intrinsically rewarding content feels.",
      calculation:
        "TRIBE v2 projects segment features onto the reward-network voxels learned from its fMRI training set.",
      interpretation:
        "High reward activation is one of the strongest predictors of retention and repeat viewing.",
    },
  },
  {
    key: "emotional_processing",
    label: "Emotional Processing",
    color: "#f472b6",
    info: {
      description:
        "Predicted activation in affective regions — amygdala, insula, and anterior cingulate — that process emotional salience and valence.",
      calculation:
        "TRIBE v2 outputs a predicted response in the limbic/affective network for each segment.",
      interpretation:
        "Peaks mark emotionally charged moments; flat curves suggest emotionally neutral or forgettable content.",
    },
  },
  {
    key: "social_cognition",
    label: "Social Cognition",
    color: "#fbbf24",
    info: {
      description:
        "Predicted activation in the theory-of-mind network — temporoparietal junction and medial prefrontal cortex — engaged when viewers think about other people's intentions and mental states.",
      calculation:
        "TRIBE v2 predicts activation in the canonical mentalizing network regions.",
      interpretation:
        "High values appear when viewers are reading faces, interpreting motives, or emotionally relating to characters.",
    },
  },
  {
    key: "visual_processing",
    label: "Visual Processing",
    color: "#4ade80",
    info: {
      description:
        "Predicted activation in the occipital visual cortex (V1–V4) — the primary regions that decode color, edges, shapes, and scene complexity.",
      calculation:
        "TRIBE v2's V-JEPA2 video features are projected onto visual cortex voxels learned from fMRI.",
      interpretation:
        "Peaks correspond to visually rich, high-contrast, or novel frames. Sustained high values indicate strong visual salience.",
    },
  },
  {
    key: "auditory_processing",
    label: "Auditory Processing",
    color: "#fb923c",
    info: {
      description:
        "Predicted activation in the superior temporal gyrus and primary auditory cortex — the brain's core sound-processing regions.",
      calculation:
        "TRIBE v2 uses Wav2Vec-BERT audio features mapped onto auditory cortex voxels.",
      interpretation:
        "Peaks mark salient sounds, music hits, or dynamic speech. Silent passages flatten the curve.",
    },
  },
  {
    key: "language_narrative",
    label: "Language / Narrative",
    color: "#22d3ee",
    info: {
      description:
        "Predicted activation in the language network — Broca's area, Wernicke's area, and the superior temporal sulcus — which handles speech comprehension and narrative structure.",
      calculation:
        "TRIBE v2 uses LLaMA 3.2 text features from transcribed speech projected onto language-network voxels.",
      interpretation:
        "High values during clear, compelling dialogue or voiceover. Drops signal unclear speech, jargon, or weak narrative flow.",
    },
  },
  {
    key: "default_mode",
    label: "Default Mode",
    color: "#fb7185",
    info: {
      description:
        "Predicted activation in the default mode network — medial prefrontal cortex, posterior cingulate, and angular gyrus — active during self-referential thought, imagination, and personal relevance.",
      calculation:
        "TRIBE v2 maps segment features onto canonical DMN voxels from its fMRI training set.",
      interpretation:
        "Sustained DMN activation predicts narrative immersion and personal connection — the 'this is about me' feeling.",
    },
  },
  {
    key: "motion_processing",
    label: "Motion Processing",
    color: "#a3e635",
    info: {
      description:
        "Predicted activation in motion-selective visual areas (MT/V5) — the regions that track movement, camera motion, and action.",
      calculation:
        "TRIBE v2 projects V-JEPA2 motion features onto MT/V5 voxels learned from fMRI.",
      interpretation:
        "Peaks align with action, fast cuts, camera pans, and kinetic scenes. Flat values indicate static shots.",
    },
  },
];

interface RegionBarChartProps {
  segments: SegmentData[];
  currentTime?: number;
}

export function RegionBarChart({ segments, currentTime = 0 }: RegionBarChartProps) {
  const [expanded, setExpanded] = useState(false);
  const currentRegions = getRegionsAtTime(segments, currentTime);

  const scores: Record<string, number> = {};
  for (const region of REGIONS) {
    scores[region.key] = currentRegions?.[region.key] ?? 0;
  }

  const visibleRegions = expanded ? REGIONS : REGIONS.slice(0, DEFAULT_VISIBLE_COUNT);

  return (
    <div className="rounded-xl p-6 glass-surface">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-on-surface-variant">neurology</span>
        <h3 className="font-headline text-lg font-bold">Brain Region Activation</h3>
        <MetricInfo
          title="Brain Region Activation"
          description="Shows how strongly each brain network is responding at the current moment. Higher bars indicate stronger neural activation in that region."
          calculation="Displays the region scores for the current 2-second segment. Bars update in real-time as the video plays."
          interpretation="Strong attention (>60%) = your hook grabs focus. Strong reward (>60%) = content feels rewarding. Strong emotional (>60%) = emotionally engaging."
        />
        <span className="hidden md:flex items-center gap-1 text-[10px] text-on-surface-variant font-medium ml-auto">
          <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" /></span>
          Updates with playback
        </span>
      </div>
      <div className="space-y-3">
        {visibleRegions.map((region, i) => {
          const score = scores[region.key] ?? 0;
          const pct = Math.round(score * 100);

          return (
            <motion.div
              key={region.key}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <span className="text-xs font-headline font-bold text-gray-500 w-[140px] text-right shrink-0 truncate">
                {region.label}
              </span>
              <MetricInfo
                title={region.label}
                description={region.info.description}
                calculation={region.info.calculation}
                interpretation={region.info.interpretation}
              />
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

      {REGIONS.length > DEFAULT_VISIBLE_COUNT && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full mt-3 py-2 text-xs font-headline uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center gap-1.5"
        >
          <span>{expanded ? "Show less" : `Show ${REGIONS.length - DEFAULT_VISIBLE_COUNT} more`}</span>
          <span
            className="material-symbols-outlined text-sm"
            style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }}
          >
            expand_more
          </span>
        </button>
      )}
    </div>
  );
}
