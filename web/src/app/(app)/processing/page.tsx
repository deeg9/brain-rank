"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button, StatusBadge, Skeleton, WaveLoader } from "@/components/ui";
import { ShiningText } from "@/components/ui/ShiningText";
import { cn } from "@/lib/utils";

const ProcessingBrain = dynamic(
  () => import("@/components/results/ProcessingBrain").then(m => m.ProcessingBrain),
  { ssr: false, loading: () => <div className="w-full h-[280px] flex items-center justify-center"><WaveLoader /></div> }
);
import {
  fetchJobStatus,
  cancelJob,
  STAGES,
  getStageIndex,
  type JobStatusResponse,
  type JobStage,
} from "@/lib/jobs";

/* ---------- Stage stepper item ---------- */
function StageItem({
  stage,
  currentIndex,
  index,
  isLast,
}: {
  stage: (typeof STAGES)[number];
  currentIndex: number;
  index: number;
  isLast: boolean;
}) {
  const isCompleted = index < currentIndex;
  const isActive = index === currentIndex;

  return (
    <div className="flex items-center min-w-0">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {isCompleted ? (
            <motion.div
              className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
            >
              <motion.span
                className="material-symbols-outlined text-black text-lg"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10, stiffness: 150, delay: 0.1 }}
              >
                check
              </motion.span>
            </motion.div>
          ) : isActive ? (
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-black text-lg"
                  style={{ animation: "spin 1.5s linear infinite reverse" }}
                >
                  sync
                </span>
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-black/30 animate-ping" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center opacity-30">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                {stage.icon}
              </span>
            </div>
          )}
        </div>
        <span className={cn(
          "text-xs font-medium text-center leading-tight max-w-[100px]",
          isCompleted ? "text-black" : isActive ? "text-black" : "text-on-surface-variant/30"
        )}>
          {stage.label}
        </span>
      </div>
      {!isLast && (
        <div className="w-20 h-0.5 mx-3 bg-outline-variant/20 rounded-full relative self-start mt-5">
          {isCompleted && (
            <motion.div
              className="absolute inset-0 bg-black rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{ transformOrigin: "left" }}
              transition={{ type: "spring", damping: 15, stiffness: 100 }}
            />
          )}
        </div>
      )}
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
  const [cancelling, setCancelling] = useState(false);

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

  useEffect(() => {
    if (!jobId) return;
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [jobId, poll]);

  const handleCancel = async () => {
    if (!jobId) return;
    setCancelling(true);
    try {
      await cancelJob(jobId);
      router.push("/dashboard");
    } catch {
      // If cancel fails, just go to dashboard anyway
      router.push("/dashboard");
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
  const currentStage: JobStage = status?.stage ?? "queued";
  const isFailed = status?.status === "failed" || currentStage === "failed";
  const currentStageIndex = isFailed ? -1 : getStageIndex(currentStage);
  const filename = status?.video_filename ?? "Loading...";

  const stageMessage = currentStage === "queued"
    ? "Waiting for available GPU..."
    : currentStage === "processing"
      ? "Running brain activation model..."
      : "Initializing...";

  /* --- Error / Failed state --- */
  if (isFailed || (error && !status)) {
    return (
      <div className="w-full max-w-4xl mx-auto pt-6 space-y-8">
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
                You can retry or go back to the dashboard.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="primary" onClick={() => router.push("/upload")}>
              Try Again
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
      <div className="w-full max-w-4xl mx-auto pt-6 space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-headline font-bold text-on-surface">
              Analyzing your video...
            </h1>
            <StatusBadge status="processing" label="In Progress" />
          </div>
          <p className="text-on-surface-variant text-sm">
            Connecting to neural engine...
          </p>
        </div>
        <div className="bg-surface-bright/60 backdrop-blur-[20px] rounded-xl p-8 flex justify-center">
          <ProcessingBrain />
        </div>
      </div>
    );
  }

  /* --- Active processing state --- */
  return (
    <div className="w-full max-w-4xl mx-auto pt-6 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-headline font-bold text-on-surface">
            Analyzing your video...
          </h1>
          <StatusBadge status="processing" label="In Progress" />
        </div>
        <p className="text-on-surface-variant text-sm font-label">
          Running brain activation prediction model.
        </p>
      </div>

      {/* Processing Panel */}
      <div className="bg-surface-bright/60 backdrop-blur-[20px] rounded-xl p-8 space-y-8 relative overflow-visible glow-primary">
        {/* File info */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-gray-100 rounded-lg">
            <span className="material-symbols-outlined text-black">
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

        {/* 3D Brain Animation */}
        <div className="py-2">
          <ProcessingBrain />
          <div className="flex justify-center mt-2">
            <ShiningText text={stageMessage} className="text-xs font-medium" />
          </div>
          <p className="text-center text-[11px] text-on-surface-variant/60 mt-3 max-w-sm mx-auto leading-relaxed">
            Analysis can take several minutes depending on video length. Feel free to close this page — we&apos;ll email you a link to your results when they&apos;re ready.
          </p>
        </div>

        {/* Stage Stepper */}
        <div className="flex items-start justify-center pt-4 border-t border-outline-variant/10">
          {STAGES.map((stage, i) => (
            <StageItem
              key={stage.key}
              stage={stage}
              currentIndex={currentStageIndex}
              index={i}
              isLast={i === STAGES.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Cancel */}
      <div className="flex justify-center py-4">
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="flex items-center gap-2 text-on-surface-variant hover:text-error transition-colors font-medium text-sm disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">close</span>
          <span>{cancelling ? "Cancelling..." : "Cancel Analysis"}</span>
        </button>
      </div>
    </div>
  );
}

/* ---------- Page export with Suspense boundary ---------- */
export default function ProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-4xl mx-auto pt-6 space-y-8 p-8">
          <Skeleton variant="row" />
          <Skeleton variant="card" />
        </div>
      }
    >
      <ProcessingContent />
    </Suspense>
  );
}
