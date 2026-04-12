"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ContentTypeBadge } from "@/components/ui/ContentTypeBadge";
import type { Job, InputType } from "@/lib/database.types";

interface AnalysisOption {
  id: string;
  title: string | null;
  input_type: InputType;
  video_url: string;
  text_content: string | null;
  created_at: string;
}

interface MetricRow {
  label: string;
  a: number | null;
  b: number | null;
}

function MetricDelta({ a, b }: { a: number | null; b: number | null }) {
  if (a == null || b == null) return <span className="text-on-surface-variant/50">—</span>;
  const delta = b - a;
  if (Math.abs(delta) < 0.01) return <span className="text-on-surface-variant/60">0.0</span>;
  const color = delta > 0 ? "text-emerald-400" : "text-red-400";
  const sign = delta > 0 ? "+" : "";
  return <span className={`font-bold ${color}`}>{sign}{delta.toFixed(2)}</span>;
}

function extractMetrics(results: Record<string, unknown> | null): MetricRow[] {
  if (!results) return [];
  const summary = results.summary as Record<string, number> | undefined;
  if (!summary) return [];
  return [
    { label: "Overall", a: summary.overall ?? null, b: null },
    { label: "Hook Score", a: summary.hook_score ?? null, b: null },
    { label: "Retention", a: summary.retention_score ?? null, b: null },
    { label: "Peak Score", a: summary.peak_score ?? null, b: null },
  ];
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [analyses, setAnalyses] = useState<AnalysisOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobA, setJobA] = useState<Job | null>(null);
  const [jobB, setJobB] = useState<Job | null>(null);
  const [selectedA, setSelectedA] = useState(searchParams.get("a") || "");
  const [selectedB, setSelectedB] = useState(searchParams.get("b") || "");

  // Fetch user's completed analyses
  useEffect(() => {
    async function fetchAnalyses() {
      try {
        const res = await fetch("/api/jobs?status=completed");
        if (res.ok) {
          const data = await res.json();
          setAnalyses(data.jobs || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchAnalyses();
  }, []);

  // Fetch selected jobs
  const fetchJob = useCallback(async (id: string): Promise<Job | null> => {
    if (!id) return null;
    try {
      const res = await fetch(`/api/jobs/${id}`);
      if (res.ok) return res.json();
    } catch {
      // silent
    }
    return null;
  }, []);

  useEffect(() => {
    if (selectedA) fetchJob(selectedA).then(setJobA);
    else setJobA(null);
  }, [selectedA, fetchJob]);

  useEffect(() => {
    if (selectedB) fetchJob(selectedB).then(setJobB);
    else setJobB(null);
  }, [selectedB, fetchJob]);

  const resultsA = jobA?.results as Record<string, unknown> | null;
  const resultsB = jobB?.results as Record<string, unknown> | null;
  const summaryA = (resultsA?.summary || {}) as Record<string, number>;
  const summaryB = (resultsB?.summary || {}) as Record<string, number>;

  const metrics: { label: string; key: string }[] = [
    { label: "Overall", key: "overall" },
    { label: "Hook Score", key: "hook_score" },
    { label: "Retention", key: "retention_score" },
    { label: "Peak Score", key: "peak_score" },
  ];

  const isCrossType = jobA && jobB && jobA.input_type !== jobB.input_type;

  const titleFor = (job: Job | null) => {
    if (!job) return "Select analysis";
    return job.title || (
      job.input_type === "image" ? "Image Analysis" :
      job.input_type === "text_spoken" ? "Text (Spoken)" :
      job.input_type === "text_visual" ? "Text (Visual)" :
      "Video Analysis"
    );
  };

  return (
    <div className="max-w-6xl mx-auto pt-6 space-y-8">
      <motion.header
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h2 className="text-4xl font-headline font-bold tracking-tight text-on-surface">
          Compare Analyses
        </h2>
        <p className="text-on-surface-variant font-body">
          Select any two completed analyses to compare their neural scores side by side.
        </p>
      </motion.header>

      {/* Cross-type disclaimer */}
      {isCrossType && (
        <motion.div
          className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-6 py-4 flex items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="material-symbols-outlined text-amber-400">warning</span>
          <p className="text-amber-200 text-sm">
            <strong>Different content types.</strong> Scores from {jobA?.input_type} and {jobB?.input_type} analyses may not be directly comparable due to different inference paths.
          </p>
        </motion.div>
      )}

      {/* Analysis Selectors */}
      <motion.div
        className="grid grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
        {/* Selector A */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
            Analysis A
          </label>
          <select
            value={selectedA}
            onChange={(e) => setSelectedA(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-on-surface font-body focus:outline-none focus:border-primary/50 transition-colors appearance-none"
          >
            <option value="">Select an analysis...</option>
            {analyses.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === selectedB}>
                {a.title || a.id.slice(0, 8)} ({a.input_type})
              </option>
            ))}
          </select>
        </div>

        {/* Selector B */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
            Analysis B
          </label>
          <select
            value={selectedB}
            onChange={(e) => setSelectedB(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-on-surface font-body focus:outline-none focus:border-primary/50 transition-colors appearance-none"
          >
            <option value="">Select an analysis...</option>
            {analyses.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === selectedA}>
                {a.title || a.id.slice(0, 8)} ({a.input_type})
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Comparison Results */}
      {jobA && jobB && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          {/* Title + Badge Row */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-4 flex items-center gap-3">
              <ContentTypeBadge inputType={jobA.input_type} />
              <span className="text-on-surface font-bold truncate">{titleFor(jobA)}</span>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <ContentTypeBadge inputType={jobB.input_type} />
              <span className="text-on-surface font-bold truncate">{titleFor(jobB)}</span>
            </Card>
          </div>

          {/* Metrics Comparison Table */}
          <GlassPanel className="rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant font-bold px-6 py-4">Metric</th>
                  <th className="text-center text-[10px] uppercase tracking-widest text-on-surface-variant font-bold px-6 py-4">Analysis A</th>
                  <th className="text-center text-[10px] uppercase tracking-widest text-on-surface-variant font-bold px-6 py-4">Delta</th>
                  <th className="text-center text-[10px] uppercase tracking-widest text-on-surface-variant font-bold px-6 py-4">Analysis B</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => {
                  const valA = summaryA[m.key] ?? null;
                  const valB = summaryB[m.key] ?? null;
                  return (
                    <tr key={m.key} className="border-b border-white/5">
                      <td className="px-6 py-4 text-on-surface font-medium">{m.label}</td>
                      <td className="px-6 py-4 text-center text-on-surface font-bold">
                        {valA != null ? valA.toFixed(2) : "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isCrossType ? (
                          <span className="text-on-surface-variant/40 text-xs">N/A</span>
                        ) : (
                          <MetricDelta a={valA} b={valB} />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-on-surface font-bold">
                        {valB != null ? valB.toFixed(2) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </GlassPanel>

          {isCrossType && (
            <p className="text-center text-on-surface-variant/60 text-xs">
              Delta calculations disabled for cross-type comparisons.
            </p>
          )}
        </motion.div>
      )}

      {/* Empty state */}
      {!jobA && !jobB && !loading && (
        <motion.div
          className="text-center py-16 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">compare_arrows</span>
          <p className="text-on-surface-variant">Select two analyses above to compare their neural scores.</p>
        </motion.div>
      )}
    </div>
  );
}
