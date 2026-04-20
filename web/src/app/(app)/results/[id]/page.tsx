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

import { formatTimestamp, extractScoreInfo } from "@/lib/results";
import { analyzeBenchmark } from "@/lib/benchmark";
import type { ZoneMarker, IconMarker } from "@/components/results/NeuralTimeline";
import { findPeaks } from "@/lib/peak-detection";
import { InsightsSummaryCard } from "@/components/results/InsightsSummaryCard";
import type { Job } from "@/lib/database.types";
import { ContentTypeBadge } from "@/components/ui/ContentTypeBadge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { VisibilityToggle } from "@/app/(app)/dashboard/VisibilityToggle";
import { CardMenu } from "@/app/(app)/dashboard/CardMenu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { createClient } from "@/lib/supabase/client";
import { track, type InputType } from "@/lib/analytics";

const NeuralTimeline = dynamic(
  () => import("@/components/results/NeuralTimeline").then(m => m.NeuralTimeline),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-96" /> }
);

const RegionBarChart = dynamic(
  () => import("@/components/results/RegionBarChart").then(m => m.RegionBarChart),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-64" /> }
);

const VideoPlayer = dynamic(
  () => import("@/components/results/VideoPlayer").then(m => m.VideoPlayer),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-[400px]" /> }
);

const BrainViewer = dynamic(
  () => import("@/components/results/BrainViewer").then(m => m.BrainViewer),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-[400px]" /> }
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

  // Username state
  const [username, setUsername] = useState<string | null>(null);

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
      // Also capture duration in case loadedmetadata fired before handler was attached
      if (videoRef.current.duration && videoDuration === 0) {
        setVideoDuration(videoRef.current.duration);
      }
    }
  }, [videoDuration]);

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
        if (data?.status === 'completed' && data?.results) {
          const overall = (data.results as { summary?: { overall?: number } })?.summary?.overall;
          track('results_viewed', {
            job_id: id,
            input_type: ((data.input_type ?? 'video') as InputType),
            score: typeof overall === 'number' ? overall : null,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [id]);

  // Fetch username from profile
  useEffect(() => {
    async function fetchUsername() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (profile?.username) setUsername(profile.username);
    }
    fetchUsername();
  }, []);

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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5">
            <Skeleton variant="card" className="h-72" />
          </div>
          <div className="md:col-span-7">
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
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          {/* Back */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">chevron_left</span>
            <span className="font-headline uppercase tracking-widest text-xs font-bold">Back</span>
          </Link>

          {/* Title (editable) */}
          {isEditingTitle ? (
            <div className="flex items-center gap-2 min-w-0">
              <input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="bg-transparent text-on-surface font-black text-2xl tracking-tight leading-tight border-b-2 border-primary outline-none px-0 py-0.5 min-w-0 flex-1 max-w-md"
                maxLength={200}
              />
              <button
                type="button"
                onClick={handleTitleSave}
                aria-label="Save title"
                className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-primary text-on-primary hover:opacity-80 transition-opacity"
              >
                <span className="material-symbols-outlined text-base">check</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                aria-label="Cancel edit"
                className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full border border-on-surface-variant/30 text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleTitleEdit}
              className="flex items-center gap-2 group border-b-2 border-transparent py-0.5"
            >
              <h1 className="text-on-surface font-black text-2xl tracking-tight leading-tight">
                {displayTitle}
              </h1>
              <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity text-base">
                edit
              </span>
            </button>
          )}

          {/* Username */}
          {username && (
            <Link
              href={`/u/${username}`}
              className="text-xs font-bold text-black hover:opacity-70 transition-opacity"
            >
              @{username}
            </Link>
          )}

          {/* Badge row */}
          <div className="flex items-center gap-2">
            <ContentTypeBadge inputType={job?.input_type} />
            <VisibilityToggle jobId={job.id} initialPublic={job.is_public} />
            {(job as any).category && (
              <span className="text-[11px] text-gray-400 font-medium">
                · {((job as any).category as string).charAt(0).toUpperCase() + ((job as any).category as string).slice(1).replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-xs font-bold text-black whitespace-nowrap">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {(job as any).view_count > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-black whitespace-nowrap">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
                {(job as any).view_count} views
              </span>
            )}
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              {(() => {
                const info = extractScoreInfo(job.results as Record<string, unknown> | null);
                return (
                  <ScoreBadge
                    value={info?.score ?? null}
                    breakdown={info?.breakdown}
                    size="sm"
                    icon={<span className="material-symbols-outlined text-sm leading-none text-black">trophy</span>}
                  />
                );
              })()}
            </span>
          </div>
        </div>

        {/* Export button */}
        <div className="flex-shrink-0 md:pt-8 flex items-center gap-2">
          <ExportButton
            data={job.results as Record<string, unknown>}
            filename={`neurocut-${id}.json`}
          />
          <CardMenu
            jobId={job.id}
            jobTitle={displayTitle}
            isPublic={job.is_public}
            category={(job as any).category}
          />
        </div>
      </div>

      {/* Media Preview + Brain Viewer — side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 [&>*]:h-[45vh] [&>*]:min-h-[320px] [&>*]:max-h-[420px]">
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

      {/* Neural activation — bar chart for short videos; stacked desktop / tabbed mobile for longer ones */}
      {results.duration_seconds < 10 ? (
        <>
          <p className="text-xs text-on-surface-variant mb-2">
            Videos under 10 seconds don&apos;t generate enough data points for a full timeline. Region scores are shown as a snapshot instead.
          </p>
          <RegionBarChart segments={segments} currentTime={currentTime} />
        </>
      ) : (
        <>
          {/* Desktop: stacked — both visible, both update with playback */}
          <div className="hidden md:flex md:flex-col md:gap-6">
            <NeuralTimeline
              segments={segments}
              duration={videoDuration || results.duration_seconds}
              currentTime={currentTime}
              onSeek={handleSeek}
              zones={zones}
              peakMarkers={peakMarkers}
              iconMarkers={iconMarkers}
            />
            <RegionBarChart segments={segments} currentTime={currentTime} />
          </div>

          {/* Mobile: tab switch */}
          <div className="md:hidden">
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="timeline" className="flex-1">
                  <span className="material-symbols-outlined text-base">timeline</span>
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="regions" className="flex-1">
                  <span className="material-symbols-outlined text-base">bar_chart</span>
                  Regions
                </TabsTrigger>
              </TabsList>
              <TabsContent value="timeline">
                <NeuralTimeline
                  segments={segments}
                  duration={videoDuration || results.duration_seconds}
                  currentTime={currentTime}
                  onSeek={handleSeek}
                  zones={zones}
                  peakMarkers={peakMarkers}
                  iconMarkers={iconMarkers}
                />
              </TabsContent>
              <TabsContent value="regions">
                <RegionBarChart segments={segments} currentTime={currentTime} />
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* Insights Summary — metrics + emotional state strip */}
      {(() => {
        const currentSegment = getSegmentAtTime(segments, currentTime);
        const arousal = currentSegment?.arousal ?? 0;
        const valence = currentSegment?.valence ?? 0;
        return (
          <InsightsSummaryCard
            summary={summary}
            segments={segments}
            arousal={arousal}
            valence={valence}
          />
        );
      })()}
    </div>
  );
}
