"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import { SlidingNumber } from "@/components/ui/SlidingNumber";
import { MetricInfo } from "@/components/results/MetricInfo";
import type { SegmentData } from "@/components/results/SegmentTable";
import { computeRetention } from "@/lib/engagement";

const CircumplexChart = dynamic(
  () => import("@/components/results/CircumplexChart").then((m) => m.CircumplexChart),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-36" /> }
);

interface InsightsSummaryCardProps {
  summary: {
    hook_score: number;
    retention_score: number;
    peak_second: number;
    peak_score: number;
  };
  segments: SegmentData[];
  arousal: number;
  valence: number;
  layout?: "horizontal" | "stacked";
  cardClassName?: string;
  showPlaybackBadge?: boolean;
}

export function InsightsSummaryCard({
  summary,
  segments,
  arousal,
  valence,
  layout = "horizontal",
  cardClassName = "p-5 glass-surface",
  showPlaybackBadge = true,
}: InsightsSummaryCardProps) {
  const isStacked = layout === "stacked";
  const retention = computeRetention(segments);

  const metricsBlock = (
    <div className="flex-1 flex flex-col justify-center gap-4">
      {/* Row 1: Hook, Retention, Peak */}
      <div className="grid grid-cols-3 gap-3 md:gap-x-1 md:grid-cols-6">
        <div className="md:col-span-2 min-w-0">
          <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-1">
            Hook Strength
            <MetricInfo
              title="Hook Strength"
              description="How effectively your video captures attention in the opening seconds."
              calculation="Average neural activation (attention + reward regions) during the first 10 seconds of the video."
              interpretation="Higher = stronger opening. Above 50% means your intro triggers both focus and reward circuits. Below 30% suggests a weak hook that may lose viewers."
            />
          </div>
          <p className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            <SlidingNumber value={Math.round(summary.hook_score * 100)} suffix="%" />
          </p>
          <p className="text-on-surface-variant text-[10px] mt-0.5">First 10s</p>
        </div>
        <div className="md:col-span-2 min-w-0">
          <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-1">
            Retention
            <MetricInfo
              title="Retention"
              description="How well your video avoids dead spots across its full duration."
              calculation="The lowest 10-second rolling average of activation across the whole video."
              interpretation="A strong opening or ending can't mask a boring middle. Low scores mean there's a stretch where viewers are likely to scroll away — find it on the timeline and tighten the pacing there."
            />
          </div>
          <p className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            <SlidingNumber value={Math.round(retention * 100)} suffix="%" />
          </p>
          <p className="text-on-surface-variant text-[10px] mt-0.5">Sustained</p>
        </div>
        <div className="md:col-span-2 min-w-0">
          <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-1">
            Peak Moment
            <MetricInfo
              title="Peak Moment"
              description="The exact timestamp where brain activation reaches its maximum across all regions."
              calculation="The 2-second segment with the highest overall activation_score in the video."
              interpretation="This is your video's most neurally engaging moment. Use it as a thumbnail frame, clip highlight, or to understand what content type drives the strongest brain response."
            />
          </div>
          <p className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            <SlidingNumber value={summary.peak_second} suffix="s" />
          </p>
          <p className="text-on-surface-variant text-[10px] mt-0.5">
            {Math.round(summary.peak_score * 100)}% activation
          </p>
        </div>
      </div>
      {/* Row 2: Arousal, Valence */}
      <div className="grid grid-cols-2 gap-3 md:gap-x-1 md:grid-cols-6">
        <div className="md:col-span-2 md:col-start-2 min-w-0">
          <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-1">
            Arousal
            <MetricInfo
              title="Arousal"
              description="The viewer's physiological activation level - how alert or stimulated their nervous system is."
              calculation="Predicted by TRIBE v2 from brain activation patterns. Maps cortical activity to the arousal dimension of the Russell circumplex model."
              interpretation="High arousal (>60%) = exciting, intense, or surprising content. Low arousal (<30%) = calming or boring. Best content often oscillates between high and moderate arousal."
            />
          </div>
          <p className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            <SlidingNumber value={Math.round(arousal * 100)} suffix="%" />
          </p>
          <p className="text-on-surface-variant text-[10px] mt-0.5">Physiological</p>
        </div>
        <div className="md:col-span-2 md:col-start-4 min-w-0">
          <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-1">
            Valence
            <MetricInfo
              title="Valence"
              description="The emotional positivity or negativity of the viewer's response."
              calculation="Predicted by TRIBE v2 from brain activation patterns. Maps cortical activity to the valence dimension of the Russell circumplex model."
              interpretation="High valence (>60%) = positive emotions (joy, excitement, satisfaction). Low valence (<30%) = negative emotions (fear, sadness, disgust). Combined with arousal, it places the emotional state on the circumplex chart."
            />
          </div>
          <p className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            <SlidingNumber value={Math.round(valence * 100)} suffix="%" />
          </p>
          <p className="text-on-surface-variant text-[10px] mt-0.5">Emotional</p>
        </div>
      </div>
    </div>
  );

  const circumplexBlock = (
    <div
      className={`flex-1 flex flex-col items-center justify-center ${
        isStacked ? "w-full" : ""
      }`}
    >
      <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface font-bold mb-2 text-center">
        Emotional State
        <MetricInfo
          title="Emotional State"
          description="Where your content falls on the Russell Circumplex Model - a 2D map of human emotion used in affective neuroscience."
          calculation="BrainRank predicts arousal (vertical axis: calm to excited) and valence (horizontal axis: negative to positive) from brain activation patterns at the current timestamp."
          interpretation="Top-right (Excited) = high energy positive emotions. Bottom-left (Bored) = low engagement. The dot moves in real-time as the video plays, showing how the emotional tone shifts."
        />
      </div>
      <div className="w-full max-w-[240px]">
        <CircumplexChart arousal={arousal} valence={valence} inline />
      </div>
    </div>
  );

  return (
    <Card className={cardClassName}>
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-on-surface-variant">monitoring</span>
        <h3 className="font-headline text-base font-bold">Insights Summary</h3>
        {showPlaybackBadge && (
          <span className="flex items-center gap-1 text-[10px] text-on-surface-variant font-medium ml-auto">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            Updates with playback
          </span>
        )}
      </div>
      {isStacked ? (
        <div className="flex flex-col gap-4">
          {metricsBlock}
          <div className="h-px w-full bg-outline-variant/20" />
          {circumplexBlock}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-stretch gap-4">
          {metricsBlock}
          <div className="hidden md:block w-px self-stretch bg-outline-variant/20" />
          <div className="md:hidden h-px w-full bg-outline-variant/20" />
          {circumplexBlock}
        </div>
      )}
    </Card>
  );
}
