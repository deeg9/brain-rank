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
  // #t=0.001 forces iOS WebKit to preload and render the first frame as a poster.
  // Without it, iOS shows a blank/black thumbnail. Canvas extraction fails on iOS
  // for off-DOM cross-origin videos, so we render the <video> inline instead.
  const thumbSrc = `${src}${src.includes("#") ? "&" : "#"}t=0.001`;
  return (
    <video
      src={thumbSrc}
      preload="metadata"
      muted
      playsInline
      aria-label={alt}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    />
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
