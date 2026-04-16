"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PRICING_TIERS } from "./pricing-data";
import { PricingCard } from "./PricingCard";

type BillPlan = "monthly" | "annually";

export function PricingPage() {
  const [billPlan, setBillPlan] = useState<BillPlan>("monthly");

  const handleSwitch = () => {
    setBillPlan((prev) => (prev === "monthly" ? "annually" : "monthly"));
  };

  return (
    <div className="relative flex flex-col items-center justify-center max-w-5xl py-6 md:py-12 mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold text-black">
          Pricing
        </h1>
        <p className="text-sm md:text-base text-gray-500 mt-4 leading-relaxed">
          Neural A/B testing for your content. Upload videos, images, or text and get
          full brain activation reports powered by brain predictive modeling.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <span
          className={cn(
            "text-sm font-headline font-bold transition-colors",
            billPlan === "monthly" ? "text-black" : "text-gray-400"
          )}
        >
          Monthly
        </span>
        <button
          onClick={handleSwitch}
          className="relative rounded-full focus:outline-none"
        >
          <div className="w-12 h-6 transition rounded-full bg-black" />
          <div
            className={cn(
              "absolute inline-flex items-center justify-center w-4 h-4 transition-all duration-300 ease-in-out top-1 left-1 rounded-full bg-white",
              billPlan === "annually" ? "translate-x-6" : "translate-x-0"
            )}
          />
        </button>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-headline font-bold transition-colors",
              billPlan === "annually" ? "text-black" : "text-gray-400"
            )}
          >
            Annually
          </span>
          {billPlan === "annually" && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
              Save 20%
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-2 pt-8 lg:pt-12 gap-4 lg:gap-6 max-w-4xl mx-auto">
        {PRICING_TIERS.map((tier) => (
          <PricingCard key={tier.id} tier={tier} billPlan={billPlan} />
        ))}
      </div>

      {/* Bottom note */}
      <p className="text-xs text-gray-400 mt-8 text-center max-w-lg">
        All plans include access to the full neural activation report with 9 brain regions,
        3D brain heatmap viewer, and the Discover leaderboard. Credits refresh monthly.
      </p>
    </div>
  );
}
