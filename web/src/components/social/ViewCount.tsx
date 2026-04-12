"use client";

interface ViewCountProps {
  count: number;
}

export function ViewCount({ count }: ViewCountProps) {
  const label = count === 1 ? "view" : "views";

  return (
    <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
      <span className="material-symbols-outlined text-sm">visibility</span>
      <span>
        {count.toLocaleString()} {label}
      </span>
    </span>
  );
}
