import type { Metadata } from "next";
import { PageTransition } from "@/components/ui/PageTransition";
import { PricingPage } from "@/components/pricing/PricingPage";

export const metadata: Metadata = {
  title: "Pricing | BrainRank",
  description: "Neural A/B testing plans for content creators. Start with 100 credits per month.",
};

export default function PricingRoute() {
  return <PageTransition><PricingPage /></PageTransition>;
}
