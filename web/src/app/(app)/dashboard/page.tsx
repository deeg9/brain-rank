import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, StatusBadge } from "@/components/ui";
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
  return String(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const jobList = jobs ?? [];
  const hasJobs = jobList.length > 0;
  const avgScore = computeAvgScore(jobList);

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <section className="flex justify-between items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
            Analysis History
          </h1>
          <p className="text-on-surface-variant mt-2 text-lg">
            Review your past neural analyses
          </p>
        </div>
        <Link href="/upload">
          <Button variant="primary" size="md">
            <span className="material-symbols-outlined text-xl">add</span>
            New Analysis
          </Button>
        </Link>
      </section>

      {/* Quick Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-high p-8 rounded-xl border-l-4 border-primary">
          <p className="text-on-surface-variant font-headline text-xs uppercase tracking-widest font-semibold">
            Total Analyses
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-headline font-bold">{jobList.length}</span>
          </div>
        </div>
        <div className="bg-surface-container-high p-8 rounded-xl border-l-4 border-secondary">
          <p className="text-on-surface-variant font-headline text-xs uppercase tracking-widest font-semibold">
            Credits Remaining
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-headline font-bold">250</span>
          </div>
        </div>
        <div className="bg-surface-container-high p-8 rounded-xl border-l-4 border-tertiary-fixed-dim">
          <p className="text-on-surface-variant font-headline text-xs uppercase tracking-widest font-semibold">
            Avg Neural Score
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-headline font-bold">{avgScore}</span>
          </div>
        </div>
      </section>

      {hasJobs ? (
        /* Job Cards Grid */
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-xl font-bold">Recent Projects</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobList.map((job: Job) => {
              const filename = extractFilename(job.video_url);
              const score = extractScore(job.results);
              const initial = filename.charAt(0).toUpperCase();

              return (
                <Card key={job.id} hover className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Thumbnail placeholder */}
                    <div className="w-full md:w-48 h-48 md:h-auto relative overflow-hidden bg-surface-container-lowest flex items-center justify-center">
                      <span className="text-5xl font-headline font-bold text-on-surface-variant/30">
                        {initial}
                      </span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-headline font-bold text-lg leading-tight">
                            {filename}
                          </h4>
                        </div>
                        <p className="text-xs text-on-surface-variant mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">
                            calendar_today
                          </span>
                          {formatDate(job.created_at)}
                        </p>
                        <div className="mb-2">
                          <StatusBadge status={mapStatus(job.status)} />
                        </div>
                        {score !== null && (
                          <div className="space-y-2 mt-4">
                            <div className="flex justify-between text-xs font-headline uppercase tracking-widest font-bold">
                              <span>Retention Score</span>
                              <span className="text-primary">{score}/100</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                              <div
                                className="h-full neural-gradient"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-6">
                        <Link
                          href={`/results/${job.id}`}
                          className="block flex-1 bg-surface-container-highest hover:bg-surface-bright text-on-surface py-2 rounded-lg text-sm font-semibold transition-colors text-center"
                        >
                          View Results
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            {/* New Analysis Card */}
            <Link href="/upload">
              <div className="bg-surface-container-high rounded-xl overflow-hidden border border-dashed border-outline-variant/30 flex items-center justify-center min-h-[220px] hover:border-primary/50 transition-colors cursor-pointer">
                <div className="text-center p-8">
                  <div className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <span className="material-symbols-outlined text-2xl">
                      add_circle
                    </span>
                  </div>
                  <p className="font-headline font-bold">Analyze New Content</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Upload video or drag and drop files
                  </p>
                </div>
              </div>
            </Link>
          </div>
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
                    className="material-symbols-outlined text-5xl text-primary"
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
                <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
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
                <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center mb-6 text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-all">
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
                <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center mb-6 text-tertiary-fixed-dim group-hover:bg-tertiary-fixed-dim group-hover:text-on-tertiary-fixed transition-all">
                  <span className="material-symbols-outlined">
                    auto_fix_high
                  </span>
                </div>
                <h4 className="font-headline text-lg font-bold mb-3">
                  3. Generate Insights
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Get an interactive heat-map and AI-suggested cuts designed to
                  maximize virality and retention.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
