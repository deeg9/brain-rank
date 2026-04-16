"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/ui/PageTransition";
import { DiscoverCard, type DiscoverAnalysis } from "@/app/(app)/discover/DiscoverCard";

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
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Browse Analyses
                </Link>
              </div>
            : // Bookmarked analysis cards — reuse DiscoverCard for consistent styling + real thumbnails
              analyses.map((analysis) => (
                <DiscoverCard
                  key={analysis.id}
                  analysis={analysis}
                  initialBookmarked={true}
                  onBookmarkToggle={(bookmarked) => {
                    if (!bookmarked) handleUnbookmark(analysis.id);
                  }}
                />
              ))}
      </div>
    </div>
    </PageTransition>
  );
}
