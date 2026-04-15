import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HeroOdyssey } from "@/components/hero/HeroOdyssey";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureCards } from "@/components/landing/FeatureCards";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div data-landing className="bg-background">
      <HeroOdyssey />
      <HowItWorks />
      <FeatureCards />
    </div>
  );
}
