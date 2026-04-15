import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-headline font-black text-lg tracking-widest uppercase text-black">
          BRAIN<span className="text-black/30 mx-0.5">|</span>RANK
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to app
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-8 py-12 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-8 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-headline font-black tracking-widest uppercase">
              BRAIN<span className="text-gray-300 mx-px">|</span>RANK
            </span>
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
            <Link href="/disclaimer" className="hover:text-black transition-colors">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
