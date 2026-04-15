'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useState } from 'react';

function getConsent(): boolean | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('cookie_consent');
  if (stored === 'accepted') return true;
  if (stored === 'declined') return false;
  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!key) return;

    posthog.init(key, {
      api_host: host,
      person_profiles: 'identified_only',
      capture_pageview: false, // we handle this manually for Next.js SPA navigation
      persistence: 'localStorage+cookie',
      loaded: (ph) => {
        const consent = getConsent();
        if (consent === true) {
          ph.opt_in_capturing();
        } else if (consent === false) {
          ph.opt_out_capturing();
        }
        // If null (no choice yet), PostHog is initialized but not capturing
        // until the user makes a choice via the cookie banner
      },
    });

    setReady(true);
  }, []);

  if (!ready) return <>{children}</>;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
