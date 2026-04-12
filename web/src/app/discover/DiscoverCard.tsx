"use client";

import Link from "next/link";
import { PublicAvatarDisplay } from "@/app/u/[username]/PublicAvatarDisplay";
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
      <div className="bg-surface-container rounded-xl overflow-hidden hover:bg-surface-container-high transition-colors group hover:-translate-y-0.5 transition-transform">
        {/* Thumbnail placeholder */}
        <div className="relative aspect-video bg-surface-container-highest flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">
            movie
          </span>
          <div className="absolute top-2 right-2">
            <BookmarkButton jobId={analysis.id} />
          </div>
        </div>

        {/* Content area */}
        <div className="p-4 space-y-2">
          <p className="text-sm font-bold text-on-surface truncate">{title}</p>

          {/* Creator row */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              {analysis.creator_avatar_url ? (
                <img
                  src={analysis.creator_avatar_url}
                  alt={analysis.creator_username || "Creator"}
                  className="w-full h-full object-cover"
                />
              ) : analysis.creator_username ? (
                <PublicAvatarDisplay username={analysis.creator_username} />
              ) : (
                <div className="w-full h-full bg-surface-container-highest rounded-full" />
              )}
            </div>
            {analysis.creator_username ? (
              <Link
                href={`/u/${analysis.creator_username}`}
                className="text-xs text-on-surface-variant hover:text-primary-fixed"
                onClick={(e) => e.stopPropagation()}
              >
                {analysis.creator_username}
              </Link>
            ) : (
              <span className="text-xs text-on-surface-variant">Anonymous</span>
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-headline">
                {date}
              </span>
              {typeof analysis.view_count === "number" && (
                <ViewCount count={analysis.view_count} />
              )}
            </div>
            <span className="text-sm font-headline font-bold text-primary-fixed">
              {scoreDisplay}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
