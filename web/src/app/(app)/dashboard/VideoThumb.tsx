"use client";

import { useEffect, useRef, useState } from "react";

interface VideoThumbProps {
  src: string;
  alt: string;
}

export function VideoThumb({ src, alt }: VideoThumbProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";

    video.addEventListener("loadeddata", () => {
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

  if (thumbUrl) {
    return (
      <img
        src={thumbUrl}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-surface-container-lowest">
      <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">
        movie
      </span>
    </div>
  );
}
