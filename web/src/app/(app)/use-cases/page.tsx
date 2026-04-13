import Link from "next/link";

export const metadata = {
  title: "Use Cases | NeuroCut",
  description: "How marketers, creators, studios, and researchers use neural activation data to optimize content.",
};

export default function UseCasesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pt-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="font-headline text-4xl font-bold text-black tracking-tight">
          Use Cases
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          How neural activation data transforms content creation, marketing, and media research.
        </p>
      </div>

      {/* Why Neural Data Matters */}
      <section className="bg-white rounded-xl p-8 shadow-sm space-y-4">
        <h2 className="font-headline text-2xl font-bold text-black">Why Neural Data Matters</h2>
        <p className="text-gray-700 leading-relaxed">
          Traditional content analytics tell you <strong>what</strong> happened — views, clicks, watch time.
          Neural activation data tells you <strong>why</strong>. By predicting how the brain responds to every
          second of your content, NeuroCut reveals the biological drivers of engagement that no analytics
          dashboard can capture.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Every video uploaded to NeuroCut generates a neural response profile across 9 brain networks,
          creating a growing dataset that maps content types to brain activation patterns. This data is
          unprecedented — and it gets more valuable with every analysis.
        </p>
      </section>

      {/* Content Creators */}
      <section className="bg-white rounded-xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-gray-700">movie</span>
          <h2 className="font-headline text-2xl font-bold text-black">For Content Creators</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-bold text-black text-sm">Optimize Your Hook</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              See exactly how the first 10 seconds of your video perform neurally. Compare hook strength
              across videos to learn what openings capture attention. A hook scoring 0.55+ in the attention
              network means viewers are locked in from the start.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-bold text-black text-sm">Find Your Peak Moments</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Identify the exact seconds where brain activation spikes. Use these as thumbnail frames,
              clip highlights for shorts/reels, or to understand what content type drives the strongest
              neural response in your audience.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-bold text-black text-sm">A/B Test Before Publishing</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Upload two versions of the same video — different intros, different music, different pacing.
              Compare neural activation profiles side by side. Pick the version that drives stronger
              attention and reward network activation before you publish.
            </p>
          </div>
        </div>
      </section>

      {/* Marketers & Brands */}
      <section className="bg-white rounded-xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-gray-700">analytics</span>
          <h2 className="font-headline text-2xl font-bold text-black">For Marketers & Brands</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-bold text-black text-sm">Pre-Flight Ad Creative</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Test ad creatives for neural engagement before spending media budget. A 15-second ad
              that scores 0.60+ in reward activation is predicted to drive stronger brand recall and
              purchase intent than one scoring 0.30. Save budget by killing weak creative early.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-bold text-black text-sm">Benchmark by Category</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              NeuroCut's growing dataset enables category-level benchmarks. See how your fitness ad
              compares to the average attention score across all fitness content. Know whether your
              beauty tutorial drives above-average emotional processing for the category.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-bold text-black text-sm">Understand Emotional Response</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              The arousal/valence circumplex chart shows whether your content drives excitement, calm,
              tension, or boredom. Map emotional trajectories across your ad to ensure you're hitting
              the right emotional beats for your brand positioning.
            </p>
          </div>
        </div>
      </section>

      {/* Studios & Media */}
      <section className="bg-white rounded-xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-gray-700">videocam</span>
          <h2 className="font-headline text-2xl font-bold text-black">For Studios & Media Companies</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-bold text-black text-sm">Trailer Optimization</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Test trailer cuts for neural impact before release. Identify which scenes drive the highest
              emotional processing and social cognition activation — the networks that predict word-of-mouth
              and social sharing.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-bold text-black text-sm">Content Library Scoring</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Score your entire content library for neural engagement. Identify which episodes, clips,
              or segments have the highest activation profiles. Use this data to inform recommendation
              algorithms and content acquisition decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Data & Research */}
      <section className="bg-white rounded-xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-gray-700">biotech</span>
          <h2 className="font-headline text-2xl font-bold text-black">The Data Platform</h2>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Every analysis on NeuroCut contributes to a growing dataset of content-to-neural-response
          mappings. With content categories, this data enables unprecedented insights:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-bold text-black text-sm">Category Benchmarks</p>
            <p className="text-xs text-gray-600 mt-1">
              "Comedy content averages 0.58 attention vs. 0.42 for education — but education drives
              2x higher language/narrative activation."
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-bold text-black text-sm">Neural Signatures</p>
            <p className="text-xs text-gray-600 mt-1">
              "Horror content has the highest emotional processing activation (0.72 avg) of any category,
              while ASMR drives uniquely high auditory processing with low default mode."
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-bold text-black text-sm">Engagement Predictors</p>
            <p className="text-xs text-gray-600 mt-1">
              "Videos with attention scores above 0.50 in the first 5 seconds have 3x higher
              completion rates than those below 0.30."
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="font-bold text-black text-sm">Cross-Category Insights</p>
            <p className="text-xs text-gray-600 mt-1">
              "The reward network activation pattern in top cooking videos matches the pattern in
              top travel content — suggesting a shared 'discovery satisfaction' neural signature."
            </p>
          </div>
        </div>
        <p className="text-gray-500 text-xs mt-4 italic">
          These insights are illustrative examples of the types of analysis that become possible as
          the dataset grows. Actual benchmarks will be published as sufficient data is collected
          across categories.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-black rounded-xl p-8 text-center">
        <h2 className="font-headline text-2xl font-bold text-white">Ready to see how brains react to your content?</h2>
        <p className="text-gray-400 text-sm mt-2">Upload your first video and get a full neural activation report.</p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 mt-6 bg-white text-black px-8 py-3 rounded-lg font-headline font-bold text-sm hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Upload Now
        </Link>
      </section>
    </div>
  );
}
