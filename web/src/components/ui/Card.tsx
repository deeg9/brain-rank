import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`bg-surface-container-high rounded-xl ${
        hover ? "hover:bg-surface-bright transition-colors cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
