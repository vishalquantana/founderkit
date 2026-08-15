"use client";

import { motion, useReducedMotion } from "motion/react";
import { DIMENSION_MAX } from "@/lib/readiness";
import { cellFeedback, type CanvasCell as CanvasCellType } from "@/lib/result-view";

const TONE_CLASSES: Record<"strong" | "growing" | "sharpen", string> = {
  strong: "bg-green-50 text-green-700 border border-green-200",
  growing: "bg-blue-50 text-blue-700 border border-blue-200",
  sharpen: "bg-amber-50 text-amber-700 border border-amber-200",
};

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export interface CanvasCellProps {
  cell: CanvasCellType;
  answer: string;
  score: number;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * One tile of the interactive lean canvas board. Collapsed, it shows a
 * title + snippet + feedback chip. When `isOpen` (rendered by CanvasBoard
 * as the expanded overlay), it shows the full answer, feedback label, and
 * that dimension's score bar. Shares `layoutId={cell.section}` with its
 * collapsed/expanded counterpart so Framer Motion can morph between them.
 */
export function CanvasCell({ cell, answer, score, isOpen, onToggle }: CanvasCellProps) {
  const shouldReduceMotion = useReducedMotion();
  const max = DIMENSION_MAX[cell.dimension];
  const feedback = cellFeedback(score, max);
  const ratio = max > 0 ? Math.min(1, Math.max(0, score / max)) : 0;
  const layoutId = shouldReduceMotion ? undefined : cell.section;

  if (isOpen) {
    return (
      <motion.div
        layoutId={layoutId}
        initial={shouldReduceMotion ? { opacity: 0 } : undefined}
        animate={shouldReduceMotion ? { opacity: 1 } : undefined}
        exit={shouldReduceMotion ? { opacity: 0 } : undefined}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-6 shadow-2xl shadow-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-800">{cell.title}</h3>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${TONE_CLASSES[feedback.tone]}`}
          >
            {feedback.label}
          </span>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{answer}</p>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Dimension score</span>
            <span className="tabular-nums">
              {score}/{max}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${ratio * 100}%` }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.2 }
                  : { type: "spring", stiffness: 120, damping: 18, delay: 0.1 }
              }
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="mt-1 self-start text-sm font-medium text-slate-400 transition hover:text-slate-600"
        >
          Close
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId={layoutId}
      onClick={onToggle}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
      className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <h3 className="text-sm font-semibold text-slate-800">{cell.title}</h3>
      <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
        {truncate(answer, 90)}
      </p>
      <span
        className={`mt-1 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${TONE_CLASSES[feedback.tone]}`}
      >
        {feedback.label}
      </span>
    </motion.div>
  );
}

export default CanvasCell;
