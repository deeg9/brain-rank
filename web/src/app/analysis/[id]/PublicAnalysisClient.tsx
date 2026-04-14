"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import { SlidingNumber } from "@/components/ui/SlidingNumber";
import { MetricInfo } from "@/components/results/MetricInfo";
import { useVideoTime } from "@/hooks/useVideoTime";
import type { SegmentData } from "@/components/results/SegmentTable";
import type { ZoneMarker, IconMarker } from "@/components/results/NeuralTimeline";
import type { PeakMarker } from "@/lib/peak-detection";

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

const CircumplexChart = dynamic(
  () =>
    import("@/components/results/CircumplexChart").then(
      (m) => m.CircumplexChart
    ),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-36" /> }
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
}: PublicAnalysisClientProps) {
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
      {/* Video Player + Brain Viewer — side by side */}
      <div className="grid grid-cols-2 gap-6 [&>*]:h-[45vh] [&>*]:min-h-[320px] [&>*]:max-h-[420px]">
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
        <BrainViewer
          segments={segments}
          currentTimeRef={currentTimeRef}
          currentTime={currentTime}
        />
      </div>

      {/* Neural Activation Timeline */}
      <NeuralTimeline
        segments={segments}
        duration={duration}
        currentTime={currentTime}
        onSeek={handleSeek}
        zones={zones}
        peakMarkers={peakMarkers}
        iconMarkers={iconMarkers}
      />

      {/* Insights Summary */}
      <Card className="p-5 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-on-surface-variant">
            monitoring
          </span>
          <h3 className="font-headline text-base font-bold">
            Insights Summary
          </h3>
        </div>
        <div className="flex items-stretch gap-4">
          {/* Metrics -- staggered grid */}
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
                  <SlidingNumber
                    value={Math.round(summary.hook_score * 100)}
                    suffix="%"
                  />
                </p>
                <p className="text-on-surface-variant text-[10px] mt-0.5">
                  First 10s
                </p>
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
                  <SlidingNumber
                    value={Math.round(summary.retention_score * 100)}
                    suffix="%"
                  />
                </p>
                <p className="text-on-surface-variant text-[10px] mt-0.5">
                  Last 10s
                </p>
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
                  <SlidingNumber
                    value={summary.peak_second}
                    suffix="s"
                  />
                </p>
                <p className="text-on-surface-variant text-[10px] mt-0.5">
                  {Math.round(summary.peak_score * 100)}% activation
                </p>
              </div>
            </div>
            {/* Row 2: Arousal, Valence -- staggered between top row */}
            <div className="grid grid-cols-6 gap-x-1">
              <div className="col-span-2 col-start-2">
                <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-1">
                  Arousal
                  <MetricInfo
                    title="Arousal"
                    description="The viewer's physiological activation level -- how alert or stimulated their nervous system is."
                    calculation="Predicted by BrainRank from brain activation patterns. Maps cortical activity to the arousal dimension of the Russell circumplex model."
                    interpretation="High arousal (>60%) = exciting, intense, or surprising content. Low arousal (<30%) = calming or boring. Best content often oscillates between high and moderate arousal."
                  />
                </div>
                <p className="font-headline text-3xl font-bold text-on-surface">
                  <SlidingNumber
                    value={Math.round(arousal * 100)}
                    suffix="%"
                  />
                </p>
                <p className="text-on-surface-variant text-[10px] mt-0.5">
                  Physiological activation
                </p>
              </div>
              <div className="col-span-2 col-start-4">
                <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-1">
                  Valence
                  <MetricInfo
                    title="Valence"
                    description="The emotional positivity or negativity of the viewer's response."
                    calculation="Predicted by BrainRank from brain activation patterns. Maps cortical activity to the valence dimension of the Russell circumplex model."
                    interpretation="High valence (>60%) = positive emotions (joy, excitement, satisfaction). Low valence (<30%) = negative emotions (fear, sadness, disgust). Combined with arousal, it places the emotional state on the circumplex chart."
                  />
                </div>
                <p className="font-headline text-3xl font-bold text-on-surface">
                  <SlidingNumber
                    value={Math.round(valence * 100)}
                    suffix="%"
                  />
                </p>
                <p className="text-on-surface-variant text-[10px] mt-0.5">
                  Emotional positivity
                </p>
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
                description="Where your content falls on the Russell Circumplex Model -- a 2D map of human emotion used in affective neuroscience."
                calculation="BrainRank predicts arousal (vertical axis: calm to excited) and valence (horizontal axis: negative to positive) from brain activation patterns at the current timestamp."
                interpretation="Top-right (Excited) = high energy positive emotions. Bottom-left (Bored) = low engagement. The dot moves in real-time as the video plays, showing how the emotional tone shifts."
              />
            </div>
            <div className="w-full max-w-[240px]">
              <CircumplexChart arousal={arousal} valence={valence} inline />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
