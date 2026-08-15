"use client";

import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { STAGE_META } from "@/lib/readiness";
import { STAGE_ORDER } from "@/lib/present";
import type { PresentData } from "@/components/present/types";

const BAR_GRADIENTS: Record<string, string> = {
  idea_clarity: "from-slate-400 to-blue-400",
  discovery_ready: "from-blue-400 to-cyan-400",
  mvp_candidate: "from-violet-400 to-purple-400",
  pilot_ready: "from-emerald-400 to-green-400",
  revenue_ready: "from-amber-400 to-yellow-300",
};

export interface AggregateViewProps {
  data: PresentData;
}

export function AggregateView({ data }: AggregateViewProps) {
  const maxStageCount = Math.max(1, ...STAGE_ORDER.map((stage) => data.stageDistribution[stage] ?? 0));

  return (
    <div className="flex flex-col items-center gap-12">
      <div className="text-center">
        <p className="text-lg font-medium uppercase tracking-[0.3em] text-slate-400">Founders in the room</p>
        <AnimatedNumber
          value={data.total}
          className="block text-[8rem] font-black leading-none tracking-tight text-white sm:text-[11rem]"
        />
        <p className="mt-2 text-xl font-medium text-slate-300">
          <AnimatedNumber value={data.completed} className="font-bold text-emerald-300" /> submitted their canvas
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-4">
        {STAGE_ORDER.map((stage, i) => {
          const meta = STAGE_META[stage];
          const count = data.stageDistribution[stage] ?? 0;
          const pct = Math.round((count / maxStageCount) * 100);
          return (
            <div key={stage} className="flex items-center gap-4">
              <span className="w-44 shrink-0 text-right text-base font-semibold text-slate-200 sm:text-lg">
                {meta.label}
              </span>
              <div className="h-8 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${BAR_GRADIENTS[stage]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 22, delay: i * 0.08 }}
                />
              </div>
              <span className="w-10 shrink-0 text-lg font-bold tabular-nums text-white">{count}</span>
            </div>
          );
        })}
      </div>

      {data.sectorBreakdown.length > 0 && (
        <div className="flex max-w-4xl flex-wrap items-center justify-center gap-3">
          {data.sectorBreakdown.map((s, i) => (
            <motion.span
              key={s.sector}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-200"
            >
              {s.sector} · {s.count}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
}

export default AggregateView;
