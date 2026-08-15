"use client";

import { motion } from "motion/react";
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
  const byStage = new Map<string, { alias: string; stage: string }[]>();
  for (const stage of STAGE_ORDER) byStage.set(stage, []);
  for (const p of data.progression) {
    byStage.get(p.stage)?.push(p);
  }

  return (
    <div>
      <p className="mb-6 text-center text-lg font-medium text-[var(--pulse-text-muted)]">
        Every founder here is further along than when they walked in — celebrate the journey.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STAGE_ORDER.map((stage, colIndex) => {
          const meta = STAGE_META[stage];
          const entries = byStage.get(stage) ?? [];
          const stageColor = STAGE_COLORS[stage];
          return (
            <div
              key={stage}
              className="flex min-h-[16rem] flex-col gap-3 rounded-2xl border p-4"
              style={{ borderColor: `${stageColor}4d`, backgroundColor: `${stageColor}1a` }}
            >
              <div className="text-center">
                <p className="font-display text-sm font-bold uppercase tracking-wide text-[var(--pulse-text)]">
                  {meta.label}
                </p>
                <p className="text-xs text-[var(--pulse-text-muted)]">
                  {entries.length} founder{entries.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {entries.map((entry, i) => (
                  <motion.span
                    key={`${entry.alias}-${i}`}
                    initial={{ opacity: 0, scale: 0.85, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: colIndex * 0.05 + i * 0.04,
                      type: "spring",
                      stiffness: 260,
                      damping: 22,
                    }}
                    className="rounded-full px-3 py-1.5 text-center text-sm font-semibold"
                    style={{ backgroundColor: `${stageColor}4d`, color: "var(--pulse-text)" }}
                  >
                    {entry.alias}
                  </motion.span>
                ))}
                {entries.length === 0 && (
                  <p className="mt-4 text-center text-xs text-[var(--pulse-text-muted)]">No founders here yet</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProgressionView;
