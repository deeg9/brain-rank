"use client";

import React, { useEffect, useMemo } from "react";

interface VideoThumbnailProps {
  file: File;
  // Kept for backwards compatibility with callers; no longer invoked.
  onThumbnailGenerated?: (dataUrl: string) => void;
  className?: string;
}

export function VideoThumbnail({
  file,
  className = "w-12 h-12",
}: VideoThumbnailProps) {
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  // #t=0.001 forces iOS WebKit to preload and render the first frame as a
  // poster. Without it, iOS Chrome/Safari show a blank/black tile for inline
  // <video> elements that haven't been played.
  return (
    <video
      src={`${objectUrl}#t=0.001`}
      preload="metadata"
      muted
      playsInline
      aria-label="Video preview"
      className={`${className} rounded-lg object-cover pointer-events-none`}
    />
  );
}
