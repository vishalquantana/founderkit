"use client";

import { motion, useReducedMotion } from "motion/react";

export interface PollResultsViewProps {
  question: string;
  options: string[];
  counts: number[];
  total: number;
}

function percentFor(count: number, total: number): number {
  return total > 0 ? (count / total) * 100 : 0;
}

export function PollResultsView({ question, options, counts, total }: PollResultsViewProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="text-center">
        <p className="pulse-kicker text-lg tracking-[0.3em]">Live poll</p>
        <h2 className="font-display mt-2 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          {question}
        </h2>
        <p className="mt-3 text-lg font-medium text-[var(--pulse-text-muted)]">
          <span className="font-display font-bold tabular-nums text-[var(--pulse-gold)]">{total}</span>{" "}
          response{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-5">
        {options.map((option, i) => {
          const count = counts[i] ?? 0;
          const pct = percentFor(count, total);
          const label = String.fromCharCode(65 + i);
          return (
            <div key={i} className="flex items-center gap-4">
              <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-strong text-lg font-bold text-[var(--pulse-text)]">
                {label}
              </span>
              <div className="flex-1">
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-base font-semibold text-[var(--pulse-text)] sm:text-lg">
                    {option}
                  </span>
                  <span className="font-display shrink-0 text-lg font-bold tabular-nums text-[var(--pulse-text)]">
                    {count} <span className="text-[var(--pulse-text-muted)]">({Math.round(pct)}%)</span>
                  </span>
                </div>
                <div className="h-8 w-full overflow-hidden rounded-full bg-surface-strong">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--pulse-gradient)" }}
                    initial={shouldReduceMotion ? { width: `${pct}%` } : { width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 120, damping: 22, delay: i * 0.08 }
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PollResultsView;
