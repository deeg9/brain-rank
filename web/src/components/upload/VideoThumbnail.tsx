"use client";

import React, { useEffect, useRef, useState } from "react";

interface VideoThumbnailProps {
  file: File;
  onThumbnailGenerated: (dataUrl: string) => void;
  className?: string;
}

export function VideoThumbnail({
  file,
  onThumbnailGenerated,
  className = "w-12 h-12",
}: VideoThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const video = document.createElement("video");
    video.playsInline = true;
    video.muted = true;
    video.preload = "metadata";

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    video.src = objectUrl;

    // 5-second timeout fallback
    timeoutId = setTimeout(() => {
      if (!cancelled && !thumbnail) {
        setError(true);
      }
    }, 5000);

    function handleLoadedData() {
      if (cancelled) return;
      video.currentTime = Math.min(1, video.duration || 1);
    }

    function handleSeeked() {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 96;
        canvas.height = 96;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError(true);
          return;
        }

        // Draw scaled to cover 96x96
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const scale = Math.max(96 / vw, 96 / vh);
        const sw = vw * scale;
        const sh = vh * scale;
        const sx = (96 - sw) / 2;
        const sy = (96 - sh) / 2;

        ctx.drawImage(video, sx, sy, sw, sh);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

        setThumbnail(dataUrl);
        onThumbnailGenerated(dataUrl);
        clearTimeout(timeoutId);
      } catch {
        setError(true);
      }
    }

    function handleError() {
      if (!cancelled) {
        setError(true);
        clearTimeout(timeoutId);
      }
    }

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
      video.src = "";
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  if (thumbnail) {
    return (
      <img
        src={thumbnail}
        alt="Video thumbnail"
        className={`${className} rounded-lg object-cover`}
      />
    );
  }

  if (error) {
    return (
      <div
        className={`${className} rounded-lg bg-surface-container-highest flex items-center justify-center`}
      >
        <span className="material-symbols-outlined text-lg text-on-surface-variant">
          movie
        </span>
      </div>
    );
  }

  // Loading placeholder
  return (
    <div
      className={`${className} rounded-lg animate-pulse bg-surface-container-highest`}
    />
  );
}
