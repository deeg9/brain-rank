"use client";

import { useState, useEffect, useCallback } from "react";

export function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  const handleOnline = useCallback(() => {
    setReconnecting(true);
    // Brief delay to confirm stable reconnection
    setTimeout(() => {
      setIsOnline(true);
      // Show "Reconnected" briefly, then hide
      setTimeout(() => {
        setReconnecting(false);
      }, 1500);
    }, 1000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setReconnecting(false);
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Online and not reconnecting -- render nothing
  if (isOnline && !reconnecting) {
    return null;
  }

  // Reconnected state -- brief confirmation
  if (isOnline && reconnecting) {
    return (
      <div className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-sm flex items-center justify-center p-6 transition-opacity duration-500">
        <div className="max-w-xl w-full text-center flex flex-col items-center">
          <div className="w-full bg-surface-container-high p-10 md:p-16 rounded-xl relative overflow-hidden ghost-border">
            <div className="mb-8 relative inline-flex">
              <div className="absolute inset-0 bg-tertiary/20 blur-3xl rounded-full" />
              <div className="relative bg-surface-container-highest p-6 rounded-full">
                <span
                  className="material-symbols-outlined text-6xl text-tertiary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
            </div>
            <h1 className="font-headline font-bold text-4xl text-on-surface mb-4 tracking-tight">
              Reconnected!
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm mx-auto">
              Your connection has been restored. Resuming neural operations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Offline state -- full overlay
  return (
    <div className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-sm flex items-center justify-center p-6">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-xl w-full text-center flex flex-col items-center relative z-10">
        {/* Brand */}
        <div className="mb-16">
          <span className="font-headline font-black text-2xl tracking-widest text-on-surface">
            NeuroCut v1
          </span>
        </div>

        {/* Error Module Card */}
        <div className="w-full bg-surface-container-high p-10 md:p-16 rounded-xl relative overflow-hidden ghost-border">
          {/* Icon Assembly */}
          <div className="mb-8 relative inline-flex">
            <div className="absolute inset-0 bg-error/20 blur-3xl rounded-full" />
            <div className="relative bg-surface-container-highest p-6 rounded-full">
              <span
                className="material-symbols-outlined text-6xl text-error"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
              >
                wifi_off
              </span>
            </div>
          </div>

          {/* Messaging */}
          <h1 className="font-headline font-bold text-4xl md:text-5xl text-on-surface mb-4 tracking-tight">
            You&apos;re offline
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-10 max-w-sm mx-auto">
            Check your internet connection. NeuroCut requires a stable uplink to
            process neural edits.
          </p>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-3 mb-12 py-3 px-6 bg-surface-container-lowest rounded-full inline-flex">
            <div className="w-4 h-4 border-2 border-primary-dim/30 border-t-primary-dim rounded-full animate-spin" />
            <span className="text-xs font-mono uppercase tracking-widest text-on-surface-variant">
              Checking connection...
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-10 py-4 bg-surface-container-highest text-on-surface font-medium rounded-lg hover:bg-surface-bright transition-all active:scale-95 duration-200"
            >
              Retry Now
            </button>
          </div>
        </div>

        {/* Footnote Metadata */}
        <div className="mt-12">
          <div className="flex items-center justify-center gap-6 text-[10px] font-mono text-outline uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-error" />
              SYSTEM_STATUS: DISCONNECTED
            </div>
            <div className="flex items-center gap-2">NODE: ARC-7</div>
          </div>
        </div>
      </div>
    </div>
  );
}
