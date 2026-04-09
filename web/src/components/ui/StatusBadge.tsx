import React from "react";

interface StatusBadgeProps {
  status: "queued" | "processing" | "complete" | "failed" | "cancelled";
  label?: string;
}

const statusStyles: Record<string, string> = {
  queued:
    "bg-surface-container-highest text-on-surface-variant border border-outline-variant",
  processing: "bg-primary/20 text-primary border border-primary/30",
  complete: "bg-tertiary-fixed/20 text-tertiary-fixed",
  failed: "bg-error/20 text-error",
  cancelled: "bg-surface-container-highest text-on-surface-variant",
};

const defaultLabels: Record<string, string> = {
  queued: "Queued",
  processing: "Processing",
  complete: "Complete",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold font-headline uppercase tracking-wider inline-flex items-center gap-1.5 ${statusStyles[status]}`}
    >
      {label || defaultLabels[status]}
    </span>
  );
}
