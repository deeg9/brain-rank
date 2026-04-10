"use client";

import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: string;
  colorClass?: string;
  sublabel?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  colorClass = "text-on-surface",
  sublabel,
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={`bg-surface-container-high p-6 rounded-xl flex justify-between items-start ${className}`}
    >
      <div>
        <p className="text-xs font-headline uppercase tracking-widest text-on-surface-variant mb-1">
          {label}
        </p>
        <h2 className={`text-5xl font-headline font-bold ${colorClass}`}>
          {value}
        </h2>
        {sublabel && (
          <span className="text-[10px] font-mono text-on-surface-variant mt-1 block">
            {sublabel}
          </span>
        )}
      </div>
      {icon && (
        <span className="material-symbols-outlined text-primary text-3xl">
          {icon}
        </span>
      )}
    </div>
  );
}
