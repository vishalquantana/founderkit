"use client";

import { motion } from "motion/react";
import { STAGE_META } from "@/lib/readiness";
import { stageColorClasses } from "@/lib/result-view";
import type { ReadinessStage } from "@/db/schema";

export interface StageBadgeProps {
  stage: ReadinessStage;
  className?: string;
}

/**
 * Large soft-colored pill announcing the founder's readiness stage — the
 * headline payoff of the results screen.
 */
export function StageBadge({ stage, className }: StageBadgeProps) {
  const meta = STAGE_META[stage];
  const colors = stageColorClasses(stage);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`flex flex-col items-center gap-3 text-center ${className ?? ""}`}
    >
      <span
        className={`inline-flex items-center rounded-full px-5 py-2 text-base font-semibold tracking-tight shadow-sm ${colors.badge} ${colors.glow}`}
      >
        {meta.label}
      </span>
      <p className="max-w-sm text-sm leading-relaxed text-slate-500">{meta.blurb}</p>
    </motion.div>
  );
}

export default StageBadge;
