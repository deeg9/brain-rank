"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrainHero } from "./BrainHero";
import { Button } from "@/components/ui";
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* 3D brain background */}
      <BrainHero />

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 z-[5] bg-gradient-to-b from-transparent via-black/20 to-black/60" />

      {/* Content overlay */}
      <div className="relative z-10 flex min-h-screen flex-col px-6 md:px-8">
        {/* Top bar */}
        <header className="flex items-center justify-between py-8">
          <div className="flex items-center gap-3">
            <span className="font-headline font-black text-xl tracking-widest uppercase text-on-background">BRAIN<span className="text-on-background/40 mx-0.5">|</span>RANK</span>
          </div>
          <Link
            href="/login"
            className="font-label text-sm text-on-surface-variant transition-colors duration-200 hover:text-on-surface"
          >
            Login
          </Link>
        </header>

        {/* Center content */}
        <div className="flex flex-grow flex-col items-center justify-center gap-8">
          <motion.h1
            className="font-headline text-4xl font-bold tracking-tight text-on-background md:text-5xl lg:text-7xl"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            See What Brains See
          </motion.h1>

          <motion.p
            className="max-w-2xl text-center text-base text-on-surface-variant md:text-lg lg:text-xl"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            Neural A/B testing for content creators. Upload a video and see
            exactly where viewers&apos; brains light up &mdash; and where they
            tune out.
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
            className="flex flex-wrap justify-center gap-3"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
          >
            {FEATURE_PILLS.map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-outline-variant/10 bg-surface-container/60 px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-on-surface-variant backdrop-blur-sm"
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
