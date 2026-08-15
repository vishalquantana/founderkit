"use client";

import { motion, useReducedMotion } from "motion/react";
import { buildWordFrequencies } from "@/lib/present";
import type { PresentData } from "@/components/present/types";

const PALETTE = [
  "text-[var(--pulse-violet)]",
  "text-[var(--pulse-pink)]",
  "text-[var(--pulse-gold)]",
  "text-[var(--stage-mvp)]",
  "text-[var(--pulse-text)]",
  "text-[var(--stage-discovery)]",
];

function fontSizeFor(count: number, maxCount: number): number {
  const min = 1.1;
  const max = 5.5;
  if (maxCount <= 0) return min;
  const ratio = count / maxCount;
  return min + ratio * (max - min);
}

export interface WordCloudViewProps {
  data: PresentData;
}

export function WordCloudView({ data }: WordCloudViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = buildWordFrequencies(data.problems, { max: 40 });
  const maxCount = words.length > 0 ? words[0].count : 1;

  if (words.length === 0) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <p className="text-2xl font-medium text-[var(--pulse-text-muted)]">
          Words will appear here as founders submit problems.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[26rem] flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 py-6">
      {words.map((w, i) => (
        <motion.span
          key={w.word}
          initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.6, y: 12 }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  scale: 1,
                  y: [0, -6, 0],
                }
          }
          transition={{
            opacity: { delay: i * 0.025, duration: 0.4 },
            scale: { delay: i * 0.025, type: "spring", stiffness: 200, damping: 18 },
            y: { delay: i * 0.025 + 0.4, duration: 4 + (i % 5) * 0.4, repeat: Infinity, ease: "easeInOut" },
          }}
          className={`font-display font-bold leading-none tracking-tight ${PALETTE[i % PALETTE.length]}`}
          style={{ fontSize: `${fontSizeFor(w.count, maxCount)}rem` }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
}

export default WordCloudView;
