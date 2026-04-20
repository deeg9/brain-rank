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
      "BRAIN | RANK is neural A/B testing for content creators. Upload a video, image, or script and we predict where viewers' brains light up — so you can spot hooks, weak segments, and audience engagement before you publish.",
  },
  {
    question: "How does the prediction work?",
    answer:
      "We run your content through Meta's TRIBE v2 — a brain-predictive foundation model trained on fMRI recordings. It maps activation across nine neural networks second-by-second, giving you per-segment scores for attention, emotion, language, and more.",
  },
  {
    question: "What file types can I upload?",
    answer:
      "MP4, MOV, and WebM up to 100 seconds. Short-form content (Reels, Shorts, TikToks, ads) is the sweet spot — the model was trained on that length of stimuli and inference scales linearly with duration.",
  },
  {
    question: "How long does analysis take?",
    answer:
      "Typically 3–6 minutes end-to-end for a 60-second clip, including cold-start on the GPU. Warm runs are faster. You'll get an email when your results are ready.",
  },
  {
    question: "Is my content private?",
    answer:
      "Private analyses stay with you. If you opt into the public leaderboard, your video and scores appear on a discoverable feed under your username — that's the only time your data is shared.",
  },
  {
    question: "What do the neural scores actually mean?",
    answer:
      "Each score reflects predicted activation strength in a brain region linked to a function — e.g. the Visual network for imagery salience, the Default Mode network for narrative engagement. Higher scores mean the model predicts stronger response in that network at that moment.",
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
