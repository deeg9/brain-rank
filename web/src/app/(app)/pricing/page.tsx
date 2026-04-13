import type { Metadata } from "next";
import { PricingPage } from "@/components/pricing/PricingPage";

export const metadata: Metadata = {
  title: "Pricing | NeuroCut",
  description: "Neural A/B testing plans for content creators. Start with 100 credits per month.",
};

export default function PricingRoute() {
  return <PricingPage />;
}
