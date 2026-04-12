"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import { ContentTypeBadge } from "@/components/ui/ContentTypeBadge";
import type { Job } from "@/lib/database.types";
import type { SegmentData } from "@/components/results/SegmentTable";

const BrainViewer = dynamic(
  () => import("@/components/results/BrainViewer").then((m) => m.BrainViewer),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-[200px]" /> }
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
}

const METRICS: MetricItem[] = [
  { label: "Overall Score", key: "overall" },
  { label: "Hook Score", key: "hook_score" },
  { label: "Retention Score", key: "retention_score" },
  { label: "Peak Score", key: "peak_score" },
];

function DeltaCell({ a, b, disabled }: { a: number | null; b: number | null; disabled: boolean }) {
  if (disabled) return <span className="text-on-surface-variant/40 text-xs">N/A</span>;
  if (a == null || b == null) return <span className="text-on-surface-variant/40">—</span>;
  const delta = b - a;
  if (Math.abs(delta) < 0.01) return <span className="text-on-surface-variant/60">0</span>;
  const isPositive = delta > 0;
  return (
    <span className={`font-bold text-sm px-2 py-0.5 rounded ${isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
      {isPositive ? "+" : ""}{delta.toFixed(1)}
    </span>
  );
}

function MetricCard({ label, value, unit }: { label: string; value: string | number | null; unit?: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{label}</p>
      <p className="text-xl font-headline font-bold text-on-surface">
        {value ?? "—"}{unit && <span className="text-sm text-on-surface-variant">{unit}</span>}
      </p>
    </div>
  );
}

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

  // Shared ref for brain viewer (no video sync in comparison)
  const timeRefA = { current: 0 };
  const timeRefB = { current: 0 };

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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative bg-surface-container rounded-2xl shadow-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-surface-container/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-headline font-bold text-on-surface">Compare Analyses</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 space-y-4">
                <Skeleton variant="card" className="h-48" />
                <Skeleton variant="card" className="h-32" />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Cross-type disclaimer */}
                {isCrossType && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-lg">warning</span>
                    <p className="text-amber-200 text-xs">
                      Different content types — scores may not be directly comparable.
                    </p>
                  </div>
                )}

                {/* Side-by-side titles + badges */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Analysis A</p>
                      <ContentTypeBadge inputType={jobA?.input_type} />
                    </div>
                    <p className="text-on-surface font-bold truncate">{titleFor(jobA)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Analysis B</p>
                      <ContentTypeBadge inputType={jobB?.input_type} />
                    </div>
                    <p className="text-on-surface font-bold truncate">{titleFor(jobB)}</p>
                  </div>
                </div>

                {/* Side-by-side media previews */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="aspect-video bg-surface-container-high rounded-xl overflow-hidden flex items-center justify-center">
                    {jobA?.input_type === "video" || !jobA?.input_type ? (
                      <div className="relative w-full h-full bg-black flex items-center justify-center">
                        <img src={`https://img.youtube.com/vi/default/0.jpg`} alt="" className="w-full h-full object-cover opacity-50" />
                        <span className="absolute material-symbols-outlined text-4xl text-white/60">play_circle</span>
                      </div>
                    ) : jobA?.input_type === "image" ? (
                      <img src={jobA.video_url} alt="Analysis A" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-4 text-center">
                        <span className="material-symbols-outlined text-2xl text-on-surface-variant/50 mb-2">
                          {jobA.input_type === "text_spoken" ? "record_voice_over" : "text_fields"}
                        </span>
                        <p className="text-xs text-on-surface/60 line-clamp-3">&ldquo;{jobA.text_content}&rdquo;</p>
                      </div>
                    )}
                  </div>
                  <div className="aspect-video bg-surface-container-high rounded-xl overflow-hidden flex items-center justify-center">
                    {jobB?.input_type === "video" || !jobB?.input_type ? (
                      <div className="relative w-full h-full bg-black flex items-center justify-center">
                        <img src={`https://img.youtube.com/vi/default/0.jpg`} alt="" className="w-full h-full object-cover opacity-50" />
                        <span className="absolute material-symbols-outlined text-4xl text-white/60">play_circle</span>
                      </div>
                    ) : jobB?.input_type === "image" ? (
                      <img src={jobB.video_url} alt="Analysis B" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-4 text-center">
                        <span className="material-symbols-outlined text-2xl text-on-surface-variant/50 mb-2">
                          {jobB.input_type === "text_spoken" ? "record_voice_over" : "text_fields"}
                        </span>
                        <p className="text-xs text-on-surface/60 line-clamp-3">&ldquo;{jobB.text_content}&rdquo;</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Side-by-side brain activation maps */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">neurology</span>
                      Neural Activation Map
                    </p>
                    <div className="h-[200px] rounded-xl overflow-hidden bg-surface-container-high">
                      <BrainViewer segments={segmentsA} currentTimeRef={timeRefA} currentTime={0} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">neurology</span>
                      Neural Activation Map
                    </p>
                    <div className="h-[200px] rounded-xl overflow-hidden bg-surface-container-high">
                      <BrainViewer segments={segmentsB} currentTimeRef={timeRefB} currentTime={0} />
                    </div>
                  </div>
                </div>

                {/* Key metrics row */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex justify-around py-3 bg-white/[0.02] rounded-xl">
                    <MetricCard label="Hook Strength" value={summaryA.hook_score?.toFixed(0) ?? null} />
                    <MetricCard label="Retention" value={summaryA.retention_score?.toFixed(0) ?? null} />
                    <MetricCard label="Peak Moment" value={summaryA.peak_second?.toFixed(0) ?? null} unit="s" />
                  </div>
                  <div className="flex justify-around py-3 bg-white/[0.02] rounded-xl">
                    <MetricCard label="Hook Strength" value={summaryB.hook_score?.toFixed(0) ?? null} />
                    <MetricCard label="Retention" value={summaryB.retention_score?.toFixed(0) ?? null} />
                    <MetricCard label="Peak Moment" value={summaryB.peak_second?.toFixed(0) ?? null} unit="s" />
                  </div>
                </div>

                {/* Comparison Table */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">compare_arrows</span>
                    Comparison Table
                  </p>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white/[0.03]">
                          <th className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant font-bold px-4 py-3">Metric</th>
                          <th className="text-center text-[10px] uppercase tracking-widest text-on-surface-variant font-bold px-4 py-3">Analysis A Score</th>
                          <th className="text-center text-[10px] uppercase tracking-widest text-on-surface-variant font-bold px-4 py-3">Delta</th>
                          <th className="text-center text-[10px] uppercase tracking-widest text-on-surface-variant font-bold px-4 py-3">Analysis B Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {METRICS.map((m) => {
                          const valA = summaryA[m.key] ?? null;
                          const valB = summaryB[m.key] ?? null;
                          return (
                            <tr key={m.key} className="border-t border-white/5">
                              <td className="px-4 py-3 text-on-surface text-sm font-medium">{m.label}</td>
                              <td className="px-4 py-3 text-center text-on-surface font-bold">{valA != null ? valA.toFixed(0) : "—"}</td>
                              <td className="px-4 py-3 text-center">
                                <DeltaCell a={valA} b={valB} disabled={!!isCrossType} />
                              </td>
                              <td className="px-4 py-3 text-center text-on-surface font-bold">{valB != null ? valB.toFixed(0) : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Neural Activation Timeline (Analysis A) */}
                {segmentsA.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">timeline</span>
                      Neural Activation Timeline
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="h-32">
                        <NeuralTimeline
                          segments={segmentsA}
                          duration={durationA}
                          currentTime={0}
                          onSeek={() => {}}
                        />
                      </div>
                      <div className="h-32">
                        <NeuralTimeline
                          segments={segmentsB}
                          duration={durationB}
                          currentTime={0}
                          onSeek={() => {}}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Close Modal
                  </button>
                  <button
                    className="px-6 py-2.5 bg-on-surface text-surface rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                  >
                    Export Comparison
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
