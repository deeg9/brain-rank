"use client";

import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { PricingTier } from "./pricing-data";

type BillPlan = "monthly" | "annually";

interface PricingCardProps {
  tier: PricingTier;
  billPlan: BillPlan;
}

export function PricingCard({ tier, billPlan }: PricingCardProps) {
  const price = billPlan === "monthly" ? tier.monthlyPrice : tier.annualPrice;

  return (
    <div
      className={cn(
        "flex flex-col relative rounded-2xl lg:rounded-3xl bg-white items-start w-full border overflow-hidden shadow-sm",
        tier.popular ? "border-black" : "border-gray-200"
      )}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute top-0 inset-x-0 h-1 bg-black" />
      )}

      {/* Header */}
      <div className="p-6 md:p-8 flex flex-col items-start w-full">
        <div className="flex items-center gap-2">
          <h2 className="font-headline font-bold text-xl text-black">
            {tier.name}
          </h2>
          {tier.popular && (
            <span className="px-2 py-0.5 bg-black text-white text-[9px] font-headline font-bold uppercase tracking-widest rounded-full">
              Best Value
            </span>
          )}
        </div>
        <div className="mt-4">
          <span className="text-4xl md:text-5xl font-headline font-bold text-black">
            <NumberFlow
              value={price}
              format={{
                currency: "USD",
                style: "currency",
                minimumFractionDigits: price % 1 === 0 ? 0 : 2,
                maximumFractionDigits: price % 1 === 0 ? 0 : 2,
                currencyDisplay: "narrowSymbol",
              }}
            />
          </span>
          <span className="text-sm text-gray-500 font-bold ml-1">
            {billPlan === "monthly" ? "/mo" : "/yr"}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          {tier.desc}
        </p>
        <p className="text-xs font-bold text-black mt-2">
          {tier.credits === -1 ? "Unlimited analyses per month" : `${tier.credits} credits per week`}
        </p>
      </div>

      {/* CTA + Billing note */}
      <div className="flex flex-col items-start w-full px-6 md:px-8 pb-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => alert("Payment processing coming soon!")}
        >
          {tier.cta}
        </Button>
        <div className="h-8 overflow-hidden w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.span
              key={billPlan}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-xs text-center text-gray-400 mt-3 mx-auto block font-bold"
            >
              {tier.monthlyPrice === 0
                ? "Free forever"
                : billPlan === "monthly"
                  ? "Billed monthly"
                  : `Billed $${tier.annualPrice.toFixed(2)} per year`}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Features */}
      <div className="flex flex-col items-start w-full p-6 md:px-8 mb-4 gap-y-2">
        <span className="text-sm font-bold text-black mb-2">Includes:</span>
        {tier.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="material-symbols-outlined text-black text-lg leading-none mt-0.5">
              check
            </span>
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
