import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ResultsData } from "@/lib/results";
import { extractScoreInfo } from "@/lib/results";
import type { SegmentData } from "@/components/results/SegmentTable";
import type { Job } from "@/lib/database.types";
import { analyzeBenchmark } from "@/lib/benchmark";
import { findPeaks } from "@/lib/peak-detection";
import type { ZoneMarker, IconMarker } from "@/components/results/NeuralTimeline";
import { PublicAnalysisClient } from "./PublicAnalysisClient";
import { ViewCount } from "@/components/social/ViewCount";
import { BookmarkButton } from "@/components/social/BookmarkButton";
import { TopBar } from "@/components/layout/TopBar";
import { ContentTypeBadge } from "@/components/ui/ContentTypeBadge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { ExportButton } from "@/components/results/ExportButton";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rawData } = await supabase
    .from("jobs")
    .select("title, video_url, results")
    .eq("id", id)
    .eq("is_public", true)
    .eq("status", "completed")
    .single();

  const data = rawData as Pick<Job, "title" | "video_url" | "results"> | null;

  if (!data) {
    return { title: "Analysis Not Found | BrainRank" };
  }

  const title = data.title || extractFilename(data.video_url);
  const results = data.results as unknown as ResultsData | null;
  const overall = results?.summary?.overall ?? 0;

  return {
    title: `${title} · BRAIN | RANK`,
    description: `Neural analysis with ${Math.round(overall * 100)}% overall activation score`,
  };
}

function extractFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").pop() || "Untitled";
  } catch {
    return url.split("/").pop() || "Untitled";
  }
}

export default async function PublicAnalysisPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Only fetch public, completed jobs (T-48-01: defense-in-depth filter)
  const { data: rawJob, error: fetchError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .eq("status", "completed")
    .single();

  const job = rawJob as Job | null;

  if (fetchError || !job) {
    notFound();
  }

  // Fetch creator profile
  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", job.user_id)
    .single();

  const profile = rawProfile as { username: string | null; avatar_url: string | null } | null;
  const username = profile?.username ?? null;

  // Owner check for the engagement card (owner sees metrics + Update button;
  // non-owner sees the link only, if any).
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const isOwner = !!currentUser && currentUser.id === job.user_id;

  // Engagement columns live on the jobs row; cast through unknown because
  // database.types.ts hasn't been regenerated yet.
  const jobEngagement = job as unknown as {
    posted_url: string | null;
    posted_platform: string | null;
    posted_at: string | null;
    views_count: number | null;
    likes_count: number | null;
    comments_count: number | null;
    shares_count: number | null;
    bookmarks_count: number | null;
    engagement_captured_at: string | null;
  };

  const results = job.results as unknown as ResultsData;
  const segments = (results.segments ?? []) as unknown as SegmentData[];
  const summary = results.summary ?? {
    overall: 0,
    hook_score: 0,
    retention_score: 0,
    peak_second: 0,
    peak_score: 0,
  };

  // Benchmark analysis — guard against incomplete segment data
  let benchmark;
  try {
    benchmark = analyzeBenchmark(segments, summary);
  } catch {
    benchmark = null;
  }

  // Compute zone markers from benchmark results
  const zones: ZoneMarker[] = benchmark ? [
    ...benchmark.flowStates.map((f) => ({
      startTime: f.startTime,
      endTime: f.endTime,
      type: "flow" as const,
    })),
    ...benchmark.dropoffs.map((d) => {
      const segDuration =
        segments.length > 1 ? segments[1].end - segments[1].start : 5;
      return {
        startTime: d.timestamp,
        endTime: d.timestamp + segDuration,
        type: "dropoff" as const,
      };
    }),
  ] : [];

  // Compute icon markers from benchmark results
  const iconMarkers: IconMarker[] = benchmark ? [
    ...benchmark.shareMoments.map((m) => ({
      time: m.timestamp,
      type: "share" as const,
    })),
    ...benchmark.dropoffs.map((d) => ({
      time: d.timestamp,
      type: "warning" as const,
    })),
  ] : [];

  const peakMarkers = findPeaks(segments);

  // Format analysis date
  const analysisDate = new Date(job.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const displayTitle = job.title || extractFilename(job.video_url);

  return (
    <>
      <TopBar />
      <main className="pt-20 md:pt-24 min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 pt-6">

      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div className="space-y-2 min-w-0 flex-1">
        {/* Back */}
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">chevron_left</span>
          <span className="font-headline uppercase tracking-widest text-xs font-bold">Back</span>
        </Link>

        {/* Title */}
        <h1 className="text-on-surface font-black text-2xl tracking-tight">
          {displayTitle}
        </h1>

        {/* Username */}
        {username ? (
          <Link
            href={`/u/${username}`}
            className="text-xs font-bold text-black hover:opacity-70 transition-opacity"
          >
            @{username}
          </Link>
        ) : (
          <p className="text-xs font-bold text-gray-400">anonymous</p>
        )}

        {/* Badge row */}
        <div className="flex items-center gap-2">
          <ContentTypeBadge inputType={job?.input_type} />
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-black">
            <span className="material-symbols-outlined text-base">public</span>
            Public
          </span>
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
            {analysisDate}
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

      {/* Bookmark + Export */}
      <div className="flex-shrink-0 md:pt-8 flex items-center gap-3">
        <BookmarkButton jobId={id} />
        <ExportButton
          data={job.results as Record<string, unknown>}
          filename={`brainrank-${id}.json`}
        />
      </div>
      </div>

      {/* Interactive Client Component */}
      <PublicAnalysisClient
        jobId={id}
        videoUrl={job.video_url}
        viewCount={(job as any).view_count ?? 0}
        segments={segments}
        summary={summary}
        duration={results.duration_seconds}
        zones={zones}
        iconMarkers={iconMarkers}
        peakMarkers={peakMarkers}
        inputType={job.input_type}
        isOwner={isOwner}
        postedUrl={jobEngagement.posted_url}
        postedPlatform={
          (jobEngagement.posted_platform as
            | "youtube"
            | "tiktok"
            | "instagram"
            | "other"
            | null) ?? null
        }
        postedAt={jobEngagement.posted_at}
        viewsCount={jobEngagement.views_count}
        likesCount={jobEngagement.likes_count}
        commentsCount={jobEngagement.comments_count}
        sharesCount={jobEngagement.shares_count}
        bookmarksCount={jobEngagement.bookmarks_count}
        engagementCapturedAt={jobEngagement.engagement_captured_at}
      />
    </div>
    </main>
    </>
  );
}
