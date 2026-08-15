"use client";

import { motion } from "motion/react";
import { STAGE_META } from "@/lib/readiness";
import { STAGE_ORDER } from "@/lib/present";
import type { PresentData } from "@/components/present/types";

const COLUMN_STYLES: Record<string, string> = {
  idea_clarity: "border-slate-400/30 bg-slate-400/10",
  discovery_ready: "border-blue-400/30 bg-blue-400/10",
  mvp_candidate: "border-violet-400/30 bg-violet-400/10",
  pilot_ready: "border-emerald-400/30 bg-emerald-400/10",
  revenue_ready: "border-amber-300/30 bg-amber-300/10",
};

const CHIP_STYLES: Record<string, string> = {
  idea_clarity: "bg-slate-500/30 text-slate-100",
  discovery_ready: "bg-blue-500/30 text-blue-100",
  mvp_candidate: "bg-violet-500/30 text-violet-100",
  pilot_ready: "bg-emerald-500/30 text-emerald-100",
  revenue_ready: "bg-amber-400/30 text-amber-100",
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
      <p className="mb-6 text-center text-lg font-medium text-slate-300">
        Every founder here is further along than when they walked in — celebrate the journey.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STAGE_ORDER.map((stage, colIndex) => {
          const meta = STAGE_META[stage];
          const entries = byStage.get(stage) ?? [];
          return (
            <div
              key={stage}
              className={`flex min-h-[16rem] flex-col gap-3 rounded-2xl border p-4 ${COLUMN_STYLES[stage]}`}
            >
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-wide text-white">{meta.label}</p>
                <p className="text-xs text-slate-300">{entries.length} founder{entries.length === 1 ? "" : "s"}</p>
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
                    className={`rounded-full px-3 py-1.5 text-center text-sm font-semibold ${CHIP_STYLES[stage]}`}
                  >
                    {entry.alias}
                  </motion.span>
                ))}
                {entries.length === 0 && (
                  <p className="mt-4 text-center text-xs text-slate-500">No founders here yet</p>
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
