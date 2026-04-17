'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

type Props = {
  userId: string;
  email: string | null;
};

export function IdentifyUser({ userId, email }: Props) {
  useEffect(() => {
    if (!posthog.__loaded) return;
    if (posthog.get_distinct_id() === userId) return;
    posthog.identify(userId, {
      email: email ?? undefined,
    });
  }, [userId, email]);

  return null;
}
