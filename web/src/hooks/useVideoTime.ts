import { useEffect, useRef } from 'react';

/**
 * Syncs video playback time at display refresh rate using requestVideoFrameCallback
 * (with requestAnimationFrame fallback for browsers that don't support it).
 *
 * Updates via callback (not React state) to avoid 60fps re-renders.
 * The callback receives the current media time in seconds.
 */
export function useVideoTime(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onTimeUpdate: (time: number) => void,
) {
  const callbackRef = useRef(onTimeUpdate);
  callbackRef.current = onTimeUpdate;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let handle: number;
    let rafId: number;

    if ('requestVideoFrameCallback' in video) {
      const tick = (_now: number, metadata: VideoFrameCallbackMetadata) => {
        callbackRef.current(metadata.mediaTime);
        handle = (video as HTMLVideoElement).requestVideoFrameCallback(tick);
      };
      handle = (video as HTMLVideoElement).requestVideoFrameCallback(tick);
      return () => (video as HTMLVideoElement).cancelVideoFrameCallback(handle);
    } else {
      let onPlay: (() => void) | null = null;
      const tick = () => {
        if (!video.paused) {
          callbackRef.current(video.currentTime);
          rafId = requestAnimationFrame(tick);
        } else {
          // Stop RAF loop when paused; resume on next play event
          onPlay = () => {
            video.removeEventListener('play', onPlay!);
            onPlay = null;
            rafId = requestAnimationFrame(tick);
          };
          video.addEventListener('play', onPlay);
        }
      };
      rafId = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(rafId);
        if (onPlay) {
          video.removeEventListener('play', onPlay);
        }
      };
    }
  }, [videoRef]);
}

/**
 * Exported for testing: the core setup logic without React hooks.
 * Sets up the video time sync loop and returns a cleanup function.
 */
export function setupVideoTimeSync(
  video: HTMLVideoElement,
  onTimeUpdate: (time: number) => void,
): () => void {
  if ('requestVideoFrameCallback' in video) {
    let handle: number;
    const tick = (_now: number, metadata: VideoFrameCallbackMetadata) => {
      onTimeUpdate(metadata.mediaTime);
      handle = (video as HTMLVideoElement).requestVideoFrameCallback(tick);
    };
    handle = (video as HTMLVideoElement).requestVideoFrameCallback(tick);
    return () => (video as HTMLVideoElement).cancelVideoFrameCallback(handle);
  } else {
    let rafId: number;
    let onPlay: (() => void) | null = null;
    const tick = () => {
      if (!video.paused) {
        onTimeUpdate(video.currentTime);
        rafId = requestAnimationFrame(tick);
      } else {
        // Stop RAF loop when paused; resume on next play event
        onPlay = () => {
          video.removeEventListener('play', onPlay!);
          onPlay = null;
          rafId = requestAnimationFrame(tick);
        };
        video.addEventListener('play', onPlay);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      if (onPlay) {
        video.removeEventListener('play', onPlay);
      }
    };
  }
}
