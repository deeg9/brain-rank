"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WaveLoaderProps {
  bars?: number;
  message?: string;
  className?: string;
}

export function WaveLoader({ bars = 10, message, className }: WaveLoaderProps) {
  const center = (bars - 1) / 2;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="flex items-end gap-1 h-12">
        {Array.from({ length: bars }, (_, i) => {
          const distFromCenter = Math.abs(i - center) / center;
          const opacity = 1 - distFromCenter * 0.3;

          return (
            <motion.div
              key={i}
              className={cn(
                "w-[3px] h-full rounded-full origin-bottom",
                i % 2 === 0 ? "bg-primary" : "bg-secondary"
              )}
              style={{ opacity }}
              animate={{ scaleY: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
          );
        })}
      </div>
      {message && (
        <p className="mt-2 text-xs text-on-surface-variant">{message}</p>
      )}
    </div>
  );
}
