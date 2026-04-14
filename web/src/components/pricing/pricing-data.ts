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
    desc: "Try BrainRank for free. Get 3 neural analyses per week to test your content.",
    cta: "Get Started Free",
    features: [
      "3 credits per week",
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
    monthlyPrice: 19.99,
    annualPrice: 199,
    desc: "For creators and brands who need unlimited testing, category benchmarks, and priority processing.",
    popular: true,
    cta: "Upgrade to Creator",
    features: [
      "Unlimited analyses per month",
      "Everything in Free, plus:",
      "Priority processing queue",
      "Category benchmark comparisons",
      "Export full JSON reports",
      "Team collaboration (up to 5 seats)",
      "API access for integrations",
      "Priority email support",
    ],
  },
];
