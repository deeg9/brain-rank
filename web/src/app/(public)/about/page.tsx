import Link from "next/link";
import { PageTransition } from "@/components/ui/PageTransition";

export const metadata = {
  title: "About | BrainRank",
  description:
    "BrainRank is a non-commercial research beta predicting neural response to storytelling using Meta's TRIBE v2 (CC BY-NC 4.0).",
};

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-8 pt-6 pb-16 px-4 md:px-0">
        {/* Header */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-black/10 text-[10px] uppercase tracking-widest text-gray-500">
            <span className="material-symbols-outlined text-[12px]">science</span>
            Research Beta
          </span>
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-black tracking-tight mt-3">
            About BrainRank
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            A non-commercial research beta powered by Meta&apos;s TRIBE v2.
          </p>
        </div>

        {/* What */}
        <section className="bg-white rounded-xl p-5 md:p-8 shadow-sm space-y-4">
          <h2 className="font-headline text-xl font-bold text-black">What it is</h2>
          <p className="text-gray-700 leading-relaxed">
            BrainRank runs uploaded videos, images, and scripts through Meta&apos;s{" "}
            <a
              href="https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              TRIBE v2
            </a>{" "}
            — a brain-predictive foundation model released in March 2026 — and returns a
            predicted neural activation profile across nine functional brain networks.
            Predictions are computational estimates, not medical data, and represent
            what a representative pool of viewers&apos; brains would be expected to do
            if they watched your content under naturalistic conditions.
          </p>
        </section>

        {/* Why */}
        <section className="bg-white rounded-xl p-5 md:p-8 shadow-sm space-y-4">
          <h2 className="font-headline text-xl font-bold text-black">Why it exists</h2>
          <p className="text-gray-700 leading-relaxed">
            Meta released TRIBE v2 under the Creative Commons BY-NC 4.0 license —
            non-commercial use only — with the explicit goal of advancing in-silico
            neuroscience. We built BrainRank to put the model into the hands of the
            people whose work the neuroscience is about: storytellers. Every upload
            contributes a content-to-neural-response datapoint to a growing open
            research dataset that we intend to share with the broader AI and
            neuroscience community.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We do not charge for analysis, we do not sell user data, and the service is
            operated strictly within the terms of the TRIBE v2 license.
          </p>
        </section>

        {/* Attribution */}
        <section className="bg-white rounded-xl p-5 md:p-8 shadow-sm space-y-4">
          <h2 className="font-headline text-xl font-bold text-black">Attribution</h2>
          <p className="text-gray-700 leading-relaxed">
            The underlying brain-prediction model is{" "}
            <a
              href="https://github.com/facebookresearch/tribev2"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              TRIBE v2
            </a>
            , developed by Meta AI Research and released under{" "}
            <a
              href="https://creativecommons.org/licenses/by-nc/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              CC BY-NC 4.0
            </a>
            . BrainRank is not affiliated with or endorsed by Meta. All per-vertex
            predictions come from the released TRIBE v2 model; the 9-network
            aggregation, the Hook / Retention derived metrics, and the visualization
            layer are BrainRank&apos;s own contributions on top of it.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-gray-50 rounded-xl p-5 md:p-8 space-y-3">
          <h2 className="font-headline text-xl font-bold text-black">Contact</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Questions, feedback, research collaborations, takedown requests, or anything
            else — reach us at{" "}
            <a
              href="mailto:team@trybrainrank.com"
              className="underline font-semibold"
            >
              team@trybrainrank.com
            </a>
            .
          </p>
          <p className="text-xs text-gray-500 leading-relaxed pt-1">
            See our{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            ,{" "}
            <Link href="/terms" className="underline">
              Terms and Conditions
            </Link>
            , and{" "}
            <Link href="/research-agreement" className="underline">
              Contribution Agreement
            </Link>{" "}
            for full detail on how the research beta works.
          </p>
        </section>
      </div>
    </PageTransition>
  );
}
