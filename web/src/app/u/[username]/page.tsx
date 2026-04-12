import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Job } from "@/lib/database.types";
import { PublicAvatarDisplay } from "./PublicAvatarDisplay";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .single();

  if (!profile) {
    return { title: "User Not Found | NeuroCut" };
  }

  return { title: `@${profile.username} | NeuroCut` };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch profile by username
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, created_at")
    .eq("username", username)
    .single();

  if (!profileData) {
    notFound();
  }

  const profile = profileData as {
    id: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
  };

  // Fetch public completed jobs
  const { data: jobsData } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const publicJobs: Job[] = (jobsData as Job[] | null) ?? [];

  // Compute stats
  const totalPublicAnalyses = publicJobs.length;

  const scores = publicJobs
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

  // Member since
  const memberSince = new Date(profile.created_at).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 py-12">
      {/* Hero Profile Card */}
      <section className="bg-surface-container-high rounded-xl p-10 flex flex-col md:flex-row items-center shadow-2xl">
        <div className="flex flex-col md:flex-row items-center text-center md:text-left">
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-1 neural-gradient">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.username}'s avatar`}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <PublicAvatarDisplay username={profile.username} />
              )}
            </div>
          </div>
          <div className="md:ml-8 mt-4 md:mt-0">
            <h2 className="text-3xl font-headline font-bold text-on-surface">
              @{profile.username}
            </h2>
            {profile.bio && (
              <p className="text-gray-600 text-sm mt-2">{profile.bio}</p>
            )}
            <p className="text-on-surface-variant text-xs mt-2">
              Member since {memberSince}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container rounded-xl p-8 flex flex-col">
          <span className="text-on-surface-variant font-headline uppercase tracking-widest text-[10px] mb-2">
            Public Analyses
          </span>
          <span className="text-5xl font-headline font-black text-on-surface">
            {totalPublicAnalyses.toLocaleString()}
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

      {/* Public Analyses List */}
      <div className="bg-surface-container rounded-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-outline-variant/10">
          <h3 className="font-headline font-bold text-lg uppercase tracking-wider text-on-surface">
            Public Analyses
          </h3>
        </div>
        <div className="p-4">
          {publicJobs.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant">
              No public analyses yet
            </div>
          ) : (
            <div className="space-y-2">
              {publicJobs.map((job) => {
                const title =
                  job.title ??
                  job.video_url.split("/").pop() ??
                  "Untitled";
                const date = new Date(job.created_at).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                );
                const overallScore = (
                  job.results as Record<string, unknown> | null
                )?.overall_score;
                const scoreDisplay =
                  typeof overallScore === "number"
                    ? overallScore.toFixed(1)
                    : "N/A";

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
                            {title}
                          </p>
                          <p className="text-[10px] text-on-surface-variant font-headline tracking-widest uppercase mt-0.5">
                            {date}
                          </p>
                        </div>
                        <span className="text-sm font-headline font-bold text-primary-fixed">
                          {scoreDisplay}
                        </span>
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
