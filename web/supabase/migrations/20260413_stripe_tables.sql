-- Stripe Payments Schema Migration
-- Phase 59: Foundation (Schema + SDK)
-- Tables: customers, subscriptions, credit_usage, stripe_events

-- ============================================================
-- 1. CUSTOMERS TABLE
-- Maps auth.users to Stripe customer IDs
-- stripe_customer_id is sensitive and only needed server-side
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for anon role.
-- Only service role (webhook handler) can read/write.
-- This is intentional: stripe_customer_id is sensitive.

-- ============================================================
-- 2. SUBSCRIPTIONS TABLE
-- Subscription state synced from Stripe webhooks
-- ============================================================
CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'canceled', 'incomplete',
  'incomplete_expired', 'past_due', 'unpaid', 'paused'
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,                          -- Stripe subscription ID (sub_xxx)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status subscription_status NOT NULL,
  price_id TEXT,                                -- Stripe price ID (price_xxx)
  quantity INTEGER DEFAULT 1,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription (needed for client-side status display)
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies = service role only writes (via webhook handler)

-- Index for looking up active subscription by user (core query for credit gating)
CREATE INDEX idx_subscriptions_user_status
  ON subscriptions (user_id, status);

-- ============================================================
-- 3. CREDIT USAGE TABLE
-- Track per-analysis credit usage for free tier gating
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit usage"
  ON credit_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Index for weekly count queries (the core gating query)
CREATE INDEX idx_credit_usage_user_week
  ON credit_usage (user_id, created_at DESC);

-- ============================================================
-- 4. STRIPE EVENTS TABLE
-- Webhook idempotency log + debugging audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  error TEXT
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- No policies = only service role can read/write
-- This table is for server-side debugging only
