"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { DiscoverAnalysis } from "@/app/(app)/discover/DiscoverCard";

interface ComparisonTrayProps {
  slotA: DiscoverAnalysis | null;
  slotB: DiscoverAnalysis | null;
  onRemoveA: () => void;
  onRemoveB: () => void;
  onCompare: () => void;
}

function Slot({
  label,
  analysis,
  onRemove,
}: {
  label: string;
  analysis: DiscoverAnalysis | null;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold shrink-0">
        {label}
      </span>
      {analysis ? (
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-on-surface font-medium truncate">
            {analysis.title || "Untitled"}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-xs text-on-surface-variant">close</span>
          </button>
        </div>
      ) : (
        <span className="text-sm text-on-surface-variant/50 italic">Select an analysis...</span>
      )}
    </div>
  );
}

export function ComparisonTray({
  slotA,
  slotB,
  onRemoveA,
  onRemoveB,
  onCompare,
}: ComparisonTrayProps) {
  const isVisible = slotA !== null || slotB !== null;
  const canCompare = slotA !== null && slotB !== null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-highest/95 backdrop-blur-xl border-t border-white/10 shadow-2xl"
        >
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
            <Slot label="Analysis A:" analysis={slotA} onRemove={onRemoveA} />

            <button
              onClick={onCompare}
              disabled={!canCompare}
              className={`shrink-0 px-8 py-2.5 rounded-lg font-headline text-sm font-bold uppercase tracking-wider transition-all ${
                canCompare
                  ? "bg-on-surface text-surface hover:opacity-90"
                  : "bg-white/10 text-on-surface-variant/40 cursor-not-allowed"
              }`}
            >
              Compare
            </button>

            <Slot label="Analysis B:" analysis={slotB} onRemove={onRemoveB} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
