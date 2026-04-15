"use client";

const STEPS = [
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
    <section className="py-32 px-6 md:px-8">
      <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-background text-center mb-16">
        How It Works
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
        {STEPS.map((step) => (
          <div key={step.number} className="flex flex-col items-center">
            <span className="font-headline text-5xl font-black text-on-surface-variant/30">
              {step.number}
            </span>
            <span className="material-symbols-outlined text-4xl text-on-background">
              {step.icon}
            </span>
            <h3 className="font-headline text-xl font-bold text-on-background mt-4">
              {step.title}
            </h3>
            <p className="text-on-surface-variant text-sm mt-2 max-w-xs text-center">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
