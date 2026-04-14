import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-background text-on-surface flex flex-col items-center justify-center min-h-screen overflow-hidden relative">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface flex justify-between items-center px-8 z-50">
        <div className="flex items-center gap-4">
          <span className="text-lg font-black text-on-surface font-headline tracking-widest uppercase">
            BRAIN<span className="text-on-surface-variant/40 mx-0.5">|</span>RANK
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6">
        {/* Background Ambient Glow */}
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />

        {/* Illustration Area */}
        <div className="w-64 h-64 mb-12 bg-surface-container flex items-center justify-center rounded-xl ghost-border overflow-hidden group">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-surface-container-low opacity-50 group-hover:opacity-30 transition-opacity" />
            <div className="relative flex flex-col items-center gap-4">
              <span
                className="material-symbols-outlined text-8xl text-primary/40"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                psychology_alt
              </span>
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="w-2 h-2 rounded-full bg-primary-dim opacity-50" />
                <span className="w-2 h-2 rounded-full bg-surface-container-highest" />
              </div>
            </div>
          </div>
        </div>

        {/* Typography Stack */}
        <div className="space-y-4">
          <h1 className="text-[7rem] md:text-[9rem] leading-none font-bold text-primary font-headline tracking-tighter">
            404
          </h1>
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-semibold text-on-surface font-headline">
              Page not found
            </h2>
            <p className="text-on-surface-variant text-lg font-normal max-w-md mx-auto">
              The page you are looking for does not exist. Our neural
              processors couldn&apos;t locate this coordinate in the editorial
              space.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12">
          <Link
            href="/dashboard"
            className="neural-gradient inline-flex items-center gap-3 px-8 py-4 rounded-lg text-on-background font-semibold text-sm hover:opacity-90 transition-all active:scale-95 shadow-[0_0_20px_rgba(186,158,255,0.2)]"
          >
            <span className="material-symbols-outlined text-lg">
              dashboard
            </span>
            Back to Dashboard
          </Link>
        </div>

        {/* Footer Metadata */}
        <div className="mt-20 flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-headline">
          <span>System Status: Operational</span>
          <span className="w-1 h-1 rounded-full bg-on-surface-variant/20" />
          <span>Error Code: 0xNEURAL_VOID</span>
        </div>
      </main>

      {/* Background Grid Texture */}
      <div className="fixed inset-0 -z-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(14,14,16,0)_0%,_#0e0e10_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#f9f5f8 1px, transparent 1px), linear-gradient(90deg, #f9f5f8 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>
    </div>
  );
}
