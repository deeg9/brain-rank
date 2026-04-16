import Image from "next/image";

export function PreviewSection() {
  return (
    <section className="py-32 px-6 md:px-8">
      <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-background text-center mb-16">
        What Your Results Look Like
      </h2>

      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border border-white/10 overflow-hidden">
          {/* Browser chrome bar */}
          <div className="bg-[#111111] px-4 py-3 flex items-center gap-2 border-b border-white/10">
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="ml-4 bg-white/5 rounded px-3 py-1 text-xs text-white/30 font-mono hidden md:block">
              brainrank.app/results/demo
            </div>
          </div>

          {/* Screenshot */}
          <div className="bg-[#0a0a0a]">
            <Image
              src="/images/results-preview.png"
              alt="BrainRank neural analysis results showing video player, brain activation map, and region scores"
              width={1920}
              height={1080}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
