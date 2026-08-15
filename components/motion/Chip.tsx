"use client";

import { motion } from "motion/react";
import type { ReactNode, MouseEventHandler } from "react";

export interface ChipProps {
  selected?: boolean;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
}

export function Chip({ selected = false, children, onClick, disabled, className }: ChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      data-selected={selected ? "true" : undefined}
      whileTap={{ scale: 0.96 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={[
        "pulse-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}

export default Chip;
