"use client";

import { useRef, useState, useEffect } from "react";
import {
  useMotionValue,
  useSpring,
  useTransform,
  useMotionValueEvent,
  useInView,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface SlidingNumberProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  springConfig?: { stiffness?: number; damping?: number; mass?: number };
  triggerOnView?: boolean;
}

const DEFAULT_SPRING = { stiffness: 75, damping: 15, mass: 0.5 };

export function SlidingNumber({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
  springConfig,
  triggerOnView = true,
}: SlidingNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  const config = { ...DEFAULT_SPRING, ...springConfig };

  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, config);

  const displayVal = useTransform(springVal, (latest: number) => {
    const rounded =
      decimals > 0
        ? latest.toFixed(decimals)
        : String(Math.round(latest));
    return `${prefix}${rounded}${suffix}`;
  });

  useMotionValueEvent(displayVal, "change", (latest: string) => {
    setDisplay(latest);
  });

  useEffect(() => {
    // Skip animation if value is 0 (already at target)
    if (value === 0) {
      setDisplay(`${prefix}${decimals > 0 ? (0).toFixed(decimals) : "0"}${suffix}`);
      return;
    }

    if (triggerOnView && !isInView) return;

    motionVal.set(value);
  }, [value, isInView, triggerOnView, motionVal, prefix, suffix, decimals]);

  return (
    <span ref={ref} className={cn(className)}>
      {display}
    </span>
  );
}
