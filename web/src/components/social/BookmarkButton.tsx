"use client";

import { useState, useEffect, useCallback } from "react";
import { track } from "@/lib/analytics";

interface BookmarkButtonProps {
  jobId: string;
  initialBookmarked?: boolean;
  onToggle?: (bookmarked: boolean) => void;
  /** "inline" (default): plain icon for inline page use. "overlay": translucent dark pill for thumbnail overlays. */
  variant?: "inline" | "overlay";
}

export function BookmarkButton({ jobId, initialBookmarked, onToggle, variant = "inline" }: BookmarkButtonProps) {
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
          track('bookmark_toggled', { job_id: jobId, action: newState ? 'add' : 'remove' });
          onToggle?.(newState);
        }
      } catch {
        // Revert on network error
        setBookmarked(!newState);
      }
    },
    [bookmarked, jobId]
  );

  const isOverlay = variant === "overlay";

  const sizingClass = isOverlay
    ? "w-8 h-8 flex items-center justify-center rounded-full"
    : "p-1.5 rounded-full";
  const iconSize = isOverlay ? "text-[18px] leading-none" : "text-xl";

  if (!loaded) {
    return (
      <button
        className={
          isOverlay
            ? `${sizingClass} bg-black/50 backdrop-blur-sm text-white/50`
            : `${sizingClass} text-on-surface-variant/50`
        }
        disabled
        aria-label="Loading bookmark status"
      >
        <span className={`material-symbols-outlined ${iconSize}`}>bookmark</span>
      </button>
    );
  }

  const overlayClass = bookmarked
    ? "bg-white text-black hover:bg-white/90"
    : "bg-black/50 backdrop-blur-sm text-white hover:bg-black/70";
  const inlineClass = bookmarked
    ? "text-black"
    : "text-on-surface-variant hover:text-on-surface";

  return (
    <button
      onClick={handleClick}
      className={`${sizingClass} transition-colors ${isOverlay ? overlayClass : inlineClass}`}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <span
        className={`material-symbols-outlined ${iconSize}`}
        style={bookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        bookmark
      </span>
    </button>
  );
}
