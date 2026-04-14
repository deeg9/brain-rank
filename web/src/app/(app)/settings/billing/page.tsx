"use client";

import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type BillPlan = "monthly" | "annually";

type Plan = {
  id: string;
  title: string;
  desc: string;
  monthlyPrice: number;
  annuallyPrice: number;
  badge?: string;
  buttonText: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: "starter",
    title: "Hobbyist",
    desc: "For individual creators exploring neural engagement insights on their content. Get started for free.",
    monthlyPrice: 0,
    annuallyPrice: 0,
    buttonText: "Get Started Free",
    features: [
      "5 analysis credits per week",
      "Video, image & text analysis",
      "9 brain network scores",
      "3D brain activation maps",
      "Neural activation timeline",
      "A/B comparison tool",
      "Public profile & leaderboard",
    ],
  },
  {
    id: "pro",
    title: "Creator",
    desc: "For teams and agencies who need unlimited neural insights and priority processing for high-volume content testing.",
    monthlyPrice: 20,
    annuallyPrice: 200,
    buttonText: "Upgrade to Creator",
    features: [
      "Unlimited analysis credits",
      "Everything in Hobbyist",
      "Priority GPU processing",
      "Batch upload & analysis",
      "Priority support",
    ],
  },
];

function PlanCard({ plan, billPlan }: { plan: Plan; billPlan: BillPlan }) {
  const isPro = plan.title === "Creator";

  return (
    <div
      className={cn(
        "flex flex-col relative rounded-2xl lg:rounded-3xl transition-all items-start w-full border overflow-hidden bg-white",
        isPro ? "border-black" : "border-gray-200"
      )}
    >
      {isPro && (
        <div className="absolute top-1/2 inset-x-0 mx-auto h-12 -rotate-45 w-full bg-black/80 rounded-2xl lg:rounded-3xl blur-[8rem] -z-10" />
      )}

      <div className="p-4 md:p-8 flex rounded-t-2xl lg:rounded-t-3xl flex-col items-start w-full relative">
        {plan.badge && (
          <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-black text-white rounded-full mb-3">
            {plan.badge}
          </span>
        )}
        <h2 className="font-headline font-bold text-xl text-gray-900">
          {plan.title}
        </h2>
        <h3 className="mt-3 text-2xl font-bold font-headline md:text-5xl text-gray-900">
          <NumberFlow
            value={billPlan === "monthly" ? plan.monthlyPrice : plan.annuallyPrice}
            suffix={billPlan === "monthly" ? "/mo" : "/yr"}
            format={{
              currency: "USD",
              style: "currency",
              currencySign: "standard",
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
              currencyDisplay: "narrowSymbol",
            }}
          />
        </h3>
        <p className="text-sm text-gray-500 mt-2">{plan.desc}</p>
      </div>

      {isPro && (
        <div className="flex flex-col items-start w-full px-4 py-2 md:px-8">
          <button
            onClick={() => alert("Payment processing coming soon!")}
            className="w-full py-3 rounded-lg text-sm font-headline font-bold transition-all active:scale-[0.98] bg-black text-white hover:bg-gray-800 shadow-lg"
          >
            {plan.buttonText}
          </button>
          <div className="h-8 overflow-hidden w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.span
                key={billPlan}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="text-sm text-center text-gray-400 mt-3 mx-auto block"
              >
                {billPlan === "monthly"
                  ? "Billed monthly"
                  : "Billed annually"}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="flex flex-col items-start w-full p-5 mb-4 ml-1 gap-y-2">
        <span className="text-sm font-headline font-bold text-gray-900 mb-2">
          Includes:
        </span>
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-center justify-start gap-2">
            <span className="material-symbols-outlined text-gray-900" style={{ fontSize: 18 }}>
              check
            </span>
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [billPlan, setBillPlan] = useState<BillPlan>("monthly");

  const handleSwitch = () => {
    setBillPlan((prev) => (prev === "monthly" ? "annually" : "monthly"));
  };

  return (
    <div className="relative flex flex-col items-center justify-center max-w-5xl py-12 mx-auto">
      <div className="flex flex-col items-center justify-center max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline text-gray-900 mt-6">
            Pricing
          </h2>
          <p className="text-base md:text-lg text-center text-gray-500 mt-6">
            Unlock neural engagement insights for your content.
          </p>
        </div>
        <div className="flex items-center justify-center space-x-4 mt-6">
          <span className="text-sm font-headline font-bold text-gray-900">Monthly</span>
          <button
            onClick={handleSwitch}
            className="relative rounded-full focus:outline-none"
          >
            <div className="w-12 h-6 transition rounded-full shadow-md outline-none bg-black" />
            <div
              className={cn(
                "absolute inline-flex items-center justify-center w-4 h-4 transition-all duration-500 ease-in-out top-1 left-1 rounded-full bg-white",
                billPlan === "annually" ? "translate-x-6" : "translate-x-0"
              )}
            />
          </button>
          <span className="text-sm font-headline font-bold text-gray-900">Annually</span>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 lg:grid-cols-2 pt-8 lg:pt-12 gap-4 lg:gap-6 max-w-4xl mx-auto">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} billPlan={billPlan} />
        ))}
      </div>
    </div>
  );
}
