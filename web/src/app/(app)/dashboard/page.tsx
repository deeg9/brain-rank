import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import { AnalysisSearch } from "./AnalysisSearch";
import { StatTile } from "./StatTile";
import { DashboardGrid } from "./DashboardGrid";
import { normalizeScore, formatScore, getTier } from "@/lib/neural-tiers";
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
  const score = results.overall_score;
  if (typeof score === "number") return Math.round(score);
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

  return (
    <div className="pt-6 space-y-10">
      {/* Welcome Header */}
      <section className="flex justify-between items-end">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-on-surface tracking-tight">
          Welcome back, {(profile as any)?.username || firstName}
        </h1>
        <Link
          href="/upload"
          className="group relative inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white bg-black hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <span className="material-symbols-outlined text-lg text-white">add</span>
          New Analysis
        </Link>
      </section>

      {/* Username Banner */}
      {!profile?.username && (
        <div className="p-4 rounded-xl glass-surface border border-black/5 flex items-center justify-between">
          <div>
            <p className="text-sm font-headline font-bold text-on-surface">
              Claim your username
            </p>
            <p className="text-xs text-on-surface-variant">
              Set a unique username to unlock your public profile.
            </p>
          </div>
          <Link href="/settings">
            <Button variant="primary" size="sm">
              Set Username
            </Button>
          </Link>
        </div>
      )}

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
          value="250"
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
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-xl font-bold">Analysis History</h3>
            <div className="flex items-center gap-4">
              <AnalysisSearch />
              <span className="text-xs text-on-surface-variant font-headline uppercase tracking-widest font-bold">
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
        <>
          <section>
            <div className="bg-surface-container p-16 rounded-3xl text-center relative overflow-hidden">
              {/* Background decor */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-surface-container-highest rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
                  <span
                    className="material-symbols-outlined text-5xl text-on-surface-variant"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    psychology
                  </span>
                </div>
                <h2 className="font-headline text-4xl font-bold text-on-surface mb-4">
                  No analyses yet
                </h2>
                <p className="text-on-surface-variant max-w-lg mx-auto text-lg leading-relaxed mb-10">
                  Your neural engine is idling. Upload your first video to begin
                  the synaptic optimization process and uncover high-retention
                  edit points.
                </p>
                <Link href="/upload">
                  <button className="neural-gradient px-10 py-4 rounded-xl font-bold text-lg text-on-surface shadow-[0_0_20px_rgba(186,158,255,0.3)] hover:scale-105 active:scale-95 transition-all">
                    Upload Your First Video
                  </button>
                </Link>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section>
            <h3 className="font-headline text-xl font-semibold text-on-surface mb-8 tracking-tight">
              How it works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-surface-container-low p-8 rounded-2xl group hover:bg-surface-container-high transition-colors">
                <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center mb-6 text-on-surface-variant group-hover:bg-on-surface/10 transition-all">
                  <span className="material-symbols-outlined">upload_file</span>
                </div>
                <h4 className="font-headline text-lg font-bold mb-3">
                  1. Upload Media
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Drop your raw footage or final cut. Our engine supports all
                  major vertical and horizontal formats.
                </p>
              </div>
              <div className="bg-surface-container-low p-8 rounded-2xl group hover:bg-surface-container-high transition-colors">
                <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center mb-6 text-on-surface-variant group-hover:bg-on-surface/10 transition-all">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <h4 className="font-headline text-lg font-bold mb-3">
                  2. Neural Mapping
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  AI maps viewer attention across every frame, identifying
                  emotional peaks and drop-off risks.
                </p>
              </div>
              <div className="bg-surface-container-low p-8 rounded-2xl group hover:bg-surface-container-high transition-colors">
                <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center mb-6 text-on-surface-variant group-hover:bg-on-surface/10 transition-all">
                  <span className="material-symbols-outlined">
                    auto_fix_high
                  </span>
                </div>
                <h4 className="font-headline text-lg font-bold mb-3">
                  3. Generate Insights
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Get an interactive heat-map and AI-suggested cuts designed to
                  maximize engagement and retention.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
