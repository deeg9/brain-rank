"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DiscoverAnalysis } from "@/app/(app)/discover/DiscoverCard";

interface ComparisonTrayProps {
  slotA: DiscoverAnalysis | null;
  slotB: DiscoverAnalysis | null;
  onRemoveA: () => void;
  onRemoveB: () => void;
  onCompare: () => void;
}

function MiniThumb({ src }: { src: string }) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    // Try loading as image first (works for image URLs)
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setThumbUrl(src);
    img.onerror = () => {
      // Not an image — try extracting a frame from video
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.preload = "metadata";
      video.onloadeddata = () => {
        video.currentTime = 1;
      };
      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 80;
          canvas.height = 80;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, 80, 80);
            setThumbUrl(canvas.toDataURL("image/jpeg", 0.7));
          }
        } catch {
          // CORS or other error — keep null
        }
      };
      video.src = src;
    };
    img.src = src;
  }, [src]);

  if (thumbUrl) {
    return (
      <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
    );
  }

  return (
    <span className="material-symbols-outlined text-white/60 text-lg">neurology</span>
  );
}

function SlotContent({
  analysis,
  align,
}: {
  analysis: DiscoverAnalysis | null;
  align: "left" | "right";
}) {
  if (!analysis) {
    return (
      <span className="text-sm text-white/30 italic">
        Select an analysis...
      </span>
    );
  }

  const title = analysis.title || "Untitled";

  return (
    <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0 flex items-center justify-center overflow-hidden">
        <MiniThumb src={analysis.video_url} />
      </div>
      <p className="text-sm text-white font-bold truncate">{title}</p>
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
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-white/10 shadow-2xl"
        >
          <div className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-4">
            {/* Analysis A — left aligned */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1.5">
                Analysis A
              </p>
              <SlotContent analysis={slotA} align="left" />
            </div>

            {/* Compare button — centered */}
            <button
              onClick={onCompare}
              disabled={!canCompare}
              className={`shrink-0 px-10 py-3 rounded-lg font-headline text-sm font-bold uppercase tracking-wider transition-all ${
                canCompare
                  ? "bg-white text-black hover:opacity-90"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              Compare
            </button>

            {/* Analysis B — right aligned */}
            <div className="flex-1 min-w-0 text-right">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1.5">
                Analysis B
              </p>
              <SlotContent analysis={slotB} align="right" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
