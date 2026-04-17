export interface PricingTier {
  id: string;
  name: string;
  credits: number;
  monthlyPrice: number;
  annualPrice: number;
  desc: string;
  popular?: boolean;
  cta: string;
  features: string[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    credits: 3,
    monthlyPrice: 0,
    annualPrice: 0,
    desc: "Try BrainRank for free. Get 3 neural analyses per day to test your content.",
    cta: "Get Started Free",
    features: [
      "3 credits per day",
      "Full 9-region brain activation reports",
      "Neural Activation Timeline",
      "3D brain heatmap viewer",
      "Arousal & valence metrics",
      "Community support",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    credits: -1,
    monthlyPrice: 20,
    annualPrice: 200,
    desc: "For creators and brands who need unlimited testing, category benchmarks, and priority processing.",
    popular: true,
    cta: "Upgrade to Creator",
    features: [
      "Unlimited analyses per month",
      "Everything in Free, plus:",
      "Priority processing queue",
      "Export full JSON reports",
      "Priority email support",
    ],
  },
];
