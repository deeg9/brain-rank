"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SegmentData } from "@/components/results/SegmentTable";
import { ExportButton } from "@/components/results/ExportButton";
import { useVideoTime } from "@/hooks/useVideoTime";

import { formatTimestamp } from "@/lib/results";
import { SlidingNumber } from "@/components/ui/SlidingNumber";
import { analyzeBenchmark } from "@/lib/benchmark";
import type { ZoneMarker, IconMarker } from "@/components/results/NeuralTimeline";
import { findPeaks } from "@/lib/peak-detection";
import { MetricInfo } from "@/components/results/MetricInfo";
import type { Job } from "@/lib/database.types";
import { ContentTypeBadge } from "@/components/ui/ContentTypeBadge";

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
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const displayTitle = job?.title || (
    job?.input_type === 'image' ? 'Image Analysis' :
    job?.input_type === 'text_spoken' ? 'Text Analysis (Spoken)' :
    job?.input_type === 'text_visual' ? 'Text Analysis (Visual)' :
    extractFilename(job?.video_url ?? "")
  );

  const handleTitleEdit = useCallback(() => {
    setEditTitle(displayTitle);
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }, [displayTitle]);

  const handleTitleSave = useCallback(async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === displayTitle) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        const updated = await res.json();
        setJob(updated);
      }
    } catch {
      // silently fail — title stays as-is
    }
    setIsEditingTitle(false);
  }, [editTitle, displayTitle, id]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTitleSave();
    if (e.key === "Escape") setIsEditingTitle(false);
  }, [handleTitleSave]);

  // Video-timeline sync state
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentTimeRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // High-frequency ref update via requestVideoFrameCallback (60fps, no re-renders)
  useVideoTime(videoRef, (time) => {
    currentTimeRef.current = time;
  });

  // Low-frequency React state update via HTML timeupdate (~4Hz, drives timeline/UI)
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

  const shouldRedirect = !loading && !error && job != null && (job.status !== "completed" || !job.results);

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

  useEffect(() => {
    if (shouldRedirect) {
      router.replace(`/processing?jobId=${id}`);
    }
  }, [shouldRedirect, router, id]);

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

  if (shouldRedirect) return null;

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

  const peakMarkers = findPeaks(segments);

  return (
    <div className="space-y-6 pt-6">
      {/* Top Bar */}
      <div className="grid grid-cols-3 items-center">
        <div className="flex items-center">
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
        </div>
        <div className="flex justify-center">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="bg-transparent text-on-surface font-black text-lg tracking-tight border-b-2 border-primary outline-none px-0 py-0.5 min-w-[200px] text-center"
              maxLength={200}
            />
          ) : (
            <button
              onClick={handleTitleEdit}
              className="flex items-center gap-2 group"
            >
              <h2 className="text-on-surface font-black text-lg tracking-tight">
                {displayTitle}
              </h2>
              <ContentTypeBadge inputType={job?.input_type} />
              <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity text-base">
                edit
              </span>
            </button>
          )}
        </div>
        <div className="flex justify-end">
          <ExportButton
            data={job.results as Record<string, unknown>}
            filename={`neurocut-${id}.json`}
          />
        </div>
      </div>

      {/* Media Preview + Brain Viewer — side by side */}
      <div className="grid grid-cols-2 gap-6 [&>*]:h-[45vh] [&>*]:min-h-[320px] [&>*]:max-h-[420px]">
        {(!job?.input_type || job.input_type === 'video') ? (
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
        ) : job.input_type === 'image' ? (
          <Card className="relative overflow-hidden flex items-center justify-center bg-surface-container">
            <img
              src={job.video_url}
              alt="Analyzed image"
              className="max-w-full max-h-full object-contain"
            />
          </Card>
        ) : (
          <Card className="relative overflow-hidden flex flex-col items-center justify-center bg-surface-container p-6 gap-4">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/60">
              {job.input_type === 'text_spoken' ? 'record_voice_over' : 'text_fields'}
            </span>
            {job.text_style && (
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/50 font-bold">
                {job.text_style.replace('_', ' ')}
              </span>
            )}
            <p className="text-on-surface/80 text-sm text-center leading-relaxed max-w-xs line-clamp-6">
              &ldquo;{job.text_content}&rdquo;
            </p>
            {job.input_type === 'text_visual' && (
              <span className="text-[10px] uppercase tracking-wider text-amber-400/80 font-bold">Experimental</span>
            )}
          </Card>
        )}
        <BrainViewer segments={segments} currentTimeRef={currentTimeRef} currentTime={currentTime} />
      </div>

      {/* Neural Activation Timeline — full width hero chart */}
      <NeuralTimeline
        segments={segments}
        duration={results.duration_seconds}
        currentTime={currentTime}
        onSeek={handleSeek}
        zones={zones}
        peakMarkers={peakMarkers}
        iconMarkers={iconMarkers}
      />

      {/* Insights Summary — metrics + emotional state strip */}
      {(() => {
        const currentSegment = getSegmentAtTime(segments, currentTime);
        const arousal = currentSegment?.arousal ?? 0;
        const valence = currentSegment?.valence ?? 0;
        return (
          <Card className="p-5 glass-surface">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-on-surface-variant">monitoring</span>
              <h3 className="font-headline text-base font-bold">Insights Summary</h3>
            </div>
            <div className="flex items-stretch gap-4">
              {/* Metrics — staggered grid */}
              <div className="flex-1 flex flex-col justify-center gap-4">
                {/* Row 1: Hook, Retention, Peak */}
                <div className="grid grid-cols-6 gap-x-1">
                  <div className="col-span-2">
                    <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-1">
                      Hook Strength
                      <MetricInfo
                        title="Hook Strength"
                        description="How effectively your video captures attention in the opening seconds."
                        calculation="Average neural activation (attention + reward regions) during the first 10 seconds of the video."
                        interpretation="Higher = stronger opening. Above 50% means your intro triggers both focus and reward circuits. Below 30% suggests a weak hook that may lose viewers."
                      />
                    </div>
                    <p className="font-headline text-3xl font-bold text-on-surface">
                      <SlidingNumber value={Math.round(summary.hook_score * 100)} suffix="%" />
                    </p>
                    <p className="text-on-surface-variant text-[10px] mt-0.5">First 10s</p>
                  </div>
                  <div className="col-span-2">
                    <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-1">
                      Retention
                      <MetricInfo
                        title="Retention"
                        description="How well your video maintains neural engagement through the end."
                        calculation="Average neural activation across all brain regions during the last 10 seconds of the video."
                        interpretation="Higher = viewers stay engaged. Compare to Hook Strength: if retention > hook, your content builds momentum. If lower, viewers may be dropping off."
                      />
                    </div>
                    <p className="font-headline text-3xl font-bold text-on-surface">
                      <SlidingNumber value={Math.round(summary.retention_score * 100)} suffix="%" />
                    </p>
                    <p className="text-on-surface-variant text-[10px] mt-0.5">Last 10s</p>
                  </div>
                  <div className="col-span-2">
                    <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-1">
                      Peak Moment
                      <MetricInfo
                        title="Peak Moment"
                        description="The exact timestamp where brain activation reaches its maximum across all regions."
                        calculation="The 2-second segment with the highest overall activation_score in the video."
                        interpretation="This is your video's most neurally engaging moment. Use it as a thumbnail frame, clip highlight, or to understand what content type drives the strongest brain response."
                      />
                    </div>
                    <p className="font-headline text-3xl font-bold text-on-surface">
                      <SlidingNumber value={summary.peak_second} suffix="s" />
                    </p>
                    <p className="text-on-surface-variant text-[10px] mt-0.5">{Math.round(summary.peak_score * 100)}% activation</p>
                  </div>
                </div>
                {/* Row 2: Arousal, Valence — staggered between top row */}
                <div className="grid grid-cols-6 gap-x-1">
                  <div className="col-span-2 col-start-2">
                    <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-1">
                      Arousal
                      <MetricInfo
                        title="Arousal"
                        description="The viewer's physiological activation level — how alert or stimulated their nervous system is."
                        calculation="Predicted by TRIBE v2 from brain activation patterns. Maps cortical activity to the arousal dimension of the Russell circumplex model."
                        interpretation="High arousal (>60%) = exciting, intense, or surprising content. Low arousal (<30%) = calming or boring. Best content often oscillates between high and moderate arousal."
                      />
                    </div>
                    <p className="font-headline text-3xl font-bold text-on-surface">
                      <SlidingNumber value={Math.round(arousal * 100)} suffix="%" />
                    </p>
                    <p className="text-on-surface-variant text-[10px] mt-0.5">Physiological activation</p>
                  </div>
                  <div className="col-span-2 col-start-4">
                    <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-1">
                      Valence
                      <MetricInfo
                        title="Valence"
                        description="The emotional positivity or negativity of the viewer's response."
                        calculation="Predicted by TRIBE v2 from brain activation patterns. Maps cortical activity to the valence dimension of the Russell circumplex model."
                        interpretation="High valence (>60%) = positive emotions (joy, excitement, satisfaction). Low valence (<30%) = negative emotions (fear, sadness, disgust). Combined with arousal, it places the emotional state on the circumplex chart."
                      />
                    </div>
                    <p className="font-headline text-3xl font-bold text-on-surface">
                      <SlidingNumber value={Math.round(valence * 100)} suffix="%" />
                    </p>
                    <p className="text-on-surface-variant text-[10px] mt-0.5">Emotional positivity</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px self-stretch bg-outline-variant/20" />

              {/* Circumplex — half width, right side, vertically centered */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-2 text-center">
                  Emotional State
                  <MetricInfo
                    title="Emotional State"
                    description="Where your content falls on the Russell Circumplex Model — a 2D map of human emotion used in affective neuroscience."
                    calculation="TRIBE v2 predicts arousal (vertical axis: calm to excited) and valence (horizontal axis: negative to positive) from brain activation patterns at the current timestamp."
                    interpretation="Top-right (Excited) = high energy positive emotions. Bottom-left (Bored) = low engagement. The dot moves in real-time as the video plays, showing how the emotional tone shifts."
                  />
                </div>
                <div className="w-full max-w-[240px]">
                  <CircumplexChart arousal={arousal} valence={valence} inline />
                </div>
              </div>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
