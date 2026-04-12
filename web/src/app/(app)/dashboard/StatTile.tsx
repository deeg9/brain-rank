"use client";

import { motion } from "framer-motion";

type AccentColor = "primary" | "secondary" | "tertiary";

const ACCENT_MAP: Record<AccentColor, { halo: string; glow: string }> = {
  primary: {
    halo: "bg-on-surface/10",
    glow: "shadow-on-surface/10",
  },
  secondary: {
    halo: "bg-on-surface/10",
    glow: "shadow-on-surface/10",
  },
  tertiary: {
    halo: "bg-on-surface/10",
    glow: "shadow-on-surface/10",
  },
};

interface StatTileProps {
  icon: string;
  label: string;
  value: string;
  suffix?: string;
  accentColor: AccentColor;
}

export function StatTile({ icon, label, value, suffix, accentColor }: StatTileProps) {
  const accent = ACCENT_MAP[accentColor];

  return (
    <div
      className={`group relative rounded-xl overflow-hidden p-[1px] bg-gradient-to-br from-outline-variant/20 via-transparent to-outline-variant/10 hover:shadow-xl ${accent.glow} transition-all duration-500`}
    >
      {/* Inner card */}
      <div className="relative w-full h-full rounded-xl p-8 overflow-hidden glass-surface">
        {/* Orbiting halo */}
        <motion.div
          className={`absolute w-20 h-20 rounded-full ${accent.halo} blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
          animate={{
            top: ["5%", "60%", "60%", "5%", "5%"],
            left: ["5%", "5%", "75%", "75%", "5%"],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />

        {/* Content */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-on-surface-variant font-headline text-[10px] uppercase tracking-widest font-bold">
              {label}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-headline font-extrabold text-on-surface">
                {value}
              </span>
              {suffix && (
                <span className="text-lg font-headline font-semibold text-on-surface-variant">
                  {suffix}
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
        </div>

        {/* Shimmer sweep on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />
      </div>
    </div>
  );
}
