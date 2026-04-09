import Link from "next/link";
import { Button } from "@/components/ui";

export default function WelcomePage() {
  return (
    <div className="bg-surface-container-high rounded-xl p-8 ghost-border ambient-glow text-center">
      <span className="material-symbols-outlined text-6xl text-primary mb-6 block">
        neurology
      </span>
      <h1 className="font-headline font-bold text-4xl text-on-surface mb-4">
        Welcome to NeuroCut
      </h1>
      <p className="text-on-surface-variant text-lg max-w-sm mx-auto mb-8">
        Upload a video and discover where your audience&apos;s brain lights up
        -- and where they tune out.
      </p>
      <Link href="/upload">
        <Button variant="primary" size="lg">
          Get Started
        </Button>
      </Link>
    </div>
  );
}
