"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { VideoThumb } from "@/app/(app)/dashboard/VideoThumb";
import { ViewCount } from "@/components/social/ViewCount";
import { BookmarkButton } from "@/components/social/BookmarkButton";

export interface DiscoverAnalysis {
  id: string;
  title: string | null;
  video_url: string;
  overall_score: number | null;
  created_at: string;
  view_count?: number;
  creator_username: string | null;
  creator_avatar_url: string | null;
}

interface DiscoverCardProps {
  analysis: DiscoverAnalysis;
}

export function DiscoverCard({ analysis }: DiscoverCardProps) {
  const router = useRouter();
  const title = analysis.title || "Untitled";
  const date = new Date(analysis.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const scoreDisplay =
    typeof analysis.overall_score === "number"
      ? analysis.overall_score.toFixed(1)
      : "N/A";

  return (
    <Link href={`/analysis/${analysis.id}`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-100">
          <VideoThumb src={analysis.video_url} alt={title} />
          <div className="absolute top-2 right-2 z-10">
            <BookmarkButton jobId={analysis.id} />
          </div>
        </div>

        {/* Content area */}
        <div className="p-4 space-y-2">
          <p className="text-sm font-bold text-gray-900 truncate">{title}</p>

          {/* Creator row */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
              {analysis.creator_avatar_url ? (
                <img
                  src={analysis.creator_avatar_url}
                  alt={analysis.creator_username || "Creator"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-gray-400">person</span>
                </div>
              )}
            </div>
            {analysis.creator_username ? (
              <span
                role="link"
                tabIndex={0}
                className="text-xs font-bold text-black hover:opacity-70 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/u/${analysis.creator_username}`);
                }}
              >
                @{analysis.creator_username}
              </span>
            ) : (
              <span className="text-xs text-gray-400">Anonymous</span>
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-black">
                {date}
              </span>
              {typeof analysis.view_count === "number" && analysis.view_count > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-black">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
                  {analysis.view_count} views
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-sm font-bold text-black">
              <span className="material-symbols-outlined text-sm">trophy</span>
              {scoreDisplay} <span className="text-xs">Attention Score</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
