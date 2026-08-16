"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

export type StepDirection = "forward" | "back";

/** Horizontal enter offset (px) for a step slide. Forward enters from the right. */
export function stepSlideOffset(direction: StepDirection): number {
  return direction === "back" ? -24 : 24;
}

export interface StepTransitionProps {
  stepKey: string | number;
  children: ReactNode;
  className?: string;
  /** Slide direction; "forward" (default) slides in from the right. */
  direction?: StepDirection;
}

export function StepTransition({
  stepKey,
  children,
  className,
  direction = "forward",
}: StepTransitionProps) {
  const dx = stepSlideOffset(direction);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: dx }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -dx }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default StepTransition;
