import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-headline font-black text-lg tracking-widest uppercase text-black">BRAIN<span className="text-black/30 mx-0.5">|</span>RANK</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Neural A/B testing for content creators. See how your content ranks using brain predictive modeling.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-black mb-3">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-sm text-gray-500 hover:text-black transition-colors">Dashboard</Link></li>
              <li><Link href="/upload" className="text-sm text-gray-500 hover:text-black transition-colors">Upload</Link></li>
              <li><Link href="/discover" className="text-sm text-gray-500 hover:text-black transition-colors">Discover</Link></li>
              <li><Link href="/bookmarks" className="text-sm text-gray-500 hover:text-black transition-colors">Bookmarks</Link></li>
              <li><Link href="/pricing" className="text-sm text-gray-500 hover:text-black transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-black mb-3">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/resources" className="text-sm text-gray-500 hover:text-black transition-colors">How It Works</Link></li>
              <li><Link href="/resources#scores" className="text-sm text-gray-500 hover:text-black transition-colors">Understanding Scores</Link></li>
              <li><Link href="/resources#regions" className="text-sm text-gray-500 hover:text-black transition-colors">Brain Regions</Link></li>
              <li><Link href="/use-cases" className="text-sm text-gray-500 hover:text-black transition-colors">Use Cases</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-black mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/settings/billing" className="text-sm text-gray-500 hover:text-black transition-colors">Billing</Link></li>
              <li><Link href="/settings" className="text-sm text-gray-500 hover:text-black transition-colors">Settings</Link></li>
              <li><Link href="/profile" className="text-sm text-gray-500 hover:text-black transition-colors">Profile</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-6 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} <span className="font-headline font-black tracking-widest uppercase">BRAIN<span className="text-gray-300 mx-px">|</span>RANK</span>
          </p>
          <p className="text-xs text-gray-400">
            Neural activation predictions are computational estimates, not medical measurements.
          </p>
        </div>
      </div>
    </footer>
  );
}
