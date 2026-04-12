import React from "react";

interface StatusBadgeProps {
  status: "queued" | "processing" | "complete" | "failed" | "cancelled";
  label?: string;
}

const statusStyles: Record<string, string> = {
  queued: "bg-gray-200 text-gray-700",
  processing: "bg-blue-100 text-blue-700",
  complete: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-700",
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
