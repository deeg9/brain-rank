"use client";

import { LinkPreview } from "@/components/ui/LinkPreview";
import { ContainerScroll } from "@/components/ui/ContainerScroll";

const STEPS: { number: string; icon: string; title: string; description: string; link?: { label: string; href: string } }[] = [
  {
    number: "01",
    icon: "upload",
    title: "Upload Your Content",
    description: "Drop in a video, image, or text. Multi-modal input accepted.",
  },
  {
    number: "02",
    icon: "psychology",
    title: "Neural Analysis",
    description: "TRIBE v2 maps brain activation across 9 neural networks.",
    link: { label: "Learn more about TRIBE v2", href: "https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/" },
  },
  {
    number: "03",
    icon: "insights",
    title: "See Results",
    description: "Per-segment scores reveal exactly where brains engage.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-32 px-6 md:px-8">
      <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold text-on-background text-center mb-16">
        How It Works
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
        {STEPS.map((step) => (
          <div key={step.number} className="flex flex-col items-center">
            <span className="font-headline text-4xl md:text-5xl font-black text-white">
              {step.number}
            </span>
            <span className="material-symbols-outlined text-4xl text-on-background">
              {step.icon}
            </span>
            <h3 className="font-headline text-xl font-bold text-on-background mt-4">
              {step.title}
            </h3>
            <p className="text-white text-sm mt-2 max-w-xs text-center">
              {step.description}
            </p>
            {step.link && (
              <LinkPreview
                url={step.link.href}
                className="text-white/60 text-xs mt-3 underline underline-offset-2 hover:text-white transition-colors"
              >
                {step.link.label} &rarr;
              </LinkPreview>
            )}
          </div>
        ))}
      </div>

      <ContainerScroll titleComponent={null}>
        <video
          src="/videos/brainrank-demo.mp4"
          poster="/images/results-preview.png"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full rounded-2xl object-cover"
        />
      </ContainerScroll>
    </section>
  );
}
