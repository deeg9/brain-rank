import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HeroOdyssey } from "@/components/hero/HeroOdyssey";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { PreviewSection } from "@/components/landing/PreviewSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { Footer } from "@/components/layout/Footer";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div data-landing className="relative bg-background">
      {/* Subtle grid lines — landing page only */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px, 40px 40px",
        }}
      />

      {/* Foreground content */}
      <div className="relative z-10">
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
        <Footer />
      </div>
    </div>
  );
}
