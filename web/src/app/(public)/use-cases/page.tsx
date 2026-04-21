import Link from "next/link";
import { PageTransition } from "@/components/ui/PageTransition";

export const metadata = {
  title: "What is BrainRank? | BrainRank",
  description:
    "BrainRank is a non-commercial research beta predicting how the brain responds to content — powered by Meta's TRIBE v2 under CC BY-NC 4.0.",
};

export default function UseCasesPage() {
  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-10 md:space-y-12 pt-6 pb-16 px-4 md:px-0">
        {/* Header */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-black/10 text-[10px] uppercase tracking-widest text-gray-500">
            <span className="material-symbols-outlined text-[12px]">science</span>
            Research Beta
          </span>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-black tracking-tight mt-3">
            What is BrainRank?
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            A non-commercial research beta for understanding how the brain responds
            to content.
          </p>
        </div>

        {/* Mission */}
        <section className="bg-white rounded-xl p-5 md:p-8 shadow-sm space-y-4">
          <h2 className="font-headline text-2xl font-bold text-black">The project</h2>
          <p className="text-gray-700 leading-relaxed">
            BrainRank is a <strong>non-commercial research beta</strong> powered by
            Meta&apos;s{" "}
            <a
              href="https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              TRIBE v2
            </a>{" "}
            — a brain-predictive foundation model released in March 2026 under
            CC BY-NC 4.0 — and returns a predicted neural activation profile across
            nine functional brain networks. Everything on BrainRank is free during the
            beta, and the aggregated predictions contribute to a growing, openly
            published dataset of content-to-neural-response mappings.
          </p>
          <p className="text-gray-700 leading-relaxed">
            The predictions are <strong>computational estimates</strong>, not medical
            measurements or scans of any individual viewer&apos;s brain. They are a
            directional signal for how content is likely to land in aggregate — useful
            for creators, researchers, and anyone curious about the neuroscience of
            storytelling.
          </p>
        </section>

        {/* What you get */}
        <section className="bg-white rounded-xl p-5 md:p-8 shadow-sm space-y-4">
          <h2 className="font-headline text-2xl font-bold text-black">What you get back</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-black mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">Nine brain networks, scored second-by-second</p>
                <p className="text-xs text-gray-600">
                  Attention, Reward, Emotional, Social, Visual, Auditory, Language, Default
                  Mode, and Motion — each predicted in 2-second windows.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-black mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">Hook and Retention metrics</p>
                <p className="text-xs text-gray-600">
                  Derived from the raw network scores — shows where the content grabs
                  attention and where predicted engagement drops off.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-black mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">3D brain activation map</p>
                <p className="text-xs text-gray-600">
                  Visualize predicted cortical activation on an interactive brain surface
                  with roughly 20,000 vertices.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-black mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">A side-by-side comparison view</p>
                <p className="text-xs text-gray-600">
                  Compare two uploads segment-by-segment to see where predicted neural
                  response differs.
                </p>
              </div>
            </li>
          </ul>
          <p className="text-xs text-gray-500 pt-2">
            See{" "}
            <Link href="/resources" className="underline">
              Resources
            </Link>{" "}
            for the full scoring methodology and a glossary of the brain networks.
          </p>
        </section>

        {/* Contribution / open dataset */}
        <section className="bg-white rounded-xl p-5 md:p-8 shadow-sm space-y-4">
          <h2 className="font-headline text-2xl font-bold text-black">The open dataset</h2>
          <p className="text-gray-700 leading-relaxed">
            Every analysis you run contributes a content-to-neural-response datapoint
            to a growing research dataset. In the spirit of open science, we intend to
            publish aggregated insights and anonymized neuro-ranking data with the
            broader AI and neuroscience community.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Before uploading, you agree to the{" "}
            <Link href="/research-agreement" className="underline">
              Contribution Agreement
            </Link>
            , which spells out exactly how your media and the resulting predictions are
            used. You retain ownership of your content; the license is limited to
            non-commercial research use only.
          </p>
        </section>

        {/* License clarity */}
        <section className="bg-gray-50 rounded-xl p-5 md:p-8 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-600 text-lg">info</span>
            <h3 className="font-headline font-bold text-black">Non-commercial use only</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            TRIBE v2 is licensed under Creative Commons BY-NC 4.0, which restricts the
            model to non-commercial use. BrainRank is operated as a non-commercial
            research beta in accordance with that license, with required attribution to
            Meta AI Research on every page of this site.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-black rounded-xl p-5 md:p-8 text-center">
          <h2 className="font-headline text-2xl font-bold text-white">
            Contribute your first upload
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Free during the research beta. No payment info collected.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 mt-6 bg-white text-black px-8 py-3 rounded-lg font-headline font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Contribute Now
          </Link>
        </section>
      </div>
    </PageTransition>
  );
}
