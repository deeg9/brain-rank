import React from "react";

interface SkeletonProps {
  variant?: "card" | "bar" | "row" | "text" | "circle";
  className?: string;
  count?: number;
}

const variantStyles: Record<string, string> = {
  card: "h-48 w-full rounded-xl",
  bar: "h-4 w-full rounded-lg",
  row: "h-12 w-full rounded-lg",
  text: "h-3 w-3/4 rounded",
  circle: "h-10 w-10 rounded-full",
};

export function Skeleton({
  variant = "bar",
  className = "",
  count = 1,
}: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`animate-pulse bg-surface-container-high ${variantStyles[variant]} ${className}`}
    />
  ));

  if (count > 1) {
    return <div className="space-y-3">{items}</div>;
  }

  return items[0];
}
