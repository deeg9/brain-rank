"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import { InsightsSummaryCard } from "@/components/results/InsightsSummaryCard";
import { useVideoTime } from "@/hooks/useVideoTime";
import type { SegmentData } from "@/components/results/SegmentTable";
import type { ZoneMarker, IconMarker } from "@/components/results/NeuralTimeline";
import type { PeakMarker } from "@/lib/peak-detection";
import type { InputType } from "@/lib/database.types";
import type { PostedPlatform } from "@/lib/post-engagement";
import { EngagementCard } from "@/components/results/EngagementCard";

const VideoPlayer = dynamic(
  () => import("@/components/results/VideoPlayer").then(m => m.VideoPlayer),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-[400px]" /> }
);

const BrainViewer = dynamic(
  () =>
    import("@/components/results/BrainViewer").then((m) => m.BrainViewer),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-full" /> }
);

const NeuralTimeline = dynamic(
  () =>
    import("@/components/results/NeuralTimeline").then(
      (m) => m.NeuralTimeline
    ),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-96" /> }
);

const RegionBarChart = dynamic(
  () =>
    import("@/components/results/RegionBarChart").then(
      (m) => m.RegionBarChart
    ),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-96" /> }
);

interface PublicAnalysisClientProps {
  jobId: string;
  videoUrl: string;
  viewCount: number;
  segments: SegmentData[];
  summary: {
    overall: number;
    hook_score: number;
    retention_score: number;
    peak_second: number;
    peak_score: number;
  };
  duration: number;
  zones: ZoneMarker[];
  iconMarkers: IconMarker[];
  peakMarkers: PeakMarker[];
  inputType: InputType | null;
  isOwner: boolean;
  postedUrl: string | null;
  postedPlatform: PostedPlatform | null;
  postedAt: string | null;
  viewsCount: number | null;
  likesCount: number | null;
  commentsCount: number | null;
  sharesCount: number | null;
  bookmarksCount: number | null;
  engagementCapturedAt: string | null;
}

function getSegmentAtTime(
  segments: SegmentData[],
  time: number
): SegmentData | null {
  if (segments.length === 0) return null;
  for (const seg of segments) {
    if (time >= seg.start && time <= seg.end) return seg;
  }
  // Fallback to nearest
  let closest = segments[0];
  let minDist = Infinity;
  for (const seg of segments) {
    const dist = Math.min(
      Math.abs(seg.start - time),
      Math.abs(seg.end - time)
    );
    if (dist < minDist) {
      minDist = dist;
      closest = seg;
    }
  }
  return closest;
}

export function PublicAnalysisClient({
  jobId,
  videoUrl,
  viewCount,
  segments,
  summary,
  duration,
  zones,
  iconMarkers,
  peakMarkers,
  inputType,
  isOwner,
  postedUrl,
  postedPlatform,
  postedAt,
  viewsCount,
  likesCount,
  commentsCount,
  sharesCount,
  bookmarksCount,
  engagementCapturedAt,
}: PublicAnalysisClientProps) {
  const isImage = inputType === "image";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const currentTimeRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(duration);

  useVideoTime(videoRef, (time) => {
    currentTimeRef.current = time;
  });

  // Increment view count once on mount (ref guard prevents double-fire in StrictMode)
  const viewIncrementedRef = useRef(false);
  useEffect(() => {
    if (viewIncrementedRef.current) return;
    viewIncrementedRef.current = true;
    fetch(`/api/views/${jobId}`, { method: "POST" }).catch(() => {
      // Silent fail -- view count increment is best-effort
    });
  }, [jobId]);

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
      currentTimeRef.current = clamped;
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  }, []);

  const currentSegment = getSegmentAtTime(segments, currentTime);
  const arousal = currentSegment?.arousal ?? 0;
  const valence = currentSegment?.valence ?? 0;

  return (
    <div className="space-y-6 [&_.glass-surface]:bg-white [&_.glass-surface]:backdrop-filter-none [&_.glass-surface]:outline-gray-200 [&_.bg-surface-container]:bg-white">
      {/* Media (image or video) + Brain Viewer — side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 [&>*]:h-[45vh] [&>*]:min-h-[320px] [&>*]:max-h-[420px]">
        {isImage ? (
          <div className="rounded-xl overflow-hidden flex items-center justify-center bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={videoUrl}
              alt="Analyzed image"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <VideoPlayer
            src={videoUrl}
            videoRef={videoRef}
            currentTime={currentTime}
            duration={videoDuration}
            isPlaying={isPlaying}
            onTimeUpdate={handleTimeUpdate}
            onPlayStateChange={setIsPlaying}
            onSeek={handleSeek}
            onLoadedMetadata={handleLoadedMetadata}
          />
        )}
        <BrainViewer
          segments={segments}
          currentTimeRef={currentTimeRef}
          currentTime={currentTime}
        />
      </div>

      {/* Brain Region Activation (image) or Neural Activation Timeline (video) */}
      {isImage ? (
        <RegionBarChart segments={segments} currentTime={currentTime} />
      ) : (
        <NeuralTimeline
          segments={segments}
          duration={duration}
          currentTime={currentTime}
          onSeek={handleSeek}
          zones={zones}
          peakMarkers={peakMarkers}
          iconMarkers={iconMarkers}
        />
      )}

      {/* Insights Summary */}
      <InsightsSummaryCard
        summary={summary}
        segments={segments}
        arousal={arousal}
        valence={valence}
        cardClassName="p-5 bg-white shadow-sm"
        showPlaybackBadge={false}
      />

      {/* Real-world performance (owner: link + counts + update; visitor: link only) */}
      <EngagementCard
        jobId={jobId}
        isOwner={isOwner}
        postedUrl={postedUrl}
        postedPlatform={postedPlatform}
        postedAt={postedAt}
        viewsCount={viewsCount}
        likesCount={likesCount}
        commentsCount={commentsCount}
        sharesCount={sharesCount}
        bookmarksCount={bookmarksCount}
        engagementCapturedAt={engagementCapturedAt}
      />
    </div>
  );
}
