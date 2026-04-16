import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import { PageTransition } from "@/components/ui/PageTransition";
import { AnalysisSearch } from "./AnalysisSearch";
import { StatTile } from "./StatTile";
import { DashboardGrid } from "./DashboardGrid";
import { normalizeScore, formatScore, getTier } from "@/lib/neural-tiers";
import { getCreditStatus } from "@/lib/credits";
import { computeEngagement, computeRetention } from "@/lib/engagement";
import type { Job, JobStatus } from "@/lib/database.types";

function mapStatus(status: JobStatus): "queued" | "processing" | "complete" | "failed" {
  switch (status) {
    case "pending":
      return "queued";
    case "processing":
      return "processing";
    case "completed":
      return "complete";
    case "failed":
      return "failed";
  }
}


function extractFilename(videoUrl: string): string {
  try {
    const url = new URL(videoUrl);
    const pathname = url.pathname;
    const segments = pathname.split("/");
    const last = segments[segments.length - 1];
    return decodeURIComponent(last) || "Untitled Video";
  } catch {
    return videoUrl.split("/").pop() || "Untitled Video";
  }
}

function extractScore(results: Record<string, unknown> | null): number | null {
  if (!results) return null;
  const summary = results.summary as
    | { hook_score?: number; peak_score?: number; overall?: number }
    | undefined;
  const segments = results.segments as { activation_score: number }[] | undefined;

  if (
    summary &&
    segments &&
    segments.length > 0 &&
    typeof summary.hook_score === "number" &&
    typeof summary.peak_score === "number"
  ) {
    const retention = computeRetention(segments);
    const engagement = computeEngagement({
      peak: summary.peak_score,
      hook: summary.hook_score,
      retention,
    });
    return Math.round(engagement * 100);
  }

  // Fallback for legacy rows without full summary/segments
  if (typeof summary?.overall === "number") return Math.round(summary.overall * 100);
  const legacy = results.overall_score;
  if (typeof legacy === "number") return Math.round(legacy);
  return null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeAvgScore(jobs: Job[]): string {
  const scores = jobs
    .map((j) => extractScore(j.results))
    .filter((s): s is number => s !== null);
  if (scores.length === 0) return "--";
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return formatScore(normalizeScore(avg));
}

function getFirstName(user: { user_metadata?: { full_name?: string; name?: string }; email?: string }): string {
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
  if (fullName) return fullName.split(" ")[0];
  if (user.email) return user.email.split("@")[0];
  return "there";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const jobList = jobs ?? [];
  const hasJobs = jobList.length > 0;
  const avgScore = computeAvgScore(jobList);
  const firstName = getFirstName(user);

  const credits = await getCreditStatus(supabase, user.id);
  const creditsDisplay = credits.isCreator ? "∞" : String(credits.remaining);

  return (
    <PageTransition>
    <div className="pt-6 space-y-10">
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <h1 className="font-headline text-3xl md:text-5xl font-bold text-on-surface tracking-tight break-words">
          Welcome back, {(profile as any)?.username || firstName}
        </h1>
        <Link
          href="/upload"
          className="group relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white bg-black hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-lg text-white">add</span>
          New Analysis
        </Link>
      </section>

      {/* Quick Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatTile
          icon="analytics"
          label="Total Analyses"
          value={String(jobList.length)}
          accentColor="primary"
        />
        <StatTile
          icon="toll"
          label="Credits Remaining"
          value={creditsDisplay}
          accentColor="secondary"
        />
        <StatTile
          icon="neurology"
          label="Avg Attention Score"
          value={avgScore}
          accentColor="tertiary"
        />
      </section>

      {hasJobs ? (
        /* Analysis History with Search */
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-headline text-xl font-bold">Analysis History</h3>
            <div className="flex items-center gap-4">
              <AnalysisSearch />
              <span className="text-xs text-on-surface-variant font-headline uppercase tracking-widest font-bold whitespace-nowrap">
                {jobList.length} Total
              </span>
            </div>
          </div>
          <DashboardGrid jobs={jobList.map((job: Job) => ({
            id: job.id,
            title: job.title || extractFilename(job.video_url),
            video_url: job.video_url,
            status: mapStatus(job.status),
            is_public: job.is_public,
            input_type: (job as any).input_type ?? null,
            category: (job as any).category ?? null,
            view_count: (job as any).view_count ?? 0,
            score: extractScore(job.results),
            created_at: job.created_at,
          }))} />
        </section>
      ) : (
        /* Empty State */
        <section>
          <div className="bg-white p-8 md:p-16 rounded-3xl text-center relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center mb-8 text-on-surface-variant">
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
              </div>
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface mb-4">
                No analyses yet
              </h2>
              <p className="text-on-surface-variant max-w-lg mx-auto text-lg leading-relaxed mb-10">
                Your neural engine is idling. Upload your first video to begin
                the synaptic optimization process and uncover high-retention
                edit points.
              </p>
              <Link href="/upload">
                <button className="px-10 py-4 rounded-xl font-bold text-lg text-white bg-black hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all">
                  Upload Your First Video
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
    </PageTransition>
  );
}
