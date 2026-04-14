"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/ui/PageTransition";
import { PublicAvatarDisplay } from "@/app/u/[username]/PublicAvatarDisplay";
import { ViewCount } from "@/components/social/ViewCount";
import { BookmarkButton } from "@/components/social/BookmarkButton";
import type { DiscoverAnalysis } from "@/app/discover/DiscoverCard";

export default function BookmarksPage() {
  const [analyses, setAnalyses] = useState<DiscoverAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks");
      if (!res.ok) {
        console.error("Failed to fetch bookmarks:", res.status);
        setLoading(false);
        return;
      }
      const data: DiscoverAnalysis[] = await res.json();
      setAnalyses(data);
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleUnbookmark = useCallback((jobId: string) => {
    setAnalyses((prev) => prev.filter((a) => a.id !== jobId));
  }, []);

  return (
    <PageTransition>
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">
          Bookmarks
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Your saved analyses
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? // Skeleton cards
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-container rounded-xl animate-pulse"
              >
                <div className="aspect-video bg-surface-container-highest rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-surface-container-highest rounded w-3/4" />
                  <div className="h-3 bg-surface-container-highest rounded w-1/2" />
                </div>
              </div>
            ))
          : analyses.length === 0
            ? // Empty state
              <div className="col-span-full py-20 text-center">
                <span
                  className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4 block"
                >
                  bookmark
                </span>
                <p className="text-lg font-headline font-bold text-on-surface mb-2">
                  No bookmarks yet
                </p>
                <p className="text-sm text-on-surface-variant mb-6">
                  Bookmark analyses from the discover feed to save them here
                </p>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-surface-container-high text-on-surface font-headline text-sm uppercase tracking-widest rounded-lg hover:bg-surface-container-highest transition-colors"
                >
                  Browse analyses
                </Link>
              </div>
            : // Bookmarked analysis cards
              analyses.map((analysis) => {
                const title = analysis.title || "Untitled";
                const date = new Date(analysis.created_at).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                );
                const scoreDisplay =
                  typeof analysis.overall_score === "number"
                    ? analysis.overall_score.toFixed(1)
                    : "N/A";

                return (
                  <Link key={analysis.id} href={`/analysis/${analysis.id}`}>
                    <div className="bg-surface-container rounded-xl overflow-hidden hover:bg-surface-container-high transition-colors group hover:-translate-y-0.5 transition-transform">
                      {/* Thumbnail placeholder */}
                      <div className="relative aspect-video bg-surface-container-highest flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">
                          movie
                        </span>
                        <div className="absolute top-2 right-2">
                          <BookmarkButton
                            jobId={analysis.id}
                            initialBookmarked={true}
                            onToggle={(bookmarked) => {
                              if (!bookmarked) {
                                handleUnbookmark(analysis.id);
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Content area */}
                      <div className="p-4 space-y-2">
                        <p className="text-sm font-bold text-on-surface truncate">
                          {title}
                        </p>

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
                              <PublicAvatarDisplay
                                username={analysis.creator_username}
                              />
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
                            <span className="text-xs text-on-surface-variant">
                              Anonymous
                            </span>
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
              })}
      </div>
    </div>
    </PageTransition>
  );
}
