'use client';

import posthog from 'posthog-js';

export type InputType = 'video' | 'image' | 'text' | 'text_spoken' | 'text_visual';
export type SubscriptionPlan = 'monthly' | 'annual';
export type FilterType = 'type' | 'category' | 'score' | 'sort' | 'search';

export type EventMap = {
  user_signed_up: { method: 'email' };
  user_logged_in: { method: 'email' };
  user_signed_out: Record<string, never>;
  analysis_started: {
    job_id: string;
    input_type: InputType;
    category: string | null;
    has_text: boolean;
    is_creator: boolean;
    credits_remaining: number;
  };
  analysis_completed: {
    job_id: string;
    input_type: InputType;
    duration_ms: number;
  };
  analysis_failed: {
    job_id: string;
    error_message: string;
  };
  credit_limit_hit: {
    credits_used: number;
    credits_limit: number;
  };
  results_viewed: {
    job_id: string;
    input_type: InputType;
    score: number | null;
  };
  discover_filter_changed: {
    filter_type: FilterType;
    value: string;
  };
  bookmark_toggled: {
    job_id: string;
    action: 'add' | 'remove';
  };
  checkout_started: {
    plan: SubscriptionPlan;
  };
  subscription_activated: {
    plan: SubscriptionPlan;
    amount: number;
    customer_id: string;
  };
  subscription_cancelled: {
    plan: SubscriptionPlan;
  };
};

export type EventName = keyof EventMap;

export function track<E extends EventName>(event: E, props: EventMap[E]): void {
  if (!posthog.__loaded) return;
  posthog.capture(event, props as Record<string, unknown>);
}
