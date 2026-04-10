"use client";

import { motion } from "framer-motion";
import useMeasure from "react-use-measure";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

export function AnimationDemo() {
  const [ref, bounds] = useMeasure();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <Card className={cn("p-6")}>
        <div ref={ref} className={cn("flex flex-col gap-2")}>
          <p className="text-on-surface text-sm font-medium">
            Animation Foundation Verified
          </p>
          <p className="text-on-surface-variant text-xs">
            Measured: {Math.round(bounds.width)}px x {Math.round(bounds.height)}
            px
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
