import { BenchmarkLegend } from "@/components/ui/BenchmarkLegend";
import { MetricInfo } from "@/components/results/MetricInfo";
import { PageTransition } from "@/components/ui/PageTransition";
import Link from "next/link";

export const metadata = {
  title: "Resources | NeuroCut",
  description: "Understanding neural activation scores, brain regions, and how to interpret your NeuroCut results.",
};

export default function ResourcesPage() {
  return (
    <PageTransition>
    <div className="max-w-4xl mx-auto space-y-12 pt-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="font-headline text-4xl font-bold text-black tracking-tight">
          Resources
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Understanding your neural activation scores, what they mean, and how to use them to improve your content.
        </p>
      </div>

      {/* How It Works */}
      <section className="bg-white rounded-xl p-8 shadow-sm space-y-6">
        <h2 className="font-headline text-2xl font-bold text-black">How NeuroCut Works</h2>
        <p className="text-gray-700 leading-relaxed">
          NeuroCut uses <strong>TRIBE v2</strong>, a brain-predictive foundation model developed by
          Meta AI Research. TRIBE v2 was trained on thousands of hours of fMRI brain scan data —
          recordings of real human brain activity while people watched videos.
        </p>
        <p className="text-gray-700 leading-relaxed">
          When you upload a video, TRIBE v2 processes the visual, audio, and text content through
          three specialized neural encoders:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">V-JEPA2</p>
            <p className="text-xs text-gray-500 mt-1">Processes visual features — motion, composition, faces, objects, scene changes</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">Wav2Vec-BERT</p>
            <p className="text-xs text-gray-500 mt-1">Processes audio features — music, speech, sound effects, silence, rhythm</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">LLaMA 3.2</p>
            <p className="text-xs text-gray-500 mt-1">Processes text/narrative — transcribed speech, storytelling, dialogue meaning</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          These encoders feed into a prediction head that outputs <strong>per-vertex cortical activation</strong> across
          20,484 points on the brain surface, every 2 seconds. NeuroCut then maps these activations to
          functional brain networks you can understand.
        </p>
      </section>

      {/* Understanding Scores */}
      <section className="bg-white rounded-xl p-8 shadow-sm space-y-6">
        <h2 className="font-headline text-2xl font-bold text-black">Understanding Your Scores</h2>
        <p className="text-gray-700 leading-relaxed">
          NeuroCut scores are <strong>not percentages</strong>. They represent normalized neural
          activation intensity on a scale from 0.00 to 1.00. This is a measure of how strongly
          the predicted brain response fires — not a grade.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="font-bold text-amber-800 text-sm">Important: 0.50 is a strong score, not "average"</p>
          <p className="text-xs text-amber-700 mt-1">
            Your brain is always active — baseline resting activity sits around 0.15-0.25.
            A score of 0.50 means the content is driving activation well above baseline.
            You do NOT want 1.00 — that level of neural activation would be closer to an
            epileptic seizure than engaged viewing.
          </p>
        </div>

        <BenchmarkLegend />

        <div className="space-y-4 mt-4">
          <h3 className="font-headline font-bold text-lg text-black">What each tier means for creators</h3>

          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-gray-400 mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">Baseline (0.00 — 0.25)</p>
                <p className="text-xs text-gray-500">
                  Brain is at resting state. Content isn't registering meaningful activation.
                  This is normal for low-energy moments like long static shots or silence.
                  If your entire video scores here, the content may not be engaging enough.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">Moderate (0.25 — 0.45)</p>
                <p className="text-xs text-gray-500">
                  Content is registering — the viewer is casually engaged. This is typical for
                  conversational content, simple tutorials, or calm footage. Most everyday content
                  sits in this range. Solid but not remarkable.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-600 mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">Strong (0.45 — 0.65)</p>
                <p className="text-xs text-gray-500">
                  High engagement — the viewer is locked in. This is what you should aim for.
                  Content in this range triggers genuine attention and emotional response.
                  Most viral content peaks in this tier. If your average score is here, your content
                  is performing well.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">Exceptional (0.65 — 0.85)</p>
                <p className="text-xs text-gray-500">
                  Peak neural response — these are rare, powerful moments. Jump scares, plot twists,
                  emotional climaxes, and breakthrough revelations score here. Individual segments
                  may hit this tier, but sustained exceptional activation across an entire video is uncommon.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">Intense (0.85+)</p>
                <p className="text-xs text-gray-500">
                  Extremely rare activation — maximum neural intensity. This indicates overwhelming
                  sensory or emotional stimulation. Sustained scores here are not realistic or desirable —
                  think of it as the brain's "red zone." Brief spikes here indicate the single most
                  impactful moment in your content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brain Regions */}
      <section className="bg-white rounded-xl p-8 shadow-sm space-y-6">
        <h2 className="font-headline text-2xl font-bold text-black">Brain Regions Explained</h2>
        <p className="text-gray-700 leading-relaxed">
          NeuroCut tracks 9 functional brain networks. Each represents a different aspect of how
          viewers process your content. Understanding which networks activate helps you optimize
          for specific types of engagement.
        </p>

        <div className="space-y-4">
          {[
            {
              name: "Attention",
              icon: "target",
              description: "Dorsal and ventral attention networks (frontal eye fields, intraparietal sulcus). Measures focused concentration — how well your content commands the viewer's attention.",
              tip: "Strong in: fast cuts, surprising visuals, direct address to camera. Weak in: repetitive footage, long static shots.",
            },
            {
              name: "Reward",
              icon: "star",
              description: "Ventral striatum and orbitofrontal cortex. Measures the brain's pleasure/satisfaction response — the dopamine-associated circuits that make viewers want more.",
              tip: "Strong in: humor, satisfying reveals, achievement moments, ASMR triggers. Key driver of likes, shares, and repeat views.",
            },
            {
              name: "Emotional Processing",
              icon: "favorite",
              description: "Amygdala and insula cortex. Measures the intensity of emotional response — both positive and negative emotions.",
              tip: "Strong in: emotional storytelling, dramatic moments, fear/surprise. High emotional peaks drive memorability and sharing.",
            },
            {
              name: "Social Cognition",
              icon: "psychology",
              description: "Temporoparietal junction and medial prefrontal cortex. Measures how much the viewer processes social and interpersonal cues.",
              tip: "Strong in: face-to-face content, dialogue, social dynamics, reaction videos. Drives connection and parasocial relationships.",
            },
            {
              name: "Visual Processing",
              icon: "visibility",
              description: "V1-V5 visual cortex areas. Measures how visually stimulating and complex the content is.",
              tip: "Strong in: high-motion footage, bright colors, visual effects, cinematography. Low in: static or text-heavy content.",
            },
            {
              name: "Auditory Processing",
              icon: "music_note",
              description: "Primary and secondary auditory cortex. Measures how the brain processes sounds, music, and speech.",
              tip: "Strong in: music drops, sound design, ASMR, vocal emphasis. Critical for audio-driven content like podcasts and music videos.",
            },
            {
              name: "Language / Narrative",
              icon: "menu_book",
              description: "Broca's and Wernicke's areas. Measures how the brain processes narrative structure, storytelling, and verbal content.",
              tip: "Strong in: storytelling, educational content, commentary, interviews. Key for content that relies on verbal communication.",
            },
            {
              name: "Default Mode",
              icon: "cloud",
              description: "Medial prefrontal cortex and posterior cingulate. Measures mind-wandering and self-reflection — when the viewer's mind drifts inward.",
              tip: "High default mode = viewer is disengaging. Unlike other regions, you want this LOW. High values mean the content isn't holding attention.",
            },
            {
              name: "Motion Processing",
              icon: "directions_run",
              description: "MT/V5 motion-sensitive visual areas. Measures how the brain tracks movement in your content.",
              tip: "Strong in: action sequences, sports, dance, transitions, camera movement. Low in: talking heads, static frames.",
            },
          ].map((region) => (
            <div key={region.name} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg text-gray-700">{region.icon}</span>
                <p className="font-bold text-black text-sm">{region.name}</p>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{region.description}</p>
              <p className="text-xs text-gray-500 mt-2 italic">Creator tip: {region.tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Metrics */}
      <section className="bg-white rounded-xl p-8 shadow-sm space-y-6">
        <h2 className="font-headline text-2xl font-bold text-black">Key Metrics</h2>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">Hook Strength</p>
            <p className="text-xs text-gray-600 mt-1">
              Average neural activation (attention + reward regions) during the first 10 seconds.
              Measures how effectively your opening captures the viewer. Above 0.40 is strong.
              Critical for social media where users decide to stay or scroll within seconds.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">Peak Moment</p>
            <p className="text-xs text-gray-600 mt-1">
              The exact 2-second segment with the highest overall activation across all brain regions.
              This is your video's most neurally engaging moment. Use it as a thumbnail frame,
              clip highlight, or to understand what drives the strongest brain response.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">Arousal</p>
            <p className="text-xs text-gray-600 mt-1">
              The viewer's physiological activation level — how alert or stimulated their nervous
              system is. High arousal (&gt;0.60) = exciting, intense content. Low arousal (&lt;0.30) =
              calming or boring content. Best content often oscillates between high and moderate arousal.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">Valence</p>
            <p className="text-xs text-gray-600 mt-1">
              The emotional positivity or negativity of the response. High valence (&gt;0.60) = positive
              emotions (joy, satisfaction). Low valence (&lt;0.30) = negative emotions (fear, sadness).
              Combined with arousal on the circumplex chart, it maps the full emotional experience.
            </p>
          </div>
        </div>
      </section>

      {/* About the Science */}
      <section className="bg-white rounded-xl p-8 shadow-sm space-y-6">
        <h2 className="font-headline text-2xl font-bold text-black">About the Science</h2>
        <p className="text-gray-700 leading-relaxed">
          TRIBE v2 (Temporally Resolved Inter-subject Brain Encoding) is a foundation model for
          predicting brain activity from multimedia content. It was developed by Meta AI Research
          and published in 2025.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="font-bold text-black text-sm">Key research references:</p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>TRIBE v2: Brain-Predictive Foundation Model — Meta AI Research (2025)</li>
            <li>Russell Circumplex Model of Affect — James A. Russell (1980)</li>
            <li>Destrieux Atlas — cortical parcellation scheme mapping 20,484 vertices to functional regions</li>
            <li>fMRI (functional Magnetic Resonance Imaging) — the neuroimaging technique used to train the model</li>
          </ul>
        </div>
        <p className="text-gray-700 leading-relaxed">
          NeuroCut maps TRIBE v2's raw cortical vertex output (20,484 activation values per 2-second segment)
          to 9 functional brain networks using the Destrieux atlas parcellation. This transforms neuroscience
          data into actionable creator insights.
        </p>
        <p className="text-gray-500 text-xs mt-4">
          Note: TRIBE v2 is licensed under CC BY-NC-4.0 (non-commercial use). NeuroCut's predictions are
          computational estimates of brain activity, not actual brain scans. Results should be interpreted
          as data-informed insights, not medical or scientific measurements.
        </p>
      </section>
    </div>
    </PageTransition>
  );
}
