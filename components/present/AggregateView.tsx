"use client";

import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { STAGE_META } from "@/lib/readiness";
import { STAGE_ORDER } from "@/lib/present";
import type { PresentData } from "@/components/present/types";

const BAR_COLORS: Record<string, string> = {
  idea_clarity: "var(--stage-idea)",
  discovery_ready: "var(--stage-discovery)",
  mvp_candidate: "var(--stage-mvp)",
  pilot_ready: "var(--stage-pilot)",
  revenue_ready: "var(--stage-revenue)",
};

export interface AggregateViewProps {
  data: PresentData;
}

export function AggregateView({ data }: AggregateViewProps) {
  const maxStageCount = Math.max(1, ...STAGE_ORDER.map((stage) => data.stageDistribution[stage] ?? 0));

  return (
    <div className="flex flex-col items-center gap-12">
      <div className="text-center">
        <p className="pulse-kicker text-lg tracking-[0.3em]">Founders in the room</p>
        <AnimatedNumber
          value={data.total}
          className="font-display text-gradient block text-[8rem] font-black leading-none tracking-tight sm:text-[11rem]"
        />
        <p className="mt-2 text-xl font-medium text-[var(--pulse-text-muted)]">
          <AnimatedNumber
            value={data.completed}
            className="font-display font-bold text-[var(--pulse-gold)]"
          />{" "}
          submitted their canvas
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-4">
        {STAGE_ORDER.map((stage, i) => {
          const meta = STAGE_META[stage];
          const count = data.stageDistribution[stage] ?? 0;
          const pct = Math.round((count / maxStageCount) * 100);
          const stageColor = BAR_COLORS[stage];
          return (
            <div key={stage} className="flex items-center gap-4">
              <span className="font-display w-44 shrink-0 text-right text-base font-semibold text-[var(--pulse-text)] sm:text-lg">
                {meta.label}
              </span>
              <div className="h-8 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: stageColor, boxShadow: `0 0 16px -4px ${stageColor}` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 22, delay: i * 0.08 }}
                />
              </div>
              <span className="font-display w-10 shrink-0 text-lg font-bold tabular-nums text-[var(--pulse-text)]">
                {count}
              </span>
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
              className="pulse-chip px-4 py-1.5 text-sm font-medium"
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
