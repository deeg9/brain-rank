import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HeroOdyssey } from "@/components/hero/HeroOdyssey";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { PreviewSection } from "@/components/landing/PreviewSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div data-landing className="bg-background">
      <HeroOdyssey />
      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <FeatureCards />
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <PreviewSection />
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <FinalCTA />
      </ScrollReveal>
    </div>
  );
}
