"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrainHero } from "./BrainHero";
import { CanvasRevealEffect } from "./CanvasRevealEffect";
import { Button } from "@/components/ui";
import { MatrixText } from "@/components/ui/MatrixText";
import { LinkPreview } from "@/components/ui/LinkPreview";
import { createClient } from "@/lib/supabase/client";

const FEATURE_PILLS = [
  "Brain Mapping",
  "Neural Scoring",
  "Retention Analysis",
  "Hook Detection",
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

export function HeroOdyssey() {
  const [ctaHref, setCtaHref] = useState("/signup");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCtaHref("/upload");
      }
    });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Sparkly dot field — behind brain */}
      <div className="absolute inset-0 z-0">
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-transparent"
          colors={[
            [255, 255, 255],
            [255, 255, 255],
          ]}
          dotSize={6}
        />
      </div>

      {/* 3D brain background */}
      <BrainHero />

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 z-[5] bg-gradient-to-b from-transparent via-black/20 to-black/60" />

      {/* Bottom fade — blends dots/brain into the page grid background */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-48 bg-gradient-to-b from-transparent to-background" />

      {/* Content overlay */}
      <div className="relative z-10 flex min-h-screen flex-col px-6 md:px-8">
        {/* Top bar */}
        <header className="flex items-center justify-between py-8">
          <div className="flex items-center gap-3">
            <span className="font-headline font-black text-xl tracking-widest uppercase text-on-background">BRAIN<span className="text-on-background/40 mx-0.5">|</span>RANK</span>
          </div>
          <Link
            href="/login"
            className="font-label text-sm text-white transition-colors duration-200 hover:text-white/70"
          >
            Login
          </Link>
        </header>

        {/* Center content */}
        <div className="flex flex-grow flex-col items-center justify-center gap-8">
          <MatrixText
            text="See What Brains See"
            className="font-headline text-4xl font-bold tracking-tight text-on-background md:text-5xl lg:text-7xl"
            initialDelay={300}
            letterAnimationDuration={400}
            letterInterval={80}
          />

          <motion.p
            className="max-w-2xl text-center text-base text-white font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] md:text-lg lg:text-xl"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            Neural A/B testing for marketers and content creators. Upload a
            video, picture, or text to see a prediction of where
            viewers&apos; brains light up.
            <br />
            <LinkPreview
              url="https://ai.meta.com/blog/tribe-v2-brain-predictive-foundation-model/"
              className="text-white/60 text-sm md:text-base underline underline-offset-2 hover:text-white transition-colors"
            >
              Powered by Meta&apos;s TRIBE v2 model.
            </LinkPreview>
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          >
            <Link href={ctaHref}>
              <Button
                variant="landing"
                size="lg"
                className="text-lg"
              >
                <span className="material-symbols-outlined">upload</span>
                Analyze Your Video
              </Button>
            </Link>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 md:gap-3"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
          >
            {FEATURE_PILLS.map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-white/20 bg-black/40 px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-white font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] backdrop-blur-sm"
              >
                {pill}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between py-8 opacity-30">
          <div className="text-[10px] font-mono uppercase tracking-widest">
            v1.0.4-beta / secure_neural_layer
          </div>
          <div className="flex gap-6">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="material-symbols-outlined text-sm">
              verified_user
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
