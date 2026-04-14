"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SubscriptionInfo {
  status: string | null;
  tier: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
}

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((data) => {
        setSub(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
    }
    setPortalLoading(false);
  }

  async function handleUpgrade(interval: "monthly" | "annual") {
    setCheckoutLoading(true);
    try {
      const priceId =
        interval === "monthly"
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR_MONTHLY
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_CREATOR_ANNUAL;

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
    setCheckoutLoading(false);
  }

  const isCreator = sub?.tier === "creator";
  const isActive = sub?.status === "active" || sub?.status === "trialing";
  const isPastDue = sub?.status === "past_due";
  const isCanceling = sub?.cancelAtPeriodEnd;

  const renewalDate = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-gray-500">Loading billing info...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold font-headline text-gray-900">
          Billing
        </h2>
        <p className="text-gray-500 mt-2">
          Manage your subscription and billing details.
        </p>
      </motion.div>

      {/* Current Plan Card */}
      <motion.div
        className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">
              Current Plan
            </p>
            <h3 className="text-2xl font-headline font-bold text-gray-900 mt-1">
              {isCreator ? "Creator" : "Free"}
            </h3>
          </div>
          <span
            className={cn(
              "px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full",
              isActive && !isCanceling && "bg-emerald-100 text-emerald-700",
              isPastDue && "bg-amber-100 text-amber-700",
              isCanceling && "bg-gray-100 text-gray-700",
              !isCreator && "bg-gray-100 text-gray-600"
            )}
          >
            {isPastDue
              ? "Past Due"
              : isCanceling
                ? "Canceling"
                : isActive
                  ? "Active"
                  : "Free Tier"}
          </span>
        </div>

        {/* Past due warning */}
        {isPastDue && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <span className="font-bold">Payment failed.</span> Please update
            your payment method to avoid losing access.
          </div>
        )}

        {/* Canceling notice */}
        {isCanceling && renewalDate && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
            Your plan will end on <span className="font-bold">{renewalDate}</span>.
            You&apos;ll retain Creator access until then.
          </div>
        )}

        {/* Renewal info */}
        {isCreator && !isCanceling && renewalDate && (
          <p className="text-sm text-gray-500">
            Next renewal: <span className="font-bold text-gray-700">{renewalDate}</span>
          </p>
        )}

        {!isCreator && (
          <p className="text-sm text-gray-500">
            5 analyses per week. Upgrade to Creator for unlimited.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {isCreator ? (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="px-6 py-2.5 rounded-lg text-sm font-headline font-bold bg-black text-white hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {portalLoading ? "Loading..." : "Manage Subscription"}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleUpgrade("monthly")}
                disabled={checkoutLoading}
                className="px-6 py-2.5 rounded-lg text-sm font-headline font-bold bg-black text-white hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {checkoutLoading ? "Redirecting..." : "Upgrade — $20/mo"}
              </button>
              <button
                onClick={() => handleUpgrade("annual")}
                disabled={checkoutLoading}
                className="px-6 py-2.5 rounded-lg text-sm font-headline font-bold border border-gray-300 text-gray-900 hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {checkoutLoading ? "Redirecting..." : "Upgrade — $200/yr"}
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* What's included */}
      <motion.div
        className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="font-headline font-bold text-gray-900 mb-4">
          {isCreator ? "Your Creator Benefits" : "Free Tier Includes"}
        </h3>
        <div className="space-y-2">
          {(isCreator
            ? [
                "Unlimited analyses per month",
                "Priority GPU processing",
                "Full 9-region brain activation reports",
                "3D brain heatmap viewer",
                "Export full JSON reports",
                "API access for integrations",
                "Priority email support",
              ]
            : [
                "5 credits per week",
                "Full 9-region brain activation reports",
                "Neural activation timeline",
                "3D brain heatmap viewer",
                "Arousal & valence metrics",
              ]
          ).map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-gray-900"
                style={{ fontSize: 18 }}
              >
                check
              </span>
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
