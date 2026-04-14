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

const BrainViewer = dynamic(
  () => import("@/components/results/BrainViewer").then((m) => m.BrainViewer),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-[260px]" /> }
);

const NeuralTimeline = dynamic(
  () => import("@/components/results/NeuralTimeline").then((m) => m.NeuralTimeline),
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
    label: "Overall Score",
    key: "overall",
    description: "A composite score reflecting the overall neural engagement of your content.",
    calculation: "Weighted average across all brain network activations predicted by BrainRank.",
    interpretation: "Higher scores indicate stronger overall brain engagement. Compare across analyses to see which content resonates more.",
  },
  {
    label: "Hook Score",
    key: "hook_score",
    description: "How effectively the first few seconds capture the viewer's attention.",
    calculation: "Based on attention and reward network activation during the opening segment of the content.",
    interpretation: "High hook scores (>70) mean strong opening engagement. Low scores suggest the intro may lose viewers.",
  },
  {
    label: "Retention Score",
    key: "retention_score",
    description: "How well the content maintains neural engagement over its full duration.",
    calculation: "Measures consistency of activation across all segments, penalizing sharp drops in attention or reward.",
    interpretation: "High retention (>70) means sustained engagement. Low scores indicate drop-off points where viewers may leave.",
  },
  {
    label: "Peak Score",
    key: "peak_score",
    description: "The highest moment of neural activation in the content.",
    calculation: "Maximum activation value across attention and reward networks in any single segment.",
    interpretation: "High peak scores (>80) indicate powerful climactic moments. Compare peaks to find which content has stronger highlight moments.",
  },
];

function DeltaCell({ a, b, disabled }: { a: number | null; b: number | null; disabled: boolean }) {
  if (disabled) return <span className="text-gray-400 text-xs">N/A</span>;
  if (a == null || b == null) return <span className="text-gray-400">—</span>;
  const delta = b - a;
  if (Math.abs(delta) < 0.01) return <span className="text-gray-500">0</span>;
  const isPositive = delta > 0;
  return (
    <span className={`font-bold text-sm px-2 py-0.5 rounded ${isPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
      {isPositive ? "+" : ""}{delta.toFixed(1)}
    </span>
  );
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
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
                <div className="p-8 space-y-4">
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
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-500 font-bold text-center mb-1">Analysis A</p>
                      <p className="text-gray-900 font-bold truncate text-center mb-2">{titleFor(jobA)}</p>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <ContentTypeBadge inputType={jobA?.input_type} />
                        {(jobA as Record<string, unknown>)?.category && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {categoryLabel((jobA as Record<string, unknown>).category as string)}
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
                        {(jobB as Record<string, unknown>)?.category && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {categoryLabel((jobB as Record<string, unknown>).category as string)}
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
                        calculation="Each metric is independently computed by BrainRank for both analyses. The Delta column shows the difference (B minus A)."
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
                            const valA = summaryA[m.key] ?? null;
                            const valB = summaryB[m.key] ?? null;
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
                                <td className="px-5 py-3 text-center text-gray-900 font-bold">{valA != null ? valA.toFixed(0) : "—"}</td>
                                <td className="px-5 py-3 text-center">
                                  <DeltaCell a={valA} b={valB} disabled={!!isCrossType} />
                                </td>
                                <td className="px-5 py-3 text-center text-gray-900 font-bold">{valB != null ? valB.toFixed(0) : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Neural Activation Timeline */}
                  {segmentsA.length > 0 && (
                    <div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <NeuralTimeline
                            segments={segmentsA}
                            duration={durationA}
                            currentTime={currentTimeA}
                            onSeek={handleSeekA}
                            syncId="compare-timeline-a"
                          />
                        </div>
                        <div>
                          <NeuralTimeline
                            segments={segmentsB}
                            duration={durationB}
                            currentTime={currentTimeB}
                            onSeek={handleSeekB}
                            syncId="compare-timeline-b"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
                    >
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
