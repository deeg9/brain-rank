import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <section className="py-16 md:py-32 px-6 md:px-8">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <h2 className="font-headline text-3xl md:text-5xl font-bold text-on-background mb-6">
          Ready?
        </h2>
        <Link href="/signup">
          <Button variant="landing" size="lg" className="text-lg w-full md:w-auto">
            Get Started Free
          </Button>
        </Link>
        <p className="text-on-surface-variant text-sm mt-4">
          No credit card required.
        </p>
      </div>
    </section>
  );
}
