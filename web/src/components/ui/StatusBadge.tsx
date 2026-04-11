import React from "react";

interface StatusBadgeProps {
  status: "queued" | "processing" | "complete" | "failed" | "cancelled";
  label?: string;
}

const statusStyles: Record<string, string> = {
  queued: "bg-on-surface/10 text-on-surface-variant",
  processing: "bg-secondary/15 text-secondary",
  complete: "bg-tertiary-fixed/15 text-tertiary-fixed",
  failed: "bg-error/15 text-error",
  cancelled: "bg-on-surface/10 text-on-surface-variant",
};

const defaultLabels: Record<string, string> = {
  queued: "Queued",
  processing: "Processing",
  complete: "Complete",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const showDot = status === "processing";

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-bold font-headline uppercase tracking-widest inline-flex items-center gap-2 ${statusStyles[status]}`}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-secondary" />
        </span>
      )}
      {label || defaultLabels[status]}
    </span>
  );
}
