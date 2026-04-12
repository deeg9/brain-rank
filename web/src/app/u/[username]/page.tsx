import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Job } from "@/lib/database.types";
import { TopBar } from "@/components/layout/TopBar";
import { VideoThumb } from "@/app/(app)/dashboard/VideoThumb";
import Link from "next/link";

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
    <>
      <TopBar />
      <main className="pt-16 min-h-screen bg-surface p-8">
      <div className="max-w-6xl mx-auto space-y-8 pt-6">
      {/* Hero Profile Card */}
      <section className="bg-white rounded-xl p-10 flex flex-col md:flex-row items-center shadow-sm">
        <div className="flex flex-col md:flex-row items-center text-center md:text-left">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.username}'s avatar`}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-4xl text-gray-400">person</span>
              )}
            </div>
          </div>
          <div className="md:ml-8 mt-4 md:mt-0">
            <h2 className="text-3xl font-headline font-bold text-black">
              @{profile.username}
            </h2>
            {profile.bio && (
              <p className="text-black font-bold text-sm mt-2">{profile.bio}</p>
            )}
            <p className="text-black font-bold text-xs mt-2">
              Member since {memberSince}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-8 flex flex-col shadow-sm">
          <span className="text-black font-headline font-bold uppercase tracking-widest text-[10px] mb-2">
            Public Analyses
          </span>
          <span className="text-5xl font-headline font-black text-black">
            {totalPublicAnalyses.toLocaleString()}
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

      {/* Public Analyses List */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-gray-100">
          <h3 className="font-headline font-bold text-lg uppercase tracking-wider text-black">
            Public Analyses
          </h3>
        </div>
        <div className="p-4">
          {publicJobs.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
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
                  <Link
                    key={job.id}
                    href={`/analysis/${job.id}`}
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
                      <VideoThumb src={job.video_url} alt={title} />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-black truncate max-w-[300px]">
                            {title}
                          </p>
                          <p className="text-[10px] text-black font-bold font-headline tracking-widest uppercase mt-0.5">
                            {date}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-headline font-bold text-black">
                          <span className="material-symbols-outlined text-sm leading-none">trophy</span>
                          {scoreDisplay}
                          <span className="text-xs font-bold text-black">Attention Score</span>
                        </span>
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
      </main>
    </>
  );
}
