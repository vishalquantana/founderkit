"use client";

import { motion, useMotionValue, animate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Pure helper: rounds `n` to the nearest integer and clamps it to the
 * 0..target range.
 */
export function clampCount(n: number, target: number): number {
  return Math.max(0, Math.min(target, Math.round(n)));
}

export interface AnimatedNumberProps {
  value: number;
  durationMs?: number;
  className?: string;
}

export function AnimatedNumber({ value, durationMs = 900, className }: AnimatedNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(shouldReduceMotion ? clampCount(value, value) : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(clampCount(value, value));
      return;
    }

    count.set(0);
    const controls = animate(count, value, {
      duration: durationMs / 1000,
      ease: "easeOut",
    });

    const unsubscribe = count.on("change", (latest) => {
      setDisplay(clampCount(latest, value));
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs, shouldReduceMotion]);

  return (
    <motion.span className={className} aria-live="polite">
      {display}
    </motion.span>
  );
}

export default AnimatedNumber;
