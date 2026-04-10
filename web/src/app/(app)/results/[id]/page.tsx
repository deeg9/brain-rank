"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import { RegionBreakdown, type RegionScores } from "@/components/results/RegionBreakdown";
import { SegmentTable, type SegmentData } from "@/components/results/SegmentTable";
import { ExportButton } from "@/components/results/ExportButton";
import { formatTimestamp } from "@/lib/results";
import type { Job } from "@/lib/database.types";

const NeuralTimeline = dynamic(
  () => import("@/components/results/NeuralTimeline").then(m => m.NeuralTimeline),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-96" /> }
);

interface ResultsData {
  video_url: string;
  duration_seconds: number;
  segments: SegmentData[];
  summary: {
    overall: number;
    hook_score: number;
    retention_score: number;
    peak_second: number;
    peak_score: number;
  };
  raw_shape: number[];
}

interface Props {
  params: Promise<{ id: string }>;
}

function extractFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").pop() || "video";
  } catch {
    return url.split("/").pop() || "video";
  }
}

function gradeFromScore(score: number): string {
  if (score >= 0.9) return "S";
  if (score >= 0.8) return "A";
  if (score >= 0.7) return "B";
  if (score >= 0.5) return "C";
  return "D";
}

export default function ResultsDetailPage({ params }: Props) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "Analysis not found"
              : `Failed to load analysis (${res.status})`
          );
        }
        const data = await res.json();
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="bar" className="h-8 w-64" />
        <Skeleton variant="card" className="h-64" />
        <Skeleton variant="card" className="h-96" />
        <Skeleton variant="card" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5">
            <Skeleton variant="card" className="h-72" />
          </div>
          <div className="col-span-7">
            <Skeleton variant="card" className="h-72" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-sm">
            arrow_back_ios
          </span>
          <span className="font-headline uppercase tracking-widest text-xs">
            Back
          </span>
        </Link>
        <Card className="p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-error mb-4">
            error
          </span>
          <p className="font-headline text-lg font-bold text-on-surface mb-2">
            Error Loading Results
          </p>
          <p className="text-on-surface-variant">{error}</p>
        </Card>
      </div>
    );
  }

  if (!job) return null;

  if (job.status !== "completed" || !job.results) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-sm">
            arrow_back_ios
          </span>
          <span className="font-headline uppercase tracking-widest text-xs">
            Back
          </span>
        </Link>
        <Card className="p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-secondary mb-4">
            hourglass_empty
          </span>
          <p className="font-headline text-lg font-bold text-on-surface mb-2">
            Analysis In Progress
          </p>
          <p className="text-on-surface-variant">
            This analysis is still processing. Check back shortly.
          </p>
          <Link
            href={`/processing?jobId=${id}`}
            className="inline-block mt-4 text-primary font-headline text-sm font-bold hover:opacity-80 transition-opacity"
          >
            View Processing Status
          </Link>
        </Card>
      </div>
    );
  }

  const results = job.results as unknown as ResultsData;
  const segments = results.segments ?? [];
  const summary = results.summary ?? {
    overall: 0,
    hook_score: 0,
    retention_score: 0,
    peak_second: 0,
    peak_score: 0,
  };

  const avgRegions: RegionScores =
    segments.length > 0
      ? {
          attention:
            segments.reduce((s, seg) => s + seg.regions.attention, 0) /
            segments.length,
          reward:
            segments.reduce((s, seg) => s + seg.regions.reward, 0) /
            segments.length,
          emotional_processing:
            segments.reduce(
              (s, seg) => s + seg.regions.emotional_processing,
              0
            ) / segments.length,
          social_cognition:
            segments.reduce((s, seg) => s + seg.regions.social_cognition, 0) /
            segments.length,
        }
      : { attention: 0, reward: 0, emotional_processing: 0, social_cognition: 0 };

  const grade = gradeFromScore(summary.overall);
  const filename = extractFilename(job.video_url);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back_ios
            </span>
            <span className="font-headline uppercase tracking-widest text-xs">
              Back
            </span>
          </Link>
          <h2 className="text-on-surface font-black text-lg tracking-tight">
            {filename}
          </h2>
        </div>
        <ExportButton
          data={job.results as Record<string, unknown>}
          filename={`neurocut-${id}.json`}
        />
      </div>

      {/* Video Player Placeholder */}
      <div className="bg-surface-container rounded-xl overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <div className="absolute inset-0 bg-surface-container-lowest flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 opacity-40">
              <span className="material-symbols-outlined text-5xl text-on-surface">
                play_circle
              </span>
              <span className="font-mono text-xs text-on-surface-variant">
                {formatTimestamp(results.duration_seconds)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Neural Activation Timeline */}
      <NeuralTimeline segments={segments} duration={results.duration_seconds} />

      {/* Summary Score Cards */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <div className="bg-surface-container rounded-xl p-8 flex items-center justify-between">
            <div>
              <p className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                Synthesized Score
              </p>
              <h4 className="font-headline text-3xl font-black italic">
                {grade}-GRADE
              </h4>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-tertiary-fixed flex items-center justify-center">
              <span className="font-headline text-2xl font-black text-tertiary-fixed">
                {Math.round(summary.overall * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <Card className="col-span-4 p-6">
          <p className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-2">
            Hook Score
          </p>
          <p className="font-headline text-3xl font-bold text-secondary">
            {Math.round(summary.hook_score * 100)}%
          </p>
        </Card>
        <Card className="col-span-4 p-6">
          <p className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-2">
            Retention
          </p>
          <p className="font-headline text-3xl font-bold text-tertiary-fixed">
            {Math.round(summary.retention_score * 100)}%
          </p>
        </Card>
        <Card className="col-span-4 p-6">
          <p className="text-xs font-bold font-headline uppercase tracking-widest text-on-surface-variant mb-2">
            Peak Moment
          </p>
          <p className="font-headline text-3xl font-bold text-primary">
            {summary.peak_second}s
          </p>
          <p className="text-on-surface-variant text-xs mt-1">
            Score: {Math.round(summary.peak_score * 100)}%
          </p>
        </Card>
      </div>

      {/* Region Breakdown + Segment Table */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5">
          <RegionBreakdown regions={avgRegions} />
        </div>
        <div className="col-span-7">
          <SegmentTable segments={segments} />
        </div>
      </div>
    </div>
  );
}
