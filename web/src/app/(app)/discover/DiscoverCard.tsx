"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { VideoThumb } from "@/app/(app)/dashboard/VideoThumb";
import { ViewCount } from "@/components/social/ViewCount";
import { BookmarkButton } from "@/components/social/BookmarkButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { ContentTypeBadge } from "@/components/ui/ContentTypeBadge";
import type { InputType } from "@/lib/database.types";

export interface DiscoverAnalysis {
  id: string;
  title: string | null;
  video_url: string;
  overall_score: number | null;
  created_at: string;
  view_count?: number;
  creator_username: string | null;
  creator_avatar_url: string | null;
  category?: string | null;
  input_type?: InputType | null;
}

interface DiscoverCardProps {
  analysis: DiscoverAnalysis;
  isSelected?: boolean;
  onCompareSelect?: () => void;
  initialBookmarked?: boolean;
  onBookmarkToggle?: (bookmarked: boolean) => void;
}

export function DiscoverCard({ analysis, isSelected, onCompareSelect, initialBookmarked, onBookmarkToggle }: DiscoverCardProps) {
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
      <div className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group hover:-translate-y-0.5 ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''}`}>
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-100">
          <VideoThumb src={analysis.video_url} alt={title} />
          <div className="absolute top-2 right-2 z-10 flex gap-1.5">
            {onCompareSelect && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCompareSelect();
                }}
                className={`p-1.5 rounded-full transition-colors ${
                  isSelected
                    ? 'text-black'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title={isSelected ? "Remove from comparison" : "Add to comparison"}
              >
                <span className="material-symbols-outlined text-xl">
                  {isSelected ? 'check' : 'compare_arrows'}
                </span>
              </button>
            )}
            <BookmarkButton
              jobId={analysis.id}
              initialBookmarked={initialBookmarked}
              onToggle={onBookmarkToggle}
            />
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
            {analysis.input_type && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-black">
                · <span className="material-symbols-outlined text-[13px]">
                  {analysis.input_type === 'image' ? 'image' : analysis.input_type?.startsWith('text') ? 'text_fields' : 'videocam'}
                </span>
                {analysis.input_type === 'image' ? 'Image' : analysis.input_type?.startsWith('text') ? 'Text' : 'Video'}
              </span>
            )}
            {analysis.category && (
              <span className="text-[11px] text-gray-400 font-medium">
                · {analysis.category.charAt(0).toUpperCase() + analysis.category.slice(1).replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-black">
              <span className="material-symbols-outlined text-[14px] leading-none">calendar_today</span>
              {date}
            </span>
            {typeof analysis.view_count === "number" && analysis.view_count > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-black">
                <span className="material-symbols-outlined text-[14px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
                {analysis.view_count} views
              </span>
            )}
            <ScoreBadge
              value={analysis.overall_score}
              size="sm"
              icon={<span className="material-symbols-outlined text-[14px] leading-none text-black">trophy</span>}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
