import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import type { Job, JobStatus } from "@/lib/database.types";

const statusMap: Record<JobStatus, "queued" | "processing" | "complete" | "failed"> = {
  pending: "queued",
  processing: "processing",
  completed: "complete",
  failed: "failed",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const email = user.email ?? "";
  const displayName =
    (user.user_metadata?.display_name as string) ||
    email.split("@")[0] ||
    "User";

  // Compute member since from user created_at
  const createdAt = user.created_at ? new Date(user.created_at) : new Date();
  const memberSince = createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Fetch jobs for this user
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allJobs: Job[] = (jobs as Job[] | null) ?? [];
  const completedJobs = allJobs.filter((j: Job) => j.status === "completed");
  const totalAnalyses = completedJobs.length;

  // Compute scores from completed jobs
  const scores = completedJobs
    .map((j) => {
      const overall = (j.results as Record<string, unknown> | null)
        ?.overall_score;
      return typeof overall === "number" ? overall : null;
    })
    .filter((s): s is number => s !== null);

  const averageScore =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : "--";

  const bestScore =
    scores.length > 0 ? Math.max(...scores).toFixed(1) : "--";

  // Recent activity (last 5 jobs)
  const recentJobs = allJobs.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Profile Card */}
      <section className="bg-surface-container-high rounded-xl p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl">
        <div className="flex flex-col md:flex-row items-center text-center md:text-left">
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-1 neural-gradient">
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                  person
                </span>
              </div>
            </div>
          </div>
          <div className="md:ml-8 mt-4 md:mt-0">
            <h2 className="text-3xl font-headline font-bold text-on-surface">
              {displayName}
            </h2>
            <p className="text-on-surface-variant mt-1">{email}</p>
            <p className="text-on-surface-variant text-xs mt-2">
              Member since {memberSince}
            </p>
          </div>
        </div>
        <div className="mt-8 md:mt-0">
          <Link
            href="/settings"
            className="bg-surface-container-highest text-on-surface px-8 py-3 rounded-lg font-headline font-bold text-sm uppercase tracking-widest hover:bg-surface-bright transition-colors inline-block"
          >
            Edit Profile
          </Link>
        </div>
      </section>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container rounded-xl p-8 flex flex-col">
          <span className="text-on-surface-variant font-headline uppercase tracking-widest text-[10px] mb-2">
            Total Analyses
          </span>
          <span className="text-5xl font-headline font-black text-on-surface">
            {totalAnalyses.toLocaleString()}
          </span>
        </div>
        <div className="bg-surface-container rounded-xl p-8 flex flex-col">
          <span className="text-on-surface-variant font-headline uppercase tracking-widest text-[10px] mb-2">
            Average Score
          </span>
          <span className="text-5xl font-headline font-black text-secondary">
            {averageScore}
          </span>
        </div>
        <div className="bg-surface-container rounded-xl p-8 flex flex-col">
          <span className="text-on-surface-variant font-headline uppercase tracking-widest text-[10px] mb-2">
            Best Score
          </span>
          <span className="text-5xl font-headline font-black text-primary-fixed">
            {bestScore}
          </span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface-container rounded-xl overflow-hidden">
        <div className="px-8 py-6 flex items-center justify-between border-b border-outline-variant/10">
          <h3 className="font-headline font-bold text-lg uppercase tracking-wider text-on-surface">
            Recent Activity
          </h3>
        </div>
        <div className="p-4">
          {recentJobs.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              No activity yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => {
                const filename =
                  job.video_url.split("/").pop() || "Untitled Video";
                const date = new Date(job.created_at).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                );
                return (
                  <div
                    key={job.id}
                    className="flex items-center p-4 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary-fixed">
                      <span className="material-symbols-outlined">movie</span>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-on-surface truncate max-w-[300px]">
                            {filename}
                          </p>
                          <p className="text-[10px] text-on-surface-variant font-headline tracking-widest uppercase mt-0.5">
                            {date}
                          </p>
                        </div>
                        <StatusBadge status={statusMap[job.status]} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
