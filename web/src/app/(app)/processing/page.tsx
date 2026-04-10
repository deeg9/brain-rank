"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, StatusBadge, Skeleton, WaveLoader } from "@/components/ui";
import {
  fetchJobStatus,
  retryJob,
  STAGES,
  getStageProgress,
  getStageIndex,
  type JobStatusResponse,
  type JobStage,
} from "@/lib/jobs";

/* ---------- Decorative log lines ---------- */
function generateLogLines(): string[] {
  const now = new Date();
  const fmt = (offset: number) => {
    const d = new Date(now.getTime() - offset * 1000);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };
  return [
    `[${fmt(50)}] INITIALIZING NEURAL_NETWORK_V4.8...`,
    `[${fmt(49)}] ALLOCATING 14.2GB VRAM FOR BUFFER_ENCODING`,
    `[${fmt(47)}] LOADING WEIGHTS: dopamine_response_models_2024.bin`,
    `[${fmt(46)}] STARTING FRAME-BY-FRAME ANALYSIS OF TENTATIVE CUTS...`,
    `[${fmt(39)}] DETECTION: HIGH ADRENALINE SPIKE DETECTED AT 00:12:04`,
    `[${fmt(33)}] SYNCING AUDIO FREQUENCIES WITH VISUAL TRANSITIONS...`,
    `[${fmt(20)}] ENCODING_PASS_1: 42.1% COMPLETE`,
    `[${fmt(6)}] ENCODING_PASS_1: 68.0% COMPLETE`,
    `[${fmt(5)}] ANALYZING SCENE DYNAMICS: COMPLEX MOTION DETECTED`,
    `[${fmt(4)}] APPLYING SYNAPTIC_SMOOTHING FILTER...`,
  ];
}

/* ---------- Stage checklist item ---------- */
function StageItem({
  stage,
  currentIndex,
  index,
}: {
  stage: (typeof STAGES)[number];
  currentIndex: number;
  index: number;
}) {
  const isCompleted = index < currentIndex;
  const isActive = index === currentIndex;

  if (isCompleted) {
    return (
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-tertiary-fixed bg-tertiary-fixed/10 p-1.5 rounded-lg text-sm">
          check_circle
        </span>
        <span className="text-sm font-medium">{stage.label}</span>
      </div>
    );
  }

  if (isActive) {
    return (
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary animate-spin p-1.5 rounded-lg text-sm">
          sync
        </span>
        <span className="text-sm font-medium">{stage.label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 opacity-30">
      <span className="material-symbols-outlined p-1.5 rounded-lg text-sm">
        {stage.icon}
      </span>
      <span className="text-sm font-medium">{stage.label}</span>
    </div>
  );
}

/* ---------- Main processing content ---------- */
function ProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get("jobId");

  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [logs, setLogs] = useState<string[]>(generateLogLines);

  const poll = useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await fetchJobStatus(jobId);
      setStatus(data);
      setError(null);

      if (data.status === "completed" || data.stage === "complete") {
        router.push(`/results/${jobId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    }
  }, [jobId, router]);

  /* Polling effect */
  useEffect(() => {
    if (!jobId) return;

    // Fetch immediately
    poll();

    const interval = setInterval(() => {
      poll();
      setLogs(generateLogLines());
    }, 5000);

    return () => clearInterval(interval);
  }, [jobId, poll]);

  /* Handle retry */
  const handleRetry = async () => {
    if (!jobId) return;
    setRetrying(true);
    try {
      await retryJob(jobId);
      setError(null);
      setStatus(null);
      poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  };

  /* --- No jobId state --- */
  if (!jobId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant">
          videocam_off
        </span>
        <h2 className="font-headline text-2xl font-bold text-on-surface">
          No analysis in progress
        </h2>
        <p className="text-on-surface-variant">
          Upload a video to get started with neural analysis.
        </p>
        <Button variant="primary" onClick={() => router.push("/upload")}>
          Upload Video
        </Button>
      </div>
    );
  }

  /* Derived state */
  const currentStage: JobStage = status?.stage ?? "uploading";
  const isFailed = status?.status === "failed" || currentStage === "failed";
  const currentStageIndex = isFailed ? -1 : getStageIndex(currentStage);
  const progress = status ? getStageProgress(currentStage) : 0;
  const filename = status?.video_filename ?? "Loading...";

  /* --- Error / Failed state --- */
  if (isFailed || (error && !status)) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-headline font-bold text-on-surface">
              Analysis failed
            </h1>
            <StatusBadge status="failed" label="Failed" />
          </div>
          <p className="text-on-surface-variant text-sm">
            Something went wrong during neural analysis.
          </p>
        </div>

        {/* Error panel */}
        <div className="bg-error/10 border border-error/20 rounded-xl p-8 space-y-6">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-error text-3xl">
              error
            </span>
            <div className="space-y-2">
              <h3 className="font-headline font-bold text-on-surface text-lg">
                {status?.error_message || error || "Analysis failed"}
              </h3>
              <p className="text-on-surface-variant text-sm">
                The neural engine encountered an error processing your video.
                You can retry the analysis or go back to the dashboard.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              onClick={handleRetry}
              loading={retrying}
            >
              Retry Analysis
            </Button>
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* --- Loading state (before first fetch) --- */
  if (!status && !error) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-headline font-bold text-on-surface">
              Analyzing your video...
            </h1>
            <StatusBadge status="processing" label="In Progress" />
          </div>
          <p className="text-on-surface-variant text-sm">
            Neural engine sequence initiated. Optimizing for brain activation
            retention.
          </p>
        </div>

        <div className="bg-surface-bright/60 backdrop-blur-[20px] rounded-xl p-8 flex justify-center">
          <WaveLoader />
        </div>
      </div>
    );
  }

  /* --- Active processing state --- */
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-headline font-bold text-on-surface">
              Analyzing your video...
            </h1>
            <StatusBadge status="processing" label="In Progress" />
          </div>
          <p className="text-on-surface-variant text-sm font-label">
            Neural engine sequence initiated. Optimizing for brain activation
            retention.
          </p>
        </div>
        <div className="bg-surface-container px-4 py-2 rounded-lg hidden md:block">
          <span className="text-xs text-on-surface-variant font-headline uppercase tracking-widest block mb-1">
            Compute Node
          </span>
          <span className="text-secondary font-mono text-sm">
            US-EAST-NEURAL-01
          </span>
        </div>
      </div>

      {/* Processing Glass Panel */}
      <div className="bg-surface-bright/60 backdrop-blur-[20px] rounded-xl p-8 space-y-6 relative overflow-hidden glow-primary">
        {/* File info + progress percentage */}
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-container-highest rounded-lg">
              <span className="material-symbols-outlined text-primary">
                movie
              </span>
            </div>
            <div>
              <div className="text-on-surface font-semibold">{filename}</div>
              <div className="text-xs text-on-surface-variant font-mono uppercase">
                VIDEO FILE
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-headline font-bold text-on-surface">
              {progress}%
            </div>
            <div className="text-xs text-tertiary-fixed font-semibold">
              Est. time remaining: ~{Math.max(1, Math.round((100 - progress) * 0.12))} min
            </div>
          </div>
        </div>

        {/* Wave Animation */}
        <div className="flex justify-center">
          <WaveLoader message="Analyzing neural patterns..." />
        </div>

        {/* Progress Bar */}
        <div className="h-4 w-full bg-surface-container-lowest rounded-full overflow-hidden p-1">
          <div
            className="h-full neural-gradient rounded-full shadow-[0_0_12px_-2px_rgba(186,158,255,0.4)] transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage Checklist */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-outline-variant/10">
          {STAGES.map((stage, i) => (
            <StageItem
              key={stage.key}
              stage={stage}
              currentIndex={currentStageIndex}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Inference Engine Logs */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-high rounded-xl p-6 h-64 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant">
              Inference Engine Logs
            </h3>
            <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#5af8fb] animate-glow-pulse" />
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 flex-1 font-mono text-[10px] text-primary-dim/70 space-y-1 overflow-y-auto border-l-2 border-primary/30">
            {logs.map((line, i) => (
              <p
                key={i}
                className={
                  line.includes("ENCODING_PASS") ? "text-secondary" : ""
                }
              >
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* VRAM Load Card */}
        <div className="col-span-12 md:col-span-4 glass-surface rounded-xl p-8 flex flex-col justify-between items-start">
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-secondary-fixed text-3xl">
                memory
              </span>
              <span className="text-[10px] font-bold font-headline uppercase text-on-surface-variant">
                VRAM Usage
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-headline font-bold text-on-surface">
                14.2 GB
              </div>
              <div className="text-xs text-on-surface-variant font-mono">
                Of 24.0 GB Available
              </div>
            </div>
          </div>
          <div className="w-full space-y-2 mt-auto pt-6">
            <div className="flex justify-between text-[10px] uppercase font-bold text-on-surface-variant">
              <span>Load Intensity</span>
              <span>88%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
              <div className="h-full w-[88%] bg-secondary rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between py-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-medium text-sm"
        >
          <span className="material-symbols-outlined text-lg">close</span>
          <span>Cancel Analysis</span>
        </button>
        <div className="flex items-center gap-4">
          <span className="text-xs text-on-surface-variant font-medium">
            Notification will be sent when complete
          </span>
          <div className="w-2 h-2 rounded-full bg-outline-variant" />
          <span className="text-xs text-on-surface-variant font-medium">
            Auto-save enabled
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page export with Suspense boundary ---------- */
export default function ProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-4xl mx-auto space-y-8 p-8">
          <Skeleton variant="row" />
          <Skeleton variant="card" />
        </div>
      }
    >
      <ProcessingContent />
    </Suspense>
  );
}
