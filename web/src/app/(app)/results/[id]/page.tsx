"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SegmentData } from "@/components/results/SegmentTable";
import { ExportButton } from "@/components/results/ExportButton";

import { formatTimestamp } from "@/lib/results";
import { SlidingNumber } from "@/components/ui/SlidingNumber";
import { analyzeBenchmark } from "@/lib/benchmark";
import type { ZoneMarker, IconMarker } from "@/components/results/NeuralTimeline";
import type { Job } from "@/lib/database.types";

const NeuralTimeline = dynamic(
  () => import("@/components/results/NeuralTimeline").then(m => m.NeuralTimeline),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-96" /> }
);

const VideoPlayer = dynamic(
  () => import("@/components/results/VideoPlayer").then(m => m.VideoPlayer),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-[400px]" /> }
);

const BrainViewer = dynamic(
  () => import("@/components/results/BrainViewer").then(m => m.BrainViewer),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-[400px]" /> }
);

const ArousalValenceCards = dynamic(
  () => import("@/components/results/ArousalValenceCards").then(m => m.ArousalValenceCards),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-36" /> }
);

const CircumplexChart = dynamic(
  () => import("@/components/results/CircumplexChart").then(m => m.CircumplexChart),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-36" /> }
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

function getSegmentAtTime(segments: SegmentData[], time: number): SegmentData | null {
  if (segments.length === 0) return null;
  for (const seg of segments) {
    if (time >= seg.start && time <= seg.end) return seg;
  }
  // Fallback to nearest
  let closest = segments[0];
  let minDist = Infinity;
  for (const seg of segments) {
    const dist = Math.min(Math.abs(seg.start - time), Math.abs(seg.end - time));
    if (dist < minDist) { minDist = dist; closest = seg; }
  }
  return closest;
}

function extractFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").pop() || "video";
  } catch {
    return url.split("/").pop() || "video";
  }
}


export default function ResultsDetailPage({ params }: Props) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video-timeline sync state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      const clamped = Math.max(0, Math.min(time, videoRef.current.duration || 0));
      videoRef.current.currentTime = clamped;
      setCurrentTime(clamped);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  }, []);

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

  // Benchmark analysis
  const benchmark = analyzeBenchmark(segments, summary);

  // Compute zone markers from benchmark results
  const zones: ZoneMarker[] = [
    ...benchmark.flowStates.map((f) => ({
      startTime: f.startTime,
      endTime: f.endTime,
      type: 'flow' as const,
    })),
    ...benchmark.dropoffs.map((d) => {
      // Create a small zone around the dropoff timestamp
      const segDuration = segments.length > 1 ? segments[1].end - segments[1].start : 5;
      return {
        startTime: d.timestamp,
        endTime: d.timestamp + segDuration,
        type: 'dropoff' as const,
      };
    }),
  ];

  // Compute icon markers from benchmark results
  const iconMarkers: IconMarker[] = [
    ...benchmark.shareMoments.map((m) => ({
      time: m.timestamp,
      type: 'share' as const,
    })),
    ...benchmark.dropoffs.map((d) => ({
      time: d.timestamp,
      type: 'warning' as const,
    })),
  ];

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

      {/* Video Player */}
      <VideoPlayer
        src={results.video_url}
        videoRef={videoRef}
        currentTime={currentTime}
        duration={videoDuration}
        isPlaying={isPlaying}
        onTimeUpdate={handleTimeUpdate}
        onPlayStateChange={setIsPlaying}
        onSeek={handleSeek}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Neural Timeline + Brain Viewer — side by side */}
      <div className="grid grid-cols-2 gap-6">
        <NeuralTimeline
          segments={segments}
          duration={results.duration_seconds}
          currentTime={currentTime}
          onSeek={handleSeek}
          zones={zones}
          iconMarkers={iconMarkers}
        />
        <BrainViewer segments={segments} currentTime={currentTime} />
      </div>

      {/* Arousal/Valence Display */}
      {(() => {
        const currentSegment = getSegmentAtTime(segments, currentTime);
        const arousal = currentSegment?.arousal ?? 0;
        const valence = currentSegment?.valence ?? 0;
        return (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <ArousalValenceCards arousal={arousal} valence={valence} />
            </div>
            <div className="col-span-1">
              <CircumplexChart arousal={arousal} valence={valence} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
