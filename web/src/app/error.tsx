"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen selection:bg-primary/30">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 w-full h-16 flex items-center px-8 z-50">
        <div className="font-headline font-black text-lg tracking-widest text-on-surface uppercase">
          NeuroCut v1
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-2xl w-full flex flex-col items-center text-center relative z-10">
          {/* Error Icon */}
          <div className="mb-12 relative">
            <div
              className="w-24 h-24 rounded-full bg-error-container/20 flex items-center justify-center"
              style={{ boxShadow: "0 0 60px -10px rgba(255, 110, 132, 0.15)" }}
            >
              <span
                className="material-symbols-outlined text-5xl text-error"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
            </div>
          </div>

          {/* Faded 500 Background */}
          <h1 className="font-headline text-[8rem] md:text-[12rem] font-bold leading-none tracking-tighter opacity-10 select-none absolute -top-24 md:-top-32 pointer-events-none">
            500
          </h1>

          {/* Heading and Description */}
          <div className="space-y-6">
            <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-on-surface">
              Something went wrong
            </h2>
            <p className="text-on-surface-variant text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
              We hit an unexpected error while processing your neural request.
              Our synaptic engineers have been notified and are investigating the
              connection.
            </p>
          </div>

          {/* Action Cluster */}
          <div className="mt-12 flex flex-col items-center gap-6">
            <button
              onClick={reset}
              className="neural-gradient px-10 py-4 rounded-lg text-on-surface font-semibold text-base transition-all duration-300 active:scale-95 shadow-lg flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">
                refresh
              </span>
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="text-on-surface-variant hover:text-on-surface transition-colors duration-200 font-medium flex items-center gap-2 group"
            >
              <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              Back to Dashboard
            </Link>
          </div>

          {/* Diagnostics Card */}
          <div className="mt-20 w-full p-8 rounded-xl bg-surface-container-high/60 backdrop-blur-xl border border-outline-variant/15 text-left max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-on-surface-variant">
                Diagnostics
              </span>
              <span className="text-xs px-2 py-1 rounded-sm bg-error/10 text-error font-mono">
                CRITICAL_FAIL
              </span>
            </div>
            <div className="font-mono text-xs text-on-surface-variant/80 space-y-2">
              <p>&gt; [SYSTEM] Neural pathway timeout at 0x88432</p>
              <p>&gt; [STATUS] Server processing limit exceeded</p>
              <p>&gt; [ERROR_ID] NC-9923-XR-500</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium uppercase tracking-widest text-on-surface-variant">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
            <span>System Degradation</span>
          </div>
          <span className="opacity-20">|</span>
          <span className="font-mono">Error Code: 500_INTERNAL_SERVER_ERROR</span>
        </div>
      </footer>
    </div>
  );
}
