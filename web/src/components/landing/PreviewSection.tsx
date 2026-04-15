"use client";

const regions = [
  { label: "Visual", width: "82%", opacity: "bg-white" },
  { label: "Auditory", width: "65%", opacity: "bg-white/70" },
  { label: "Language", width: "48%", opacity: "bg-white/50" },
  { label: "Attention", width: "73%", opacity: "bg-white/80" },
];

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
            <div className="ml-4 bg-white/5 rounded px-3 py-1 text-xs text-white/30 font-mono">
              brainrank.app/results/demo
            </div>
          </div>

          {/* Content area */}
          <div className="bg-[#0a0a0a] p-8">
            <div className="font-headline text-lg font-bold text-white mb-6">
              Neural Analysis: Sample Video
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-8 mb-8">
              <div>
                <div className="text-xs text-white/40 mb-1">Overall Score</div>
                <span className="text-3xl font-bold text-white">7.4</span>
                <span className="text-sm text-white/40">/10</span>
              </div>
              <div>
                <div className="text-xs text-white/40 mb-1">Peak Region</div>
                <span className="text-lg font-bold text-white">Visual Cortex</span>
              </div>
              <div>
                <div className="text-xs text-white/40 mb-1">Duration</div>
                <span className="text-lg font-bold text-white">0:42</span>
              </div>
            </div>

            {/* Brain region bars */}
            <div className="space-y-4">
              {regions.map((region) => (
                <div key={region.label} className="flex items-center gap-4">
                  <span className="text-sm text-white/60 w-20 shrink-0">
                    {region.label}
                  </span>
                  <div className="flex-1 bg-white/5 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${region.opacity}`}
                      style={{ width: region.width }}
                    />
                  </div>
                  <span className="text-sm text-white/60 w-10 text-right">
                    {region.width}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
