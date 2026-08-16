"use client";

import { motion, useReducedMotion } from "motion/react";
import { STAGE_META } from "@/lib/readiness";
import { STAGE_ORDER } from "@/lib/present";
import type { PresentData } from "@/components/present/types";

const STAGE_COLORS: Record<string, string> = {
  idea_clarity: "var(--stage-idea)",
  discovery_ready: "var(--stage-discovery)",
  mvp_candidate: "var(--stage-mvp)",
  pilot_ready: "var(--stage-pilot)",
  revenue_ready: "var(--stage-revenue)",
};

export interface ProgressionViewProps {
  data: PresentData;
}

export function ProgressionView({ data }: ProgressionViewProps) {
  const shouldReduceMotion = useReducedMotion();

  const byStage = new Map<string, { alias: string; stage: string }[]>();
  for (const stage of STAGE_ORDER) byStage.set(stage, []);
  for (const p of data.progression) {
    byStage.get(p.stage)?.push(p);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <p className="pulse-kicker text-lg tracking-[0.3em]">The readiness ladder</p>
        <p className="mt-2 text-lg font-medium text-[var(--pulse-text-muted)]">
          Every founder here is further along than when they walked in — celebrate the journey.
        </p>
      </div>

      {/* connecting rail behind the milestone columns, reinforcing the ladder metaphor */}
      <div className="relative w-full max-w-6xl">
        <div
          className="pointer-events-none absolute left-0 right-0 top-[3.25rem] hidden h-1 rounded-full sm:block"
          style={{
            background:
              "linear-gradient(90deg, var(--stage-idea), var(--stage-discovery), var(--stage-mvp), var(--stage-pilot), var(--stage-revenue))",
            opacity: 0.5,
          }}
        />

        <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {STAGE_ORDER.map((stage, colIndex) => {
            const meta = STAGE_META[stage];
            const entries = byStage.get(stage) ?? [];
            const stageColor = STAGE_COLORS[stage];
            const count = entries.length;

            return (
              <motion.div
                key={stage}
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion ? { duration: 0 } : { delay: colIndex * 0.06, duration: 0.35 }
                }
                className="flex min-h-[18rem] flex-col gap-3 rounded-2xl border p-4"
                style={{ borderColor: `${stageColor}4d`, backgroundColor: `${stageColor}1a` }}
              >
                <div className="flex flex-col items-center gap-1 text-center">
                  <span
                    className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-black tabular-nums"
                    style={{ backgroundColor: stageColor, color: "var(--pulse-bg)" }}
                  >
                    {count}
                  </span>
                  <p
                    className="font-display mt-1 text-base font-bold uppercase leading-tight tracking-wide sm:text-lg"
                    style={{ color: stageColor }}
                  >
                    {meta.label}
                  </p>
                  <p className="text-xs text-[var(--pulse-text-muted)]">
                    {count} founder{count === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {entries.map((entry, i) => (
                    <motion.span
                      key={`${stage}-${entry.alias}-${i}`}
                      initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.85, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : {
                              delay: colIndex * 0.05 + i * 0.04,
                              type: "spring",
                              stiffness: 260,
                              damping: 22,
                            }
                      }
                      className="rounded-full px-3 py-1.5 text-center text-base font-semibold sm:text-lg"
                      style={{ backgroundColor: `${stageColor}4d`, color: "var(--pulse-text)" }}
                    >
                      {entry.alias}
                    </motion.span>
                  ))}
                  {entries.length === 0 && (
                    <p className="mt-4 text-center text-xs text-[var(--pulse-text-muted)]">
                      No founders here yet
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProgressionView;
