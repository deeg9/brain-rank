'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import posthog from 'posthog-js';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted');
    if (posthog.__loaded) posthog.opt_in_capturing();
    setVisible(false);
  }

  function decline() {
    localStorage.setItem('cookie_consent', 'declined');
    if (posthog.__loaded) posthog.opt_out_capturing();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 pointer-events-none">
      <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 pointer-events-auto">
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          We use cookies and analytics to understand how you use BrainRank and improve the experience.{' '}
          <Link href="/privacy" className="text-black font-semibold underline underline-offset-2 hover:text-gray-600 transition-colors">
            Privacy Policy
          </Link>
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={accept}
            className="flex-1 bg-black text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={decline}
            className="flex-1 bg-gray-100 text-gray-700 text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
