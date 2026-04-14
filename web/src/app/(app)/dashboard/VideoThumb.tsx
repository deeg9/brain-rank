"use client";

import { useEffect, useState } from "react";

interface VideoThumbProps {
  src: string;
  alt: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoThumb({ src, alt }: VideoThumbProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);

  useEffect(() => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";

    video.addEventListener("loadeddata", () => {
      if (video.duration && isFinite(video.duration)) {
        setDuration(formatDuration(video.duration));
      }
      video.currentTime = 1;
    });

    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 384;
        canvas.height = video.videoHeight || 216;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbUrl(canvas.toDataURL("image/jpeg", 0.7));
        }
      } catch {
        // CORS or other error — leave as fallback
      }
    });

    video.src = src;

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  return (
    <>
      {thumbUrl ? (
        <img
          src={thumbUrl}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-white">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">
            movie
          </span>
        </div>
      )}
      {duration && (
        <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded z-10">
          {duration}
        </span>
      )}
    </>
  );
}
