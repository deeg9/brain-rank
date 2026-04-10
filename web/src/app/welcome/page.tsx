import Link from "next/link";
import { Button } from "@/components/ui";

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface selection:bg-primary/30">
      {/* Decorative background blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/6 rounded-full blur-[128px]" />
      </div>

      <main className="w-full max-w-4xl px-8 flex flex-col min-h-screen">
        {/* Header Section */}
        <header className="flex justify-between items-center py-12">
          <div className="flex items-center gap-3">
            <img
              src="/illustrations/logo-icon.png"
              alt="NeuroCut"
              className="w-10 h-10 rounded-lg"
            />
            <span className="font-headline font-black text-xl tracking-tight text-on-background">
              NeuroCut
            </span>
          </div>
          <Link
            href="/dashboard"
            className="font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-200"
          >
            Skip
          </Link>
        </header>

        {/* Centered Content Canvas */}
        <div className="flex-grow flex flex-col items-center justify-center gap-10">
          {/* Hero Illustration */}
          <div className="w-full aspect-video bg-surface-container rounded-xl overflow-hidden relative group">
            <img
              src="/illustrations/welcome-hero.png"
              alt="Neural network visualization"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Floating Semantic Element */}
            <div className="absolute bottom-6 left-6 glass-surface px-4 py-2 rounded-lg flex items-center gap-3 border border-outline-variant/10 backdrop-blur-md bg-surface-container-high/60">
              <span className="material-symbols-outlined text-secondary text-sm">
                insights
              </span>
              <span className="text-xs font-mono text-on-surface-variant tracking-wider uppercase">
                Neural Processing Active
              </span>
            </div>
          </div>

          {/* Content Hierarchy */}
          <div className="text-center max-w-2xl flex flex-col items-center">
            <h1 className="font-headline text-5xl font-bold tracking-tight text-on-background mb-4">
              Welcome to NeuroCut
            </h1>
            <p className="text-lg text-on-surface-variant font-body leading-relaxed max-w-lg">
              See how the brain responds to your content with neural activation analysis.
              Analyze pacing, hooks, and retention peaks before you publish.
            </p>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center gap-8 w-full">
            <Link href="/upload">
              <Button variant="primary" size="lg" className="text-lg px-12 py-5 rounded-xl shadow-[0_0_20px_-5px_rgba(186,158,255,0.4)]">
                <span className="material-symbols-outlined">upload</span>
                Upload Your First Video
              </Button>
            </Link>

            {/* Step Indicator */}
            <div className="flex gap-3">
              <div className="h-1.5 w-8 rounded-full bg-primary" />
              <div className="h-1.5 w-1.5 rounded-full bg-surface-container-highest" />
              <div className="h-1.5 w-1.5 rounded-full bg-surface-container-highest" />
              <div className="h-1.5 w-1.5 rounded-full bg-surface-container-highest" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-12 flex justify-between items-center opacity-40">
          <div className="text-[10px] font-mono tracking-widest uppercase">
            v1.0.4-beta / secure_neural_layer
          </div>
          <div className="flex gap-6">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="material-symbols-outlined text-sm">
              verified_user
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
