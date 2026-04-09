import React from "react";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <div className={`glass-surface rounded-xl ghost-border p-6 ${className}`}>
      {children}
    </div>
  );
}
