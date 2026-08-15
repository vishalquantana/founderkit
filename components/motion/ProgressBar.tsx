"use client";

import { motion } from "motion/react";

/**
 * Pure helper: percentage of `current` out of `total`, rounded and clamped
 * to the 0..100 range. Guards against total <= 0 by returning 0.
 */
export function progressPercent(current: number, total: number): number {
  if (!total || total <= 0) return 0;
  const pct = Math.round((current / total) * 100);
  return Math.min(100, Math.max(0, pct));
}

export interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const pct = progressPercent(current, total);

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#A9A9C9]">
        <span>
          Step {current} of {total}
        </span>
        <span className="tabular-nums text-[#7a7a99]">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--pulse-gradient)" }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
