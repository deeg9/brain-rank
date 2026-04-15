"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Job } from "@/lib/database.types";
import {
  parseJobResults,
  formatTimestamp,
  type ResultsData,
} from "@/lib/results";
import { MetricCard } from "@/components/results/MetricCard";
import { ActivationTimeline } from "@/components/results/ActivationTimeline";
import { Skeleton } from "@/components/ui";

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto space-y-8"><Skeleton variant="card" className="aspect-video" /></div>}>
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "Job not found"
              : `Failed to fetch job: ${res.status}`
          );
        }
        const data = await res.json();
        setJob(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [jobId]);

  // No jobId provided
  if (!jobId) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
            Results
          </h1>
          <p className="text-on-surface-variant mt-2 text-lg">
            Select an analysis from the dashboard to view results
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-block neural-gradient text-on-background py-3 px-6 rounded-lg font-headline font-bold text-sm tracking-widest uppercase hover:brightness-110 transition-all"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <Skeleton variant="card" className="aspect-video" />
          </div>
          <div className="col-span-4 flex flex-col gap-4">
            <Skeleton variant="card" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton variant="card" className="h-28" />
              <Skeleton variant="card" className="h-28" />
            </div>
            <Skeleton variant="card" />
          </div>
        </div>
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-surface-container-high rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-error text-5xl mb-4 block">
            error
          </span>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
            {error}
          </h2>
          <p className="text-on-surface-variant mb-6">
            The analysis could not be loaded. Please try again.
          </p>
          <Link
            href="/dashboard"
            className="inline-block neural-gradient text-on-background py-3 px-6 rounded-lg font-headline font-bold text-sm tracking-widest uppercase hover:brightness-110 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Job still processing
  if (job && job.status !== "completed") {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-surface-container-high rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-secondary text-5xl mb-4 block">
            hourglass_top
          </span>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
            This analysis is still processing
          </h2>
          <p className="text-on-surface-variant mb-6">
            Your video is being analyzed. Check back soon for results.
          </p>
          <Link
            href={`/processing?jobId=${jobId}`}
            className="inline-block neural-gradient text-on-background py-3 px-6 rounded-lg font-headline font-bold text-sm tracking-widest uppercase hover:brightness-110 transition-all"
          >
            View Progress
          </Link>
        </div>
      </div>
    );
  }

  const results: ResultsData | null = job
    ? parseJobResults(job.results)
    : null;

  // Results failed to parse
  if (!results) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-surface-container-high rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-error text-5xl mb-4 block">
            warning
          </span>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
            Results unavailable
          </h2>
          <p className="text-on-surface-variant mb-6">
            The analysis data could not be parsed. This may indicate a
            processing error.
          </p>
          <Link
            href="/dashboard"
            className="inline-block neural-gradient text-on-background py-3 px-6 rounded-lg font-headline font-bold text-sm tracking-widest uppercase hover:brightness-110 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { summary } = results;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Row 1: Player + Metrics */}
      <div className="grid grid-cols-12 gap-6">
        {/* Video Player Placeholder */}
        <div className="col-span-8 bg-surface-container-lowest rounded-xl aspect-video flex items-center justify-center relative overflow-hidden">
          <button className="z-10 w-20 h-20 bg-surface-bright/80 backdrop-blur-md rounded-full flex items-center justify-center text-primary hover:scale-110 transition-transform">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              play_arrow
            </span>
          </button>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container-highest">
            <div className="h-full bg-primary w-0" />
          </div>
        </div>

        {/* Summary Metric Cards Stack */}
        <div className="col-span-4 flex flex-col gap-4">
          <MetricCard
            label="Overall Score"
            value={Math.round(summary.overall * 100)}
            icon="analytics"
            colorClass="text-on-surface"
            className="glass-surface glow-primary-lg"
            animate
            numericValue={Math.round(summary.overall * 100)}
          />
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Hook Score"
              value={Math.round(summary.hook_score * 100)}
              colorClass="text-secondary"
              className="p-5 glass-surface"
              animate
              numericValue={Math.round(summary.hook_score * 100)}
            />
            <MetricCard
              label="Retention"
              value={`${Math.round(summary.retention_score * 100)}%`}
              colorClass="text-tertiary-fixed-dim"
              className="p-5 glass-surface"
              animate
              numericValue={Math.round(summary.retention_score * 100)}
              suffix="%"
            />
          </div>
          <MetricCard
            label="Peak Moment"
            value={formatTimestamp(summary.peak_second)}
            sublabel={`Peak Score: ${summary.peak_score.toFixed(2)}`}
            className="glass-surface"
          />
        </div>
      </div>

      {/* Row 2: Neural Activation Timeline */}
      <div className="animate-score-in">
      <ActivationTimeline
        segments={results.segments}
        duration={results.duration_seconds}
      />
      </div>

      {/* Row 3: View Full Analysis link */}
      <div className="flex justify-end">
        <Link
          href={`/results/${jobId}`}
          className="neural-gradient text-on-background py-4 px-8 rounded-xl font-headline font-bold text-base tracking-widest uppercase shadow-lg shadow-primary/20 hover:brightness-110 hover:glow-primary active:scale-[0.98] transition-all duration-300"
        >
          View Full Analysis
        </Link>
      </div>
    </div>
  );
}
