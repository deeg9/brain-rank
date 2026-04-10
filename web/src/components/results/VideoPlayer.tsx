'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { formatTimestamp } from '@/lib/results';

interface VideoPlayerProps {
  src: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: () => void;
  onPlayStateChange: (playing: boolean) => void;
  onSeek: (time: number) => void;
  onLoadedMetadata: () => void;
}

const SPEEDS = [0.5, 1, 1.5, 2] as const;

export function VideoPlayer({
  src,
  videoRef,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onPlayStateChange,
  onSeek,
  onLoadedMetadata,
}: VideoPlayerProps) {
  const [speed, setSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [videoRef]);

  const handleSpeedChange = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setSpeed(rate);
    }
  }, [videoRef]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(fraction * duration);
  }, [duration, onSeek]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, [videoRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) {
            const newTime = Math.max(0, videoRef.current.currentTime - 5);
            onSeek(newTime);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) {
            const newTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 5);
            onSeek(newTime);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, videoRef, onSeek]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="bg-surface-container rounded-xl overflow-hidden relative group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-[400px] object-contain bg-black"
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onPlay={() => onPlayStateChange(true)}
        onPause={() => onPlayStateChange(false)}
        onLoadedMetadata={onLoadedMetadata}
        onClick={togglePlay}
      />

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-t from-black/70 to-transparent pt-12 pb-4 px-4">
          {/* Progress bar */}
          <div
            className="h-1 bg-white/20 rounded-full cursor-pointer mb-3 group/progress hover:h-1.5 transition-all"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
            </div>
          </div>

          {/* Control buttons row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-primary transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                <span className="material-symbols-outlined text-2xl">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>

              {/* Volume toggle */}
              <button
                onClick={toggleMute}
                className="text-white/70 hover:text-white transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                <span className="material-symbols-outlined text-lg">
                  {isMuted ? 'volume_off' : 'volume_up'}
                </span>
              </button>

              {/* Time display */}
              <span className="font-mono text-xs text-white/70">
                {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Speed selector pills */}
              <div className="flex items-center gap-1">
                {SPEEDS.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      speed === s
                        ? 'bg-primary text-on-primary'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
