"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export interface StageRevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Gentle spring scale/fade entrance for the stage headline — the
 * delightful payoff moment of the results screen.
 */
export function StageReveal({ children, className }: StageRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

export default StageReveal;
