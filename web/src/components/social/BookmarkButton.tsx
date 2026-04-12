"use client";

import { useState, useEffect, useCallback } from "react";

interface BookmarkButtonProps {
  jobId: string;
  initialBookmarked?: boolean;
  onToggle?: (bookmarked: boolean) => void;
}

export function BookmarkButton({ jobId, initialBookmarked, onToggle }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked ?? false);
  const [loaded, setLoaded] = useState(initialBookmarked !== undefined);

  // Fetch initial bookmark state if not provided
  useEffect(() => {
    if (initialBookmarked !== undefined) return;

    let cancelled = false;
    fetch(`/api/bookmarks/${jobId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setBookmarked(data.bookmarked ?? false);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [jobId, initialBookmarked]);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      // Prevent navigation when inside a Link (e.g., DiscoverCard)
      e.preventDefault();
      e.stopPropagation();

      const newState = !bookmarked;
      // Optimistic UI update
      setBookmarked(newState);

      try {
        const res = await fetch(`/api/bookmarks/${jobId}`, {
          method: newState ? "POST" : "DELETE",
        });

        if (!res.ok) {
          // Revert on error
          setBookmarked(!newState);
        } else {
          onToggle?.(newState);
        }
      } catch {
        // Revert on network error
        setBookmarked(!newState);
      }
    },
    [bookmarked, jobId]
  );

  if (!loaded) {
    return (
      <button
        className="p-1.5 rounded-full text-on-surface-variant/50"
        disabled
        aria-label="Loading bookmark status"
      >
        <span className="material-symbols-outlined text-xl">bookmark</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`p-1.5 rounded-full transition-colors ${
        bookmarked
          ? "text-primary-fixed"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <span
        className="material-symbols-outlined text-xl"
        style={bookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        bookmark
      </span>
    </button>
  );
}
