"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

export interface StepTransitionProps {
  stepKey: string | number;
  children: ReactNode;
  className?: string;
}

export function StepTransition({ stepKey, children, className }: StepTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default StepTransition;
