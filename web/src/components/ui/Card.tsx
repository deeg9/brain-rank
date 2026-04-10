import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface-container-high rounded-xl transition-all duration-300 ease-out",
        hover &&
          "hover:bg-surface-bright hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-5px_rgba(186,158,255,0.15)] cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
