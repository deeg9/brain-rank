"use client";

const FEATURES = [
  {
    icon: "video_library",
    title: "Multi-Modal Input",
    description:
      "Analyze videos, images, and text. Upload any content format and get neural engagement scores.",
  },
  {
    icon: "neurology",
    title: "9 Brain Networks",
    description:
      "Detailed activation mapping across visual, auditory, language, attention, and memory networks.",
  },
  {
    icon: "explore",
    title: "Discovery Feed",
    description:
      "Explore public analyses. See what content lights up brains across the community.",
  },
];

export function FeatureCards() {
  return (
    <section className="py-16 md:py-32 px-6 md:px-8">
      <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-bold text-on-background text-center mb-16">
        What You Get
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="bg-[#111111] border border-white/10 p-6 md:p-8 rounded-lg"
          >
            <div className="flex flex-col gap-4">
              <span className="material-symbols-outlined text-3xl text-white">
                {feature.icon}
              </span>
              <h3 className="font-headline text-lg font-bold text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-[#888888] leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
