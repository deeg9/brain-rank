"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import { ContentTypeBadge } from "@/components/ui/ContentTypeBadge";
import { CONTENT_CATEGORIES } from "@/lib/categories";
import type { Job } from "@/lib/database.types";
import type { SegmentData } from "@/components/results/SegmentTable";
import { MetricInfo } from "@/components/results/MetricInfo";
import { InsightsSummaryCard } from "@/components/results/InsightsSummaryCard";
import { computeEngagement, computeRetention } from "@/lib/engagement";

const BrainViewer = dynamic(
  () => import("@/components/results/BrainViewer").then((m) => m.BrainViewer),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-[260px]" /> }
);

const NeuralTimeline = dynamic(
  () => import("@/components/results/NeuralTimeline").then((m) => m.NeuralTimeline),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-32" /> }
);

const RegionBarChart = dynamic(
  () => import("@/components/results/RegionBarChart").then((m) => m.RegionBarChart),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-32" /> }
);

interface ComparisonModalProps {
  jobIdA: string;
  jobIdB: string;
  open: boolean;
  onClose: () => void;
}

interface MetricItem {
  label: string;
  key: string;
  description: string;
  calculation: string;
  interpretation: string;
}

const METRICS: MetricItem[] = [
  {
    label: "Engagement Score",
    key: "engagement_score",
    description: "A composite score that weights a video's best moment, opening, and sustained engagement.",
    calculation: "0.40 × Peak + 0.30 × Hook + 0.30 × Retention. Retention here is the worst 10-second stretch in the video (see the Retention row).",
    interpretation: "Higher = content that opens strong, peaks hard, and avoids dead spots. Use this as the headline number when comparing two videos.",
  },
  {
    label: "Hook Score",
    key: "hook_score",
    description: "How effectively the first few seconds capture the viewer's attention.",
    calculation: "Average neural activation during the first 10 seconds of the content.",
    interpretation: "High hook scores (>70) mean strong opening engagement. Low scores suggest the intro may lose viewers.",
  },
  {
    label: "Retention",
    key: "retention_score",
    description: "How well the content avoids dead spots across its full duration.",
    calculation: "The lowest 10-second rolling average of activation anywhere in the video.",
    interpretation: "A strong opening or ending can't mask a boring middle. Low scores mean there's a stretch where viewers are likely to scroll away.",
  },
  {
    label: "Peak Score",
    key: "peak_score",
    description: "The highest moment of neural activation in the content.",
    calculation: "The 2-second segment with the maximum activation score in the video.",
    interpretation: "High peak scores (>80) indicate powerful climactic moments. Compare peaks to find which content has stronger highlight moments.",
  },
];

function DeltaCell({ a, b, disabled }: { a: number | null; b: number | null; disabled: boolean }) {
  if (disabled) return <span className="text-gray-400 text-xs">N/A</span>;
  if (a == null || b == null) return <span className="text-gray-400">—</span>;
  const delta = (b - a) * 100;
  if (Math.abs(delta) < 0.5) return <span className="text-gray-500">0</span>;
  const isPositive = delta > 0;
  return (
    <span className={`font-bold text-sm px-2 py-0.5 rounded ${isPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
      {isPositive ? "+" : ""}{delta.toFixed(0)}
    </span>
  );
}

function computedValue(key: string, summary: Record<string, number>, segments: SegmentData[]): number | null {
  if (key === "retention_score") {
    return segments.length > 0 ? computeRetention(segments) : null;
  }
  if (key === "engagement_score") {
    if (segments.length === 0) return null;
    const retention = computeRetention(segments);
    return computeEngagement({
      peak: summary.peak_score ?? 0,
      hook: summary.hook_score ?? 0,
      retention,
    });
  }
  return summary[key] ?? null;
}

function getSegmentAtTime(segments: SegmentData[], time: number): SegmentData | null {
  if (segments.length === 0) return null;
  for (const seg of segments) {
    if (time >= seg.start && time <= seg.end) return seg;
  }
  let closest = segments[0];
  let minDist = Infinity;
  for (const seg of segments) {
    const dist = Math.min(Math.abs(seg.start - time), Math.abs(seg.end - time));
    if (dist < minDist) { minDist = dist; closest = seg; }
  }
  return closest;
}

function categoryLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const cat = CONTENT_CATEGORIES.find((c) => c.value === value);
  return cat ? cat.label : value;
}

const VideoPlayer = React.forwardRef<
  HTMLVideoElement,
  { url: string; inputType?: string; textContent?: string | null; onTimeUpdate?: (t: number) => void }
>(function VideoPlayer({ url, inputType, textContent, onTimeUpdate }, ref) {
  if (inputType === "image") {
    return <img src={url} alt="" className="w-full h-full object-cover" />;
  }

  if (inputType === "text_spoken" || inputType === "text_visual") {
    return (
      <div className="p-4 text-center flex flex-col items-center justify-center h-full">
        <span className="material-symbols-outlined text-2xl text-gray-400 mb-2">
          {inputType === "text_spoken" ? "record_voice_over" : "text_fields"}
        </span>
        <p className="text-xs text-gray-600 line-clamp-3">&ldquo;{textContent}&rdquo;</p>
      </div>
    );
  }

  return (
    <video
      ref={ref}
      src={url}
      controls
      playsInline
      preload="metadata"
      className="w-full h-full object-contain bg-black"
      onTimeUpdate={(e) => onTimeUpdate?.((e.target as HTMLVideoElement).currentTime)}
    />
  );
});

export function ComparisonModal({ jobIdA, jobIdB, open, onClose }: ComparisonModalProps) {
  const [jobA, setJobA] = useState<Job | null>(null);
  const [jobB, setJobB] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const fetchJob = useCallback(async (id: string): Promise<Job | null> => {
    try {
      const res = await fetch(`/api/jobs/${id}`);
      if (res.ok) return res.json();
    } catch { /* silent */ }
    return null;
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([fetchJob(jobIdA), fetchJob(jobIdB)]).then(([a, b]) => {
      setJobA(a);
      setJobB(b);
      setLoading(false);
    });
  }, [open, jobIdA, jobIdB, fetchJob]);

  const resultsA = jobA?.results as Record<string, unknown> | null;
  const resultsB = jobB?.results as Record<string, unknown> | null;
  const summaryA = (resultsA?.summary || {}) as Record<string, number>;
  const summaryB = (resultsB?.summary || {}) as Record<string, number>;
  const segmentsA = (resultsA?.segments || []) as SegmentData[];
  const segmentsB = (resultsB?.segments || []) as SegmentData[];
  const durationA = (resultsA?.duration_seconds || 0) as number;
  const durationB = (resultsB?.duration_seconds || 0) as number;

  const isCrossType = jobA && jobB && jobA.input_type !== jobB.input_type;

  const titleFor = (job: Job | null) => {
    if (!job) return "Loading...";
    return job.title || (
      job.input_type === "image" ? "Image Analysis" :
      job.input_type === "text_spoken" ? "Text (Spoken)" :
      job.input_type === "text_visual" ? "Text (Visual)" :
      "Video Analysis"
    );
  };

  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const timeRefA = useRef<number>(0);
  const timeRefB = useRef<number>(0);
  const [currentTimeA, setCurrentTimeA] = useState(0);
  const [currentTimeB, setCurrentTimeB] = useState(0);

  const handleSeekA = useCallback((t: number) => {
    setCurrentTimeA(t);
    timeRefA.current = t;
    if (videoRefA.current) videoRefA.current.currentTime = t;
  }, []);

  const handleSeekB = useCallback((t: number) => {
    setCurrentTimeB(t);
    timeRefB.current = t;
    if (videoRefB.current) videoRefB.current.currentTime = t;
  }, []);

  const handleTimeUpdateA = useCallback((t: number) => {
    timeRefA.current = t;
    setCurrentTimeA(t);
  }, []);

  const handleTimeUpdateB = useCallback((t: number) => {
    timeRefB.current = t;
    setCurrentTimeB(t);
  }, []);

  const handleExport = useCallback(() => {
    const safeTitle = (t: string) => t.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40);

    const slimSegments = (segments: SegmentData[]) =>
      segments.map((s) => ({
        start: s.start,
        end: s.end,
        activation_score: s.activation_score,
        arousal: s.arousal,
        valence: s.valence,
        regions: s.regions,
      }));

    const buildAnalysisPayload = (
      id: string,
      job: Job | null,
      summary: Record<string, number>,
      segments: SegmentData[],
      duration: number
    ) => {
      const retention = computeRetention(segments);
      const engagement = computeEngagement({
        peak: summary.peak_score ?? 0,
        hook: summary.hook_score ?? 0,
        retention,
      });
      return {
        id,
        title: titleFor(job),
        input_type: job?.input_type ?? null,
        category: job?.category ?? null,
        duration_seconds: duration,
        insights: {
          engagement_score: engagement,
          hook_score: summary.hook_score ?? null,
          retention_score: retention,
          peak_score: summary.peak_score ?? null,
          peak_second: summary.peak_second ?? null,
        },
        segments: slimSegments(segments),
      };
    };

    const payload = {
      exported_at: new Date().toISOString(),
      cross_type: !!isCrossType,
      analysis_a: buildAnalysisPayload(jobIdA, jobA, summaryA, segmentsA, durationA),
      analysis_b: buildAnalysisPayload(jobIdB, jobB, summaryB, segmentsB, durationB),
      comparison: METRICS.reduce<Record<string, { a: number | null; b: number | null; delta: number | null }>>((acc, m) => {
        const a = computedValue(m.key, summaryA, segmentsA);
        const b = computedValue(m.key, summaryB, segmentsB);
        acc[m.key] = {
          a,
          b,
          delta: a != null && b != null ? b - a : null,
        };
        return acc;
      }, {}),
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `brainrank-compare-${safeTitle(titleFor(jobA))}-vs-${safeTitle(titleFor(jobB))}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [jobIdA, jobIdB, jobA, jobB, summaryA, summaryB, segmentsA, segmentsB, durationA, durationB, isCrossType]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative bg-white rounded-none md:rounded-2xl shadow-2xl w-full h-full md:h-auto md:max-w-6xl md:max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between z-10">
              <h2 className="text-xl font-headline font-bold text-gray-900">Compare Analyses</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <span className="material-symbols-outlined text-gray-600">close</span>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 [&_.glass-surface]:bg-white [&_.glass-surface]:backdrop-blur-none" style={{ scrollbarColor: '#d1d5db transparent', scrollbarWidth: 'thin' }}>
              {loading ? (
                <div className="p-5 md:p-8 space-y-4">
                  <Skeleton variant="card" className="h-48" />
                  <Skeleton variant="card" className="h-32" />
                </div>
              ) : (
                <div className="px-8 py-6 space-y-8">
                  {/* Cross-type disclaimer */}
                  {isCrossType && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-lg">warning</span>
                      <p className="text-amber-700 text-xs">
                        Different content types — scores may not be directly comparable.
                      </p>
                    </div>
                  )}

                  {/* Side-by-side: video + brain maps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-500 font-bold text-center mb-1">Analysis A</p>
                      <p className="text-gray-900 font-bold truncate text-center mb-2">{titleFor(jobA)}</p>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <ContentTypeBadge inputType={jobA?.input_type} />
                        {jobA?.category && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {categoryLabel(jobA.category)}
                          </span>
                        )}
                      </div>
                      <div className="aspect-video bg-black rounded-xl overflow-hidden">
                        <VideoPlayer ref={videoRefA} url={jobA?.video_url || ""} inputType={jobA?.input_type} textContent={jobA?.text_content} onTimeUpdate={handleTimeUpdateA} />
                      </div>
                      <div className="h-[280px] rounded-xl overflow-hidden bg-white mt-4">
                        <BrainViewer segments={segmentsA} currentTimeRef={timeRefA} currentTime={currentTimeA} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-500 font-bold text-center mb-1">Analysis B</p>
                      <p className="text-gray-900 font-bold truncate text-center mb-2">{titleFor(jobB)}</p>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <ContentTypeBadge inputType={jobB?.input_type} />
                        {jobB?.category && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {categoryLabel(jobB.category)}
                          </span>
                        )}
                      </div>
                      <div className="aspect-video bg-black rounded-xl overflow-hidden">
                        <VideoPlayer ref={videoRefB} url={jobB?.video_url || ""} inputType={jobB?.input_type} textContent={jobB?.text_content} onTimeUpdate={handleTimeUpdateB} />
                      </div>
                      <div className="h-[280px] rounded-xl overflow-hidden bg-white mt-4">
                        <BrainViewer segments={segmentsB} currentTimeRef={timeRefB} currentTime={currentTimeB} />
                      </div>
                    </div>
                  </div>

                  {/* Comparison Table */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">compare_arrows</span>
                      Comparison Table
                      <MetricInfo
                        title="Comparison Table"
                        description="Side-by-side comparison of key neural engagement metrics between two analyses."
                        calculation="Each metric is independently computed by TRIBE v2 for both analyses. The Delta column shows the difference (B minus A)."
                        interpretation="Positive deltas (green) mean Analysis B scored higher. Negative deltas (red) mean Analysis A scored higher. Use this to identify which content performs better across each dimension."
                      />
                    </p>
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left text-xs uppercase tracking-widest text-gray-500 font-bold px-5 py-3">Metric</th>
                            <th className="text-center text-xs uppercase tracking-widest text-gray-500 font-bold px-5 py-3">Analysis A</th>
                            <th className="text-center text-xs uppercase tracking-widest text-gray-500 font-bold px-5 py-3">Delta</th>
                            <th className="text-center text-xs uppercase tracking-widest text-gray-500 font-bold px-5 py-3">Analysis B</th>
                          </tr>
                        </thead>
                        <tbody>
                          {METRICS.map((m) => {
                            const valA = computedValue(m.key, summaryA, segmentsA);
                            const valB = computedValue(m.key, summaryB, segmentsB);
                            return (
                              <tr key={m.key} className="border-t border-gray-100">
                                <td className="px-5 py-3 text-gray-900 text-sm font-bold">
                                  <span className="inline-flex items-center">
                                    {m.label}
                                    <MetricInfo
                                      title={m.label}
                                      description={m.description}
                                      calculation={m.calculation}
                                      interpretation={m.interpretation}
                                    />
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-center text-gray-900 font-bold">{valA != null ? `${Math.round(valA * 100)}` : "—"}</td>
                                <td className="px-5 py-3 text-center">
                                  <DeltaCell a={valA} b={valB} disabled={!!isCrossType} />
                                </td>
                                <td className="px-5 py-3 text-center text-gray-900 font-bold">{valB != null ? `${Math.round(valB * 100)}` : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Neural Activation Timeline (or Region Bars when too short for a timeline) */}
                  {(segmentsA.length > 0 || segmentsB.length > 0) && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div>
                          {durationA < 10 ? (
                            <RegionBarChart segments={segmentsA} currentTime={currentTimeA} />
                          ) : (
                            <NeuralTimeline
                              segments={segmentsA}
                              duration={durationA}
                              currentTime={currentTimeA}
                              onSeek={handleSeekA}
                              syncId="compare-timeline-a"
                            />
                          )}
                        </div>
                        <div>
                          {durationB < 10 ? (
                            <RegionBarChart segments={segmentsB} currentTime={currentTimeB} />
                          ) : (
                            <NeuralTimeline
                              segments={segmentsB}
                              duration={durationB}
                              currentTime={currentTimeB}
                              onSeek={handleSeekB}
                              syncId="compare-timeline-b"
                            />
                          )}
                        </div>
                      </div>
                      {(durationA < 10 || durationB < 10) && (
                        <p className="text-xs text-gray-500 mt-3">
                          Inputs under 10 seconds don&apos;t generate enough data points for a full timeline. Region scores are shown as a snapshot instead.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Insights Summary — per-analysis, stacked layout */}
                  {segmentsA.length > 0 && segmentsB.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <InsightsSummaryCard
                        summary={{
                          hook_score: summaryA.hook_score ?? 0,
                          retention_score: summaryA.retention_score ?? 0,
                          peak_second: summaryA.peak_second ?? 0,
                          peak_score: summaryA.peak_score ?? 0,
                        }}
                        segments={segmentsA}
                        arousal={getSegmentAtTime(segmentsA, currentTimeA)?.arousal ?? 0}
                        valence={getSegmentAtTime(segmentsA, currentTimeA)?.valence ?? 0}
                        layout="stacked"
                      />
                      <InsightsSummaryCard
                        summary={{
                          hook_score: summaryB.hook_score ?? 0,
                          retention_score: summaryB.retention_score ?? 0,
                          peak_second: summaryB.peak_second ?? 0,
                          peak_score: summaryB.peak_score ?? 0,
                        }}
                        segments={segmentsB}
                        arousal={getSegmentAtTime(segmentsB, currentTimeB)?.arousal ?? 0}
                        valence={getSegmentAtTime(segmentsB, currentTimeB)?.valence ?? 0}
                        layout="stacked"
                      />
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleExport}
                      className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      Export Comparison
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
