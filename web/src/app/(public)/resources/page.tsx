import { BenchmarkLegend } from "@/components/ui/BenchmarkLegend";
import { MetricInfo } from "@/components/results/MetricInfo";
import { PageTransition } from "@/components/ui/PageTransition";
import Link from "next/link";

export const metadata = {
  title: "Resources | BrainRank",
  description: "Understanding neural activation scores, brain regions, and how to interpret your BrainRank results.",
};

export default function ResourcesPage() {
  return (
    <PageTransition>
    <div className="max-w-4xl mx-auto space-y-10 md:space-y-12 pt-10 md:pt-16 pb-16 px-4 md:px-0">
      {/* Header */}
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-black tracking-tight">
          Resources
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Understanding your neural activation scores, what they mean, and how to use them to improve your content.
        </p>
      </div>

      {/* How It Works */}
      <section className="bg-white rounded-xl p-5 md:p-8 shadow-sm space-y-6">
        <h2 className="font-headline text-2xl font-bold text-black">How BrainRank Works</h2>
        <p className="text-gray-700 leading-relaxed">
          BrainRank uses <strong>TRIBE v2</strong>, a brain-predictive foundation model developed by
          Meta AI Research. TRIBE v2 was trained on thousands of hours of fMRI brain scan data —
          recordings of real human brain activity while people watched videos.
        </p>
        <p className="text-gray-700 leading-relaxed">
          BrainRank accepts three kinds of input — <strong>video</strong>, <strong>image</strong>, and <strong>text</strong> —
          and routes each through three specialized neural encoders to predict per-segment cortical activation:
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
            <p className="text-xs text-gray-500 mt-1">Processes text and narrative — transcribed speech, storytelling, dialogue meaning</p>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-gray-700 leading-relaxed">
            Which encoders light up depends on the modality you upload:
          </p>
          <div className="space-y-2">
            <div className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-black mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">Video</p>
                <p className="text-xs text-gray-600">All three encoders engage — visual frames through V-JEPA2, the audio track through Wav2Vec-BERT, and transcribed speech through LLaMA 3.2.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-black mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">Image</p>
                <p className="text-xs text-gray-600">Held as a static frame for the duration you set and routed through V-JEPA2, with silence fed to the audio encoder. Use this for thumbnails and stills.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-black mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">Text — Spoken</p>
                <p className="text-xs text-gray-600">Your script is synthesized into speech and run through Wav2Vec-BERT + LLaMA 3.2; a neutral visual is used for V-JEPA2. Use this for voiceovers and scripts you intend to narrate.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="w-2 h-2 rounded-full bg-black mt-2 shrink-0" />
              <div>
                <p className="font-bold text-black text-sm">Text — Visual</p>
                <p className="text-xs text-gray-600">The text is rendered as on-screen typography for V-JEPA2 and processed as written language by LLaMA 3.2. Use this for captions, titles, and on-screen copy.</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          These encoders feed into a prediction head that outputs <strong>per-vertex cortical activation</strong> across
          20,484 points on the brain surface, every 2 seconds. BrainRank then maps these activations to
          functional brain networks you can understand.
        </p>
      </section>

      {/* Understanding Scores */}
      <section className="bg-white rounded-xl p-5 md:p-8 shadow-sm space-y-6">
        <h2 className="font-headline text-2xl font-bold text-black">Understanding Your Scores</h2>
        <p className="text-gray-700 leading-relaxed">
          BrainRank scores are <strong>not percentages</strong>. They represent normalized neural
          activation intensity on a scale from 0.00 to 1.00. This is a measure of how strongly
          the predicted brain response fires — not a grade.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="font-bold text-amber-800 text-sm">Important: 0.50 is a strong score, not &quot;average&quot;</p>
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
                  Brain is at resting state. Content isn&apos;t registering meaningful activation.
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
                  think of it as the brain&apos;s &quot;red zone.&quot; Brief spikes here indicate the single most
                  impactful moment in your content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brain Regions */}
      <section className="bg-white rounded-xl p-5 md:p-8 shadow-sm space-y-6">
        <h2 className="font-headline text-2xl font-bold text-black">Brain Regions Explained</h2>
        <p className="text-gray-700 leading-relaxed">
          BrainRank tracks 9 functional brain networks. Each represents a different aspect of how
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
      <section className="bg-white rounded-xl p-5 md:p-8 shadow-sm space-y-6">
        <h2 className="font-headline text-2xl font-bold text-black">Key Metrics</h2>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">Engagement Score</p>
            <p className="text-xs text-gray-600 mt-1">
              Your top-line number. A weighted blend of peak moment (40%), hook strength (30%),
              and retention (30%). It balances &quot;how strong is your best moment&quot; against &quot;how
              consistently engaging is the whole piece.&quot; A single value you can compare across
              your own uploads and against the leaderboard.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">Hook Strength</p>
            <p className="text-xs text-gray-600 mt-1">
              Average overall neural activation during the first 10 seconds of your content
              (the first five 2-second segments, averaged across all brain regions). Measures
              how quickly your opening captures attention. Above 0.40 is strong. Critical for
              short-form and social feeds where viewers decide to stay or scroll within seconds.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">Retention</p>
            <p className="text-xs text-gray-600 mt-1">
              The weakest 10-second window across your content. BrainRank slides a 5-segment
              window over the full timeline and takes the minimum — so a low retention score
              means there&apos;s a stretch where the brain response drops off. Use this to find the
              single worst section of your edit and decide whether to tighten, cut, or replace it.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">Peak Moment</p>
            <p className="text-xs text-gray-600 mt-1">
              The exact 2-second segment with the highest overall activation across all brain regions.
              This is your content&apos;s most neurally engaging moment. Use it as a thumbnail frame,
              clip highlight, or to understand what drives the strongest brain response.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">Arousal</p>
            <p className="text-xs text-gray-600 mt-1">
              The viewer&apos;s physiological activation level — how alert or stimulated their nervous
              system is. Computed from attention and emotional-processing networks. High arousal
              (&gt;0.60) = exciting, intense content. Low arousal (&lt;0.30) = calming or boring content.
              Best content often oscillates between high and moderate arousal rather than pinning
              at either extreme.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-black text-sm">Valence</p>
            <p className="text-xs text-gray-600 mt-1">
              Combines the reward and social-cognition networks. High valence (&gt;0.60) = content
              triggers satisfaction and social-emotional approach (joy, connection, warmth). Low
              valence (&lt;0.30) = disengagement, avoidance, or negative affect. Plotted with arousal
              on the circumplex chart, it maps the full emotional experience of your viewer.
            </p>
          </div>
        </div>
      </section>

      {/* About the Science */}
      <section className="bg-white rounded-xl p-5 md:p-8 shadow-sm space-y-6">
        <h2 className="font-headline text-2xl font-bold text-black">About the Science</h2>
        <p className="text-gray-700 leading-relaxed">
          TRIBE v2 (Temporally Resolved Inter-subject Brain Encoding) is a foundation model for
          predicting brain activity from multimedia content. It was developed by Meta AI Research
          and published in 2025. The model was trained on multi-hour fMRI recordings of people
          watching naturalistic video, which is why it generalizes across genres and formats rather
          than being locked to a single content type.
        </p>

        <div className="space-y-2">
          <h3 className="font-headline font-bold text-base text-black">Temporal resolution</h3>
          <p className="text-gray-700 leading-relaxed">
            TRIBE v2 predicts brain state in 2-second windows. That&apos;s the same temporal resolution
            the model was trained on (the repetition time, or TR, of the underlying fMRI scans),
            and it&apos;s why every segment-level metric you see in BrainRank lands on an even-second
            boundary. Shorter-than-2s events — a single frame, a one-word utterance — contribute
            to the segment they fall in but can&apos;t be isolated below that window.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-headline font-bold text-base text-black">Cortical parcellation</h3>
          <p className="text-gray-700 leading-relaxed">
            BrainRank takes TRIBE v2&apos;s 20,484 per-vertex activation values and collapses them into
            9 functional networks using the Destrieux atlas, which divides the cortical surface
            into roughly 150 anatomically defined regions. Each network in BrainRank is a weighted
            aggregation of the regions most associated with that function in the neuroscience
            literature — for example, the Attention network combines dorsal and ventral attention
            regions (intraparietal sulcus, frontal eye fields, superior parietal lobule) rather
            than trusting a single anatomical area in isolation.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-headline font-bold text-base text-black">Normalization</h3>
          <p className="text-gray-700 leading-relaxed">
            Raw activation values don&apos;t come with a fixed scale, so every score you see on
            BrainRank is normalized using robust percentile scaling (clipped at the 1st and 99th
            percentiles of the model&apos;s training distribution, then rescaled to 0–1). A 0.50
            means the response lands firmly above the population baseline — not that it&apos;s
            &quot;half of maximum.&quot; This is also why tier boundaries (baseline, moderate, strong,
            exceptional, intense) are what they are.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-headline font-bold text-base text-black">How multi-modal content is handled</h3>
          <p className="text-gray-700 leading-relaxed">
            TRIBE v2 is built to receive vision, audio, and text features simultaneously. When you
            upload an image, BrainRank holds it as a static frame for the duration you set and
            pipes silence into the audio encoder, so the prediction isolates the visual contribution.
            When you upload a text script in spoken mode, the script is synthesized into speech so
            the audio and language encoders both activate on the same narrative — the way a viewer
            would actually hear it. Visual-text mode renders the text on-screen so the visual
            encoder sees the typography exactly as your audience would. The more modalities you
            supply, the closer the prediction is to the full viewing experience.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-headline font-bold text-base text-black">What BrainRank is — and isn&apos;t</h3>
          <p className="text-gray-700 leading-relaxed">
            These predictions are not scans of any individual viewer&apos;s brain, and they are not
            measurements of your own brain either. TRIBE v2 infers the group-average cortical
            response that <em>would</em> occur if a representative pool of viewers watched your
            content under naturalistic conditions. Treat the numbers as a directional signal for
            how content tends to land — strong hook, weak middle, peak at 00:42 — not as a
            diagnostic about a specific person.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="font-bold text-black text-sm">Key research references:</p>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
            <li>
              <strong>TRIBE v2: Brain-Predictive Foundation Model</strong> — Meta AI Research (2025).
              The foundation model that powers every BrainRank prediction.
            </li>
            <li>
              <strong>Russell Circumplex Model of Affect</strong> — James A. Russell (1980).
              The two-axis emotion model (arousal × valence) we plot on the emotional-state chart.
            </li>
            <li>
              <strong>Destrieux Atlas</strong> — cortical parcellation scheme mapping the 20,484
              surface vertices to ~150 functional regions. Used to aggregate vertex-level outputs
              into our 9 brain networks.
            </li>
            <li>
              <strong>fMRI (functional Magnetic Resonance Imaging)</strong> — the neuroimaging
              modality used to collect TRIBE v2&apos;s training data. Measures blood-oxygenation
              changes as a proxy for neural activity.
            </li>
            <li>
              <strong>Naturalistic neuroimaging datasets</strong> — multi-hour recordings of
              real people watching unedited video, the ground truth TRIBE v2 was fit to.
            </li>
          </ul>
        </div>

        <p className="text-gray-500 text-xs mt-4">
          Note: TRIBE v2 is licensed under CC BY-NC-4.0 (non-commercial use). BrainRank&apos;s predictions are
          computational estimates of brain activity, not actual brain scans. Results should be interpreted
          as data-informed insights, not medical or scientific measurements.
        </p>
      </section>
    </div>
    </PageTransition>
  );
}
