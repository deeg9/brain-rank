import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-16">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-headline font-black text-lg tracking-widest uppercase text-white">BRAIN<span className="text-white/30 mx-0.5">|</span>RANK</h3>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-white mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Terms and Conditions</Link></li>
              <li><Link href="/disclaimer" className="text-sm text-white/60 hover:text-white transition-colors">Disclaimer</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-white mb-3">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/resources" className="text-sm text-white/60 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/resources#scores" className="text-sm text-white/60 hover:text-white transition-colors">Understanding Scores</Link></li>
              <li><Link href="/resources#regions" className="text-sm text-white/60 hover:text-white transition-colors">Brain Regions</Link></li>
              <li><Link href="/use-cases" className="text-sm text-white/60 hover:text-white transition-colors">Use Cases</Link></li>
              <li><a href="https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/" target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 hover:text-white transition-colors">TRIBE v2</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-white mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">About</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex items-center justify-between">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} <span className="font-headline font-black tracking-widest uppercase">BRAIN<span className="text-white/20 mx-px">|</span>RANK</span>
          </p>
          <p className="text-xs text-white/40">
            Neural activation predictions are computational estimates, not medical measurements.
          </p>
        </div>
      </div>
    </footer>
  );
}
