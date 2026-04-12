"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { DiscoverCard, type DiscoverAnalysis } from "./DiscoverCard";

const PAGE_SIZE = 20;

export default function DiscoverPage() {
  const [analyses, setAnalyses] = useState<DiscoverAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Search, sort, filter state
  const [sortOption, setSortOption] = useState("score");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset visibleCount when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sortOption, debouncedSearch, scoreFilter]);

  const fetchAnalyses = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Fetch all public completed jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, video_url, results, created_at, user_id")
      .eq("is_public", true)
      .eq("status", "completed");

    if (jobsError || !jobs) {
      console.error("Failed to fetch public analyses:", jobsError);
      setLoading(false);
      setInitialLoad(false);
      return;
    }

    // Cast from Supabase's inferred types
    type JobRow = {
      id: string;
      title: string | null;
      video_url: string;
      results: Record<string, unknown> | null;
      created_at: string;
      user_id: string;
    };
    type ProfileRow = {
      id: string;
      username: string | null;
      avatar_url: string | null;
    };

    const typedJobs = jobs as unknown as JobRow[];

    // Get unique user IDs for profile lookup
    const uniqueUserIds = [...new Set(typedJobs.map((j) => j.user_id))];

    // Fetch creator profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", uniqueUserIds);

    const typedProfiles = (profiles || []) as unknown as ProfileRow[];
    const profileMap = new Map(
      typedProfiles.map((p) => [p.id, p])
    );

    // Map jobs to DiscoverAnalysis (no sorting here -- handled by useMemo)
    const mapped: DiscoverAnalysis[] = typedJobs.map((job) => {
      const profile = profileMap.get(job.user_id);
      const overallScore = (
        job.results as Record<string, unknown> | null
      )?.overall_score;

      return {
        id: job.id,
        title: job.title,
        video_url: job.video_url,
        overall_score:
          typeof overallScore === "number" ? overallScore : null,
        created_at: job.created_at,
        creator_username: profile?.username ?? null,
        creator_avatar_url: profile?.avatar_url ?? null,
      };
    });

    setAnalyses(mapped);
    setLoading(false);
    setInitialLoad(false);
  }, []);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  // Filtering and sorting pipeline
  const filteredAnalyses = useMemo(() => {
    let result = [...analyses];

    // Search filter
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter(
        (a) =>
          (a.title && a.title.toLowerCase().includes(term)) ||
          (a.creator_username && a.creator_username.toLowerCase().includes(term))
      );
    }

    // Score filter
    if (scoreFilter !== "all") {
      const minScore = parseInt(scoreFilter);
      result = result.filter(
        (a) => a.overall_score !== null && a.overall_score >= minScore
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortOption === "score") {
        if (a.overall_score === null && b.overall_score === null) return 0;
        if (a.overall_score === null) return 1;
        if (b.overall_score === null) return -1;
        return b.overall_score - a.overall_score;
      }
      if (sortOption === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      // oldest
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return result;
  }, [analyses, sortOption, debouncedSearch, scoreFilter]);

  const visibleAnalyses = filteredAnalyses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAnalyses.length;

  const isFiltering = searchQuery !== "" || scoreFilter !== "all";

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">
          Discover
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Browse public neural analyses ranked by brain activation score
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            placeholder="Search by title or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container text-on-surface text-sm rounded-lg border border-outline-variant/30 focus:border-primary-fixed focus:outline-none placeholder:text-on-surface-variant/50"
          />
        </div>

        {/* Sort dropdown */}
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="px-4 py-2.5 bg-surface-container text-on-surface text-sm rounded-lg border border-outline-variant/30 focus:border-primary-fixed focus:outline-none appearance-none cursor-pointer"
        >
          <option value="score">Highest Score</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>

        {/* Score filter dropdown */}
        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface-container text-on-surface text-sm rounded-lg border border-outline-variant/30 focus:border-primary-fixed focus:outline-none appearance-none cursor-pointer"
        >
          <option value="all">All Scores</option>
          <option value="90">90+</option>
          <option value="80">80+</option>
          <option value="70">70+</option>
        </select>
      </div>

      {/* Active filter indicator */}
      {isFiltering && !initialLoad && (
        <p className="text-xs text-on-surface-variant">
          Showing {filteredAnalyses.length} of {analyses.length} analyses
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialLoad
          ? // Skeleton cards
            Array.from({ length: 6 }).map((_, i) => (
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
          : filteredAnalyses.length === 0 && analyses.length > 0
            ? // Empty filter state
              <div className="col-span-full py-20 text-center text-on-surface-variant">
                No analyses match your filters. Try adjusting your search or filters.
              </div>
            : analyses.length === 0
              ? // Empty state
                <div className="col-span-full py-20 text-center text-on-surface-variant">
                  No public analyses yet. Be the first to share!
                </div>
              : // Analysis cards
                visibleAnalyses.map((a) => (
                  <DiscoverCard key={a.id} analysis={a} />
                ))}
      </div>

      {/* Load More */}
      {!initialLoad && hasMore && (
        <div className="text-center">
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="px-6 py-3 bg-surface-container-high text-on-surface font-headline text-sm uppercase tracking-widest rounded-lg hover:bg-surface-container-highest transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
