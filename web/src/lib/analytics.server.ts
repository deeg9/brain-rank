import 'server-only';
import { PostHog } from 'posthog-node';
import type { EventMap, EventName } from './analytics';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;
  const key = process.env.POSTHOG_API_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  if (!key) return null;
  client = new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

export async function trackServer<E extends EventName>(
  event: E,
  distinctId: string,
  props: EventMap[E],
): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  ph.capture({
    distinctId,
    event,
    properties: props as Record<string, unknown>,
  });
  await ph.flush();
}

export async function identifyServer(
  distinctId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  ph.identify({ distinctId, properties });
  await ph.flush();
}
