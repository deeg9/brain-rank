import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { VideoThumb } from "../dashboard/VideoThumb";
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

  // Fetch profile data
  const { data: profileData } = await supabase
    .from("profiles")
    .select("username, avatar_url, bio")
    .eq("id", user.id)
    .single();
  const profile = profileData as { username: string | null; avatar_url: string | null; bio: string | null } | null;

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
    <div className="max-w-6xl mx-auto space-y-8 pt-6">
      {/* Hero Profile Card */}
      <section className="bg-white rounded-xl p-10 flex flex-col md:flex-row items-center justify-between shadow-sm">
        <div className="flex flex-col md:flex-row items-center text-center md:text-left">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-4xl text-gray-400">person</span>
              )}
            </div>
          </div>
          <div className="md:ml-8 mt-4 md:mt-0">
            <h2 className="text-3xl font-headline font-bold text-black">
              @{profile?.username || "username"}
            </h2>
            {profile?.bio && (
              <p className="text-black font-bold text-sm mt-2">{profile.bio}</p>
            )}
            <p className="text-black font-bold text-xs mt-2">
              Member since {memberSince}
            </p>
          </div>
        </div>
        <div className="mt-8 md:mt-0">
          <Link
            href="/settings"
            className="bg-black text-white px-8 py-3 rounded-lg font-headline font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors inline-block"
          >
            Edit Profile
          </Link>
        </div>
      </section>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-8 flex flex-col shadow-sm">
          <span className="text-black font-headline font-bold uppercase tracking-widest text-[10px] mb-2">
            Total Analyses
          </span>
          <span className="text-5xl font-headline font-black text-black">
            {totalAnalyses.toLocaleString()}
          </span>
        </div>
        <div className="bg-white rounded-xl p-8 flex flex-col shadow-sm">
          <span className="text-black font-headline font-bold uppercase tracking-widest text-[10px] mb-2">
            Average Attention Score
          </span>
          <span className="text-5xl font-headline font-black text-black">
            {averageScore}
          </span>
        </div>
        <div className="bg-white rounded-xl p-8 flex flex-col shadow-sm">
          <span className="text-black font-headline font-bold uppercase tracking-widest text-[10px] mb-2">
            Best Attention Score
          </span>
          <span className="text-5xl font-headline font-black text-black">
            {bestScore}
          </span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
          <h3 className="font-headline font-bold text-lg uppercase tracking-wider text-black">
            Recent Activity
          </h3>
        </div>
        <div className="p-4">
          {recentJobs.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              No activity yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => {
                const filename =
                  job.title || job.video_url.split("/").pop() || "Untitled Video";
                const date = new Date(job.created_at).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                );
                return (
                  <Link
                    key={job.id}
                    href={`/results/${job.id}`}
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
                      <VideoThumb src={job.video_url} alt={filename} />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-black truncate max-w-[300px]">
                            {filename}
                          </p>
                          <p className="text-[10px] text-black font-bold font-headline tracking-widest uppercase mt-0.5">
                            {date}
                          </p>
                        </div>
                        <StatusBadge status={statusMap[job.status]} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
