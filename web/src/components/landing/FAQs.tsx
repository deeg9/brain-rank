"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "What is BRAIN | RANK?",
    answer:
      "BRAIN | RANK is an open, non-commercial research beta. Upload a video, image, or script and we predict where viewers' brains light up — so you can see the neuroscience of storytelling in action. Every upload contributes to a growing open dataset.",
  },
  {
    question: "How does the prediction work?",
    answer:
      "We run your content through Meta's TRIBE v2 — a brain-predictive foundation model released in March 2026 and trained on over 1,000 hours of fMRI recordings from more than 700 volunteers. It maps predicted activation across nine neural networks in 2-second windows, giving you per-segment scores for attention, emotion, language, and more.",
  },
  {
    question: "What file types can I upload?",
    answer:
      "MP4, MOV, and WebM. The 100-second analysis window is the sweet spot — TRIBE v2 was trained on that length of stimuli and inference time scales linearly with duration. Short-form content (Reels, Shorts, TikToks, ads) lands in the best range.",
  },
  {
    question: "How long does analysis take?",
    answer:
      "Typically 3–6 minutes end-to-end for a 60-second clip, including cold-start on the GPU. Warm runs are faster. You'll get an email when your results are ready.",
  },
  {
    question: "Is my content private?",
    answer:
      "Private analyses stay with you. If you opt into the public leaderboard, your video and scores appear on a discoverable feed under your username — that's the only time your media is shared. Aggregated predictions may be included in the research dataset per the Contribution Agreement.",
  },
  {
    question: "What do the neural scores actually mean?",
    answer:
      "Each score reflects predicted activation strength in a brain region linked to a function — e.g. the Visual network for imagery salience, or the Language network for narrative comprehension. High Default Mode scores mean the opposite — the viewer's mind is drifting rather than engaging. Higher scores in the engagement-related networks mean the model predicts stronger response at that moment.",
  },
  {
    question: "Is this free?",
    answer:
      "Yes — BrainRank is a non-commercial research beta. TRIBE v2 is licensed under CC BY-NC 4.0, so we don't charge for analysis. No credit card required, no payment info collected.",
  },
];

export function FAQs() {
  return (
    <section className="scroll-py-10 py-10 md:scroll-py-32 md:py-32 px-6 md:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-headline mb-4 text-3xl md:text-4xl font-bold text-on-background">
          Frequently Asked Questions
        </h2>
        <p className="text-on-background/70 mb-12">
          Short answers about how BRAIN | RANK works, what to upload, and what you
          get back.
        </p>

        <Accordion type="single" collapsible className="mx-auto text-left">
          {FAQS.map(({ question, answer }) => (
            <AccordionItem key={question} value={question}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent className="text-on-background/70">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
