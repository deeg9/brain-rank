import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ResultsData } from "@/lib/results";
import type { SegmentData } from "@/components/results/SegmentTable";
import type { Job } from "@/lib/database.types";
import { analyzeBenchmark } from "@/lib/benchmark";
import { findPeaks } from "@/lib/peak-detection";
import type { ZoneMarker, IconMarker } from "@/components/results/NeuralTimeline";
import { PublicAnalysisClient } from "./PublicAnalysisClient";
import { ViewCount } from "@/components/social/ViewCount";
import { BookmarkButton } from "@/components/social/BookmarkButton";
import { TopBar } from "@/components/layout/TopBar";
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
    return { title: "Analysis Not Found | NeuroCut" };
  }

  const title = data.title || extractFilename(data.video_url);
  const results = data.results as unknown as ResultsData | null;
  const overall = results?.summary?.overall ?? 0;

  return {
    title: `${title} | NeuroCut`,
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
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const displayTitle = job.title || extractFilename(job.video_url);

  return (
    <>
      <TopBar />
      <main className="pt-16 min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto space-y-6 pt-6">

      {/* Back button */}
      <Link
        href="/discover"
        className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-2xl">chevron_left</span>
        <span className="font-headline uppercase tracking-widest text-xs font-bold">Back</span>
      </Link>

      {/* Title + Creator Attribution + Meta */}
      <div className="space-y-2">
        <h1 className="text-on-surface font-black text-2xl tracking-tight">
          {displayTitle}
        </h1>
        <div className="flex items-center gap-2">
          {username ? (
            <Link
              href={`/u/${username}`}
              className="text-black text-sm font-bold hover:opacity-70 transition-opacity"
            >
              by @{username}
            </Link>
          ) : (
            <p className="text-black text-sm font-bold">by anonymous</p>
          )}
          <span className="text-black/30 font-bold">·</span>
          <p className="text-black text-xs font-bold">{analysisDate}</p>
        </div>
        <div className="flex items-center gap-3 font-bold text-black">
          <ViewCount count={(job as any).view_count ?? 0} />
          <BookmarkButton jobId={id} />
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
      />
    </div>
    </main>
    </>
  );
}
