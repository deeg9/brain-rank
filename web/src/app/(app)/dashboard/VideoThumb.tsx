"use client";

import { useEffect, useState } from "react";

interface VideoThumbProps {
  src: string;
  alt: string;
  /** Job input type — controls how the thumbnail is rendered. Defaults to 'video' for backward compat. */
  inputType?: "video" | "image" | "text_spoken" | "text_visual" | string | null;
  /** First ~120 chars of text for text inputs. When omitted, the component fetches the text file. */
  textContent?: string | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ImageThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

function TextThumb({ src, textContent }: { src: string; textContent?: string | null }) {
  const [text, setText] = useState<string | null>(textContent ?? null);

  useEffect(() => {
    if (textContent) {
      setText(textContent);
      return;
    }
    let cancelled = false;
    fetch(src)
      .then((r) => (r.ok ? r.text() : null))
      .then((t) => {
        if (!cancelled && t) setText(t.slice(0, 240));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src, textContent]);

  const preview = text ? text.trim().slice(0, 120) : null;

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-3 flex flex-col justify-center">
      <span className="material-symbols-outlined text-xl text-gray-400 mb-1">format_quote</span>
      <p className="text-[11px] leading-snug text-gray-800 font-medium line-clamp-4 italic">
        {preview ? `"${preview}${preview.length >= 120 ? "…" : ""}"` : "Text input"}
      </p>
    </div>
  );
}

function VideoFrameThumb({ src, alt }: { src: string; alt: string }) {
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

export function VideoThumb({ src, alt, inputType, textContent }: VideoThumbProps) {
  if (inputType === "image") {
    return <ImageThumb src={src} alt={alt} />;
  }
  if (inputType === "text_spoken" || inputType === "text_visual") {
    return <TextThumb src={src} textContent={textContent} />;
  }
  return <VideoFrameThumb src={src} alt={alt} />;
}
