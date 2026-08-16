"use client";

import { motion } from "motion/react";
import { STAGE_META } from "@/lib/readiness";
import type { ReadinessStage } from "@/db/schema";

export interface StageDistributionProps {
  distribution: Record<ReadinessStage, number>;
  className?: string;
}

const STAGE_ORDER: ReadinessStage[] = [
  "idea_clarity",
  "discovery_ready",
  "mvp_candidate",
  "pilot_ready",
  "revenue_ready",
];

const STAGE_COLOR_VAR: Record<ReadinessStage, string> = {
  idea_clarity: "var(--stage-idea)",
  discovery_ready: "var(--stage-discovery)",
  mvp_candidate: "var(--stage-mvp)",
  pilot_ready: "var(--stage-pilot)",
  revenue_ready: "var(--stage-revenue)",
};

/**
 * Animated horizontal bars showing how many participants landed in each
 * readiness stage, in soft stage colors. Grows from zero on mount/update.
 */
export function StageDistribution({ distribution, className }: StageDistributionProps) {
  const total = STAGE_ORDER.reduce((sum, stage) => sum + (distribution[stage] ?? 0), 0);

  return (
    <div className={className}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Readiness stage distribution
      </h2>
      <div className="flex flex-col gap-3">
        {STAGE_ORDER.map((stage) => {
          const meta = STAGE_META[stage];
          const color = STAGE_COLOR_VAR[stage];
          const count = distribution[stage] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div key={stage} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{meta.label}</span>
                <span className="tabular-nums text-muted">{count}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-strong">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 12px -2px ${color}` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 140, damping: 22 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StageDistribution;
