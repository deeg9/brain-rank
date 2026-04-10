"use client";

import React from "react";
import {
  type SegmentData,
  formatTimestamp,
  getEngagementLevel,
} from "@/lib/results";

interface ActivationTimelineProps {
  segments: SegmentData[];
  duration: number;
}

const engagementStyles: Record<string, string> = {
  high: "bg-tertiary",
  medium: "bg-secondary opacity-60",
  low: "bg-error opacity-80",
};

export function ActivationTimeline({
  segments,
  duration,
}: ActivationTimelineProps) {
  // Generate 5 evenly spaced time labels
  const timeLabels = Array.from({ length: 5 }, (_, i) =>
    formatTimestamp((duration / 4) * i)
  );

  return (
    <div className="bg-surface-container p-8 rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-headline text-lg font-bold">
          Neural Activation Timeline
        </h3>
        <div className="flex gap-4 text-[10px] font-headline uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            High Engagement
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            Stable Flow
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error" />
            Drop-off Risk
          </div>
        </div>
      </div>

      {/* Timeline bars */}
      <div className="relative h-48 w-full bg-surface-container-lowest rounded-lg flex items-end px-4 gap-[2px] pb-4">
        {segments.map((segment, index) => {
          const level = getEngagementLevel(segment.activation_score);
          const heightPercent = Math.max(segment.activation_score * 100, 2);

          return (
            <div
              key={index}
              className={`flex-1 rounded-t-sm ${engagementStyles[level]}`}
              style={{ height: `${heightPercent}%` }}
              title={`${formatTimestamp(segment.start)} - ${formatTimestamp(segment.end)}: ${(segment.activation_score * 100).toFixed(0)}%`}
            />
          );
        })}
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-4 font-mono text-[10px] text-on-surface-variant">
        {timeLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
}
