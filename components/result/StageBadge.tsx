"use client";

import { motion } from "motion/react";
import { STAGE_META } from "@/lib/readiness";
import type { ReadinessStage } from "@/db/schema";

export interface StageBadgeProps {
  stage: ReadinessStage;
  className?: string;
}

/**
 * Pulse dark-theme glow color per readiness stage. Keeps the same
 * ReadinessStage keys as `lib/result-view.ts` (used elsewhere for the
 * light-themed Lean Canvas badge), just re-expressed for a dark glass pill.
 */
const STAGE_GLOW_VAR: Record<ReadinessStage, string> = {
  idea_clarity: "var(--stage-idea)",
  discovery_ready: "var(--stage-discovery)",
  mvp_candidate: "var(--stage-mvp)",
  pilot_ready: "var(--stage-pilot)",
  revenue_ready: "var(--stage-revenue)",
};

/**
 * Large soft-colored pill announcing the founder's readiness stage — the
 * headline payoff of the results screen.
 */
export function StageBadge({ stage, className }: StageBadgeProps) {
  const meta = STAGE_META[stage];
  const glow = STAGE_GLOW_VAR[stage];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`flex flex-col items-center gap-3 text-center ${className ?? ""}`}
    >
      <span
        className="font-display inline-flex items-center rounded-full border px-6 py-2.5 text-base font-semibold tracking-wide"
        style={{
          background: `color-mix(in srgb, ${glow} 16%, transparent)`,
          borderColor: `color-mix(in srgb, ${glow} 45%, transparent)`,
          color: glow,
          boxShadow: `0 0 28px 2px color-mix(in srgb, ${glow} 40%, transparent)`,
        }}
      >
        {meta.label}
      </span>
      <p
        className="max-w-sm text-sm leading-relaxed"
        style={{ color: "var(--pulse-text-muted)" }}
      >
        {meta.blurb}
      </p>
    </motion.div>
  );
}

export default StageBadge;
