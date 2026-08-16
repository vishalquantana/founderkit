"use client";

import { motion, useReducedMotion } from "motion/react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { DIMENSIONS, DIMENSION_MAX, type Dimension } from "@/lib/readiness";
import type { EvaluationResult } from "@/ai/schema";

const DIMENSION_LABELS: Record<Dimension, string> = {
  problemClarity: "Problem clarity",
  customerClarity: "Customer clarity",
  valuePayment: "Value & payment",
  mvpQuality: "MVP quality",
  distribution: "Distribution",
  validation: "Validation",
  teamStageFit: "Team & stage fit",
  cashflow: "Cashflow",
};

export interface DimensionBarsProps {
  scores: EvaluationResult["dimensionScores"];
  /** Overall backend score out of 100. Defaults to the sum of `scores`. */
  total?: number;
  className?: string;
}

/**
 * Eight animated bars, one per readiness dimension, plus an overall
 * AnimatedNumber total out of 100.
 */
export function DimensionBars({ scores, total, className }: DimensionBarsProps) {
  const shouldReduceMotion = useReducedMotion();
  const overall =
    total ?? DIMENSIONS.reduce((sum, dim) => sum + (scores[dim] ?? 0), 0);

  return (
    <div className={className}>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="pulse-kicker">Readiness score</h2>
        <p className="font-display text-2xl font-bold" style={{ color: "var(--pulse-text)" }}>
          <AnimatedNumber value={overall} />
          <span
            className="ml-1 text-sm font-medium"
            style={{ color: "var(--pulse-text-muted)" }}
          >
            / 100
          </span>
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {DIMENSIONS.map((dim) => {
          const max = DIMENSION_MAX[dim];
          const score = scores[dim] ?? 0;
          const ratio = max > 0 ? Math.min(1, Math.max(0, score / max)) : 0;

          return (
            <li key={dim} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium" style={{ color: "var(--pulse-text)" }}>
                  {DIMENSION_LABELS[dim]}
                </span>
                <span
                  className="tabular-nums"
                  style={{ color: "var(--pulse-text-muted)" }}
                >
                  {score}/{max}
                </span>
              </div>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full"
                style={{ background: "var(--pulse-track)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--pulse-gradient)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${ratio * 100}%` }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0.2 }
                      : { type: "spring", stiffness: 120, damping: 18 }
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default DimensionBars;
