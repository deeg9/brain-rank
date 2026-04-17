"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, StatusBadge } from "@/components/ui";
import { VideoThumb } from "./VideoThumb";
import { VisibilityToggle } from "./VisibilityToggle";
import { CardMenu } from "./CardMenu";
import { CompareButton } from "./CompareButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { ContentTypeBadge } from "@/components/ui/ContentTypeBadge";
import { ComparisonTray } from "@/components/compare/ComparisonTray";
import { MetricInfo } from "@/components/results/MetricInfo";
import { CONTENT_CATEGORIES } from "@/lib/categories";
import type { DiscoverAnalysis } from "@/app/(app)/discover/DiscoverCard";
import type { ScoreBreakdown } from "@/lib/results";

const ComparisonModal = dynamic(
  () => import("@/components/compare/ComparisonModal").then(m => m.ComparisonModal),
  { ssr: false }
);

interface SerializedJob {
  id: string;
  title: string;
  video_url: string;
  status: "queued" | "processing" | "complete" | "failed";
  is_public: boolean;
  input_type: string | null;
  text_content: string | null;
  category: string | null;
  view_count: number;
  score: number | null;
  breakdown?: ScoreBreakdown;
  created_at: string;
}

interface CompareItem {
  id: string;
  title: string;
  video_url: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardGrid({ jobs }: { jobs: SerializedJob[] }) {
  const [compareA, setCompareA] = useState<CompareItem | null>(null);
  const [compareB, setCompareB] = useState<CompareItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filter / sort state — same shape as discover
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inputTypeFilter, setInputTypeFilter] = useState("all");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleCompareSelect = useCallback((item: CompareItem) => {
    if (compareA?.id === item.id) { setCompareA(null); return; }
    if (compareB?.id === item.id) { setCompareB(null); return; }
    if (!compareA) { setCompareA(item); }
    else if (!compareB) { setCompareB(item); }
    else { setCompareB(item); }
  }, [compareA, compareB]);

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter((j) => j.title.toLowerCase().includes(term));
    }

    if (categoryFilter !== "all") {
      result = result.filter((j) => j.category === categoryFilter);
    }

    if (inputTypeFilter !== "all") {
      if (inputTypeFilter === "text") {
        result = result.filter((j) => j.input_type === "text_spoken" || j.input_type === "text_visual");
      } else {
        result = result.filter((j) => j.input_type === inputTypeFilter);
      }
    }

    if (scoreFilter !== "all") {
      const minScore = parseInt(scoreFilter);
      result = result.filter((j) => j.score !== null && j.score >= minScore);
    }

    result.sort((a, b) => {
      if (sortOption === "score") {
        if (a.score === null && b.score === null) return 0;
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return b.score - a.score;
      }
      if (sortOption === "views") {
        return (b.view_count ?? 0) - (a.view_count ?? 0);
      }
      if (sortOption === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      // oldest
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return result;
  }, [jobs, debouncedSearch, sortOption, scoreFilter, categoryFilter, inputTypeFilter]);

  const isFiltering = searchQuery !== "" || sortOption !== "newest" || scoreFilter !== "all" || categoryFilter !== "all" || inputTypeFilter !== "all";

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 md:min-w-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            placeholder="Search analyses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 text-sm rounded-lg border border-gray-200 focus:border-primary-fixed focus:outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="flex-1 md:flex-none min-w-0 px-4 py-2.5 bg-black text-white text-sm rounded-lg focus:outline-none appearance-none cursor-pointer font-headline">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="score">Highest Score</option>
          </select>
          <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value)} className="flex-1 md:flex-none min-w-0 px-4 py-2.5 bg-black text-white text-sm rounded-lg focus:outline-none appearance-none cursor-pointer font-headline">
            <option value="all">All Scores</option>
            <option value="90">90+</option>
            <option value="80">80+</option>
            <option value="70">70+</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="flex-1 md:flex-none min-w-0 px-4 py-2.5 bg-black text-white text-sm rounded-lg focus:outline-none appearance-none cursor-pointer font-headline">
            <option value="all">All Categories</option>
            {CONTENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select value={inputTypeFilter} onChange={(e) => setInputTypeFilter(e.target.value)} className="flex-1 md:flex-none min-w-0 px-4 py-2.5 bg-black text-white text-sm rounded-lg focus:outline-none appearance-none cursor-pointer font-headline">
            <option value="all">All Types</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="text">Text</option>
          </select>
        </div>
      </div>

      {isFiltering && (
        <p className="text-xs text-on-surface-variant mb-4">
          Showing {filteredJobs.length} of {jobs.length} analyses
        </p>
      )}

      {filteredJobs.length === 0 && jobs.length > 0 ? (
        <div className="py-20 text-center text-on-surface-variant">
          No analyses match your filters. Try adjusting your search or filters.
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => {
          const isSelected = compareA?.id === job.id || compareB?.id === job.id;

          return (
            <Card key={job.id} hover className={`overflow-visible group relative hover:z-30 ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''}`}>
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-48 h-48 md:h-auto relative overflow-hidden bg-white">
                  <VideoThumb
                    src={job.video_url}
                    alt={job.title}
                    inputType={job.input_type}
                    textContent={job.text_content}
                  />
                </div>
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-headline font-bold text-lg leading-tight flex-1">
                        {job.title}
                      </h4>
                      <div className="flex items-center gap-1">
                        {job.status === 'complete' && (
                          <CompareButton
                            isSelected={isSelected}
                            onClick={() => handleCompareSelect({ id: job.id, title: job.title, video_url: job.video_url })}
                          />
                        )}
                        <CardMenu jobId={job.id} jobTitle={job.title} isPublic={job.is_public} category={job.category} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={job.status} />
                      <ContentTypeBadge inputType={job.input_type as any} />
                      <VisibilityToggle jobId={job.id} initialPublic={job.is_public} />
                      {job.category && (
                        <span className="text-[11px] text-gray-400 font-medium">
                          · {job.category.charAt(0).toUpperCase() + job.category.slice(1).replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-xs font-bold text-black">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {formatDate(job.created_at)}
                      </span>
                      {job.is_public && (
                        <span className="flex items-center gap-1 text-xs font-bold text-black">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
                          {job.view_count} views
                        </span>
                      )}
                      {job.status === 'complete' && (
                        <span className="inline-flex items-center gap-1">
                          <MetricInfo
                            title="Engagement Score"
                            description="A composite score that weights a video's best moment, opening, and sustained engagement."
                            calculation="0.40 × Peak + 0.30 × Hook + 0.30 × Retention. Retention here is the worst 10-second stretch of activation anywhere in the video."
                            interpretation="Higher = content that opens strong, peaks hard, and avoids dead spots. Use this as the headline number when ranking your analyses."
                          >
                            <span className="material-symbols-outlined text-sm leading-none text-black cursor-help">trophy</span>
                          </MetricInfo>
                          <ScoreBadge value={job.score} breakdown={job.breakdown} size="sm" />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link
                      href={`/results/${job.id}`}
                      className="block flex-1 bg-black hover:bg-gray-800 text-white py-2 rounded-lg text-sm font-semibold transition-colors text-center"
                    >
                      View Results
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {/* New Analysis Card */}
        <Link href="/upload">
          <div className="rounded-xl overflow-hidden border border-dashed border-gray-300 flex items-center justify-center min-h-[220px] hover:border-black/40 transition-colors cursor-pointer glass-surface">
            <div className="text-center p-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                <span className="material-symbols-outlined text-2xl">add_circle</span>
              </div>
              <p className="font-headline font-bold">Analyze New Content</p>
              <p className="text-xs text-on-surface-variant mt-1">Upload video or drag and drop files</p>
            </div>
          </div>
        </Link>
      </div>
      )}

      {(compareA || compareB) && <div className="h-20" />}

      <ComparisonTray
        slotA={compareA ? { id: compareA.id, title: compareA.title, video_url: compareA.video_url, overall_score: null, created_at: '', creator_username: null, creator_avatar_url: null } : null}
        slotB={compareB ? { id: compareB.id, title: compareB.title, video_url: compareB.video_url, overall_score: null, created_at: '', creator_username: null, creator_avatar_url: null } : null}
        onRemoveA={() => setCompareA(null)}
        onRemoveB={() => setCompareB(null)}
        onCompare={() => setShowModal(true)}
        onDismiss={() => { setCompareA(null); setCompareB(null); }}
      />

      {compareA && compareB && (
        <ComparisonModal
          jobIdA={compareA.id}
          jobIdB={compareB.id}
          open={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
