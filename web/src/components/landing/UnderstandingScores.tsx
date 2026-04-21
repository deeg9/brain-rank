"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";

const NETWORKS: { name: string; color: string; role: string }[] = [
  { name: "Attention", color: "#3b82f6", role: "Focused concentration" },
  { name: "Reward", color: "#8b5cf6", role: "Dopamine + anticipation" },
  { name: "Emotional", color: "#ec4899", role: "Affective response" },
  { name: "Social", color: "#f59e0b", role: "Theory-of-mind processing" },
  { name: "Visual", color: "#22c55e", role: "Image salience" },
  { name: "Auditory", color: "#f97316", role: "Sound + speech processing" },
  { name: "Language", color: "#06b6d4", role: "Narrative comprehension" },
  { name: "Default Mode", color: "#f43f5e", role: "Self-reference + mind-wandering" },
  { name: "Motion", color: "#84cc16", role: "Movement tracking" },
];

export function UnderstandingScores() {
  return (
    <section className="py-10 md:py-32 px-6 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-4 text-center mb-8 md:mb-12">
          <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-on-background max-w-2xl">
            How BRAIN | RANK scores your content
          </h2>
          <p className="text-on-background/70 max-w-2xl">
            Every upload is scored on two custom engagement metrics and nine raw
            neural networks from Meta&apos;s TRIBE v2 model. Here&apos;s what
            they mean and how they&apos;re computed.
          </p>
        </div>

        <Tabs defaultValue="hook" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger value="hook">
                <span className="material-symbols-outlined text-base">bolt</span>
                Hook Score
              </TabsTrigger>
              <TabsTrigger value="retention">
                <span className="material-symbols-outlined text-base">
                  trending_up
                </span>
                Retention
              </TabsTrigger>
              <TabsTrigger value="tribe">
                <span className="material-symbols-outlined text-base">
                  neurology
                </span>
                TRIBE v2
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 md:p-12">
            <TabsContent
              value="hook"
              className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center"
            >
              <div className="flex flex-col gap-5">
                <span className="w-fit inline-flex items-center rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-mono uppercase tracking-wider text-on-background/70">
                  Derived metric
                </span>
                <h3 className="font-headline text-2xl md:text-3xl font-bold text-on-background">
                  Hook Score
                </h3>
                <p className="text-on-background/70 md:text-lg">
                  How strongly your content engages the brain in the opening
                  10 seconds — the window where viewers on short-form feeds
                  decide to stay or scroll. We average predicted activation
                  across all nine networks over the first five 2-second
                  segments.
                </p>
                <p className="text-on-background/70 text-sm">
                  Above 0.40 is strong. Drops below that range are the most
                  common weak-hook signal.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-6 font-mono text-sm text-on-background/80">
                <div className="text-xs uppercase tracking-wider text-on-background/50 mb-3">
                  Formula
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-on-background">Hook</span> = mean
                    <span className="text-on-background/60">(</span>
                    <span className="text-[#3b82f6]">all 9 networks</span>
                    <span className="text-on-background/60">)</span>
                  </div>
                  <div className="pl-12">
                    averaged over segments{" "}
                    <span className="text-[#22c55e]">1&ndash;5</span>
                  </div>
                  <div className="pt-3 text-on-background/50 text-xs">
                    first five 2-second windows = the first 10 seconds of content
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="retention"
              className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center"
            >
              <div className="flex flex-col gap-5">
                <span className="w-fit inline-flex items-center rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-mono uppercase tracking-wider text-on-background/70">
                  Derived metric
                </span>
                <h3 className="font-headline text-2xl md:text-3xl font-bold text-on-background">
                  Retention Score
                </h3>
                <p className="text-on-background/70 md:text-lg">
                  The weakest 10-second stretch across your content. We slide
                  a 5-segment window over the full timeline and take the
                  minimum mean activation — so a low retention score points
                  at the worst-performing section, not an average.
                </p>
                <p className="text-on-background/70 text-sm">
                  Use it to find the single weakest cut and decide whether to
                  tighten, replace, or remove it.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-6 font-mono text-sm text-on-background/80">
                <div className="text-xs uppercase tracking-wider text-on-background/50 mb-3">
                  Formula
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-on-background">Retention</span> = min
                    <span className="text-on-background/60">(</span>
                  </div>
                  <div className="pl-6">
                    mean<span className="text-on-background/60">(</span>
                    <span className="text-[#f43f5e]">segments[i..i+5]</span>
                    <span className="text-on-background/60">)</span>{" "}
                    <span className="text-on-background/50">for all i</span>
                  </div>
                  <div>
                    <span className="text-on-background/60">)</span>
                  </div>
                  <div className="pt-3 text-on-background/50 text-xs">
                    minimum of every rolling 10-second window (5 × 2-second segments)
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="tribe"
              className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center"
            >
              <div className="flex flex-col gap-5">
                <span className="w-fit inline-flex items-center rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-mono uppercase tracking-wider text-on-background/70">
                  Raw neural data
                </span>
                <h3 className="font-headline text-2xl md:text-3xl font-bold text-on-background">
                  TRIBE v2 networks
                </h3>
                <p className="text-on-background/70 md:text-lg">
                  Hook and Retention are derived — but the raw data comes from
                  Meta&apos;s TRIBE v2, a foundation model trained on fMRI
                  recordings of real people watching video. It predicts
                  activation across nine canonical brain networks, second by
                  second.
                </p>
                <p className="text-on-background/70 text-sm">
                  Every raw network score is available on your results page —
                  build your own metrics if ours don&apos;t fit.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-5">
                <div className="text-xs uppercase tracking-wider text-on-background/50 mb-4 font-mono">
                  The nine networks
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  {NETWORKS.map((n) => (
                    <div key={n.name} className="flex items-start gap-3">
                      <span
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: n.color }}
                      />
                      <div>
                        <div className="text-sm font-medium text-on-background">
                          {n.name}
                        </div>
                        <div className="text-xs text-on-background/60">
                          {n.role}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </section>
  );
}
