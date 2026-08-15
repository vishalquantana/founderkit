"use client";

import { motion, useReducedMotion } from "motion/react";
import { DIMENSION_MAX } from "@/lib/readiness";
import { cellFeedback, type CellFeedback } from "@/lib/result-view";

const TONE_CLASSES: Record<CellFeedback["tone"], string> = {
  strong: "bg-green-50 text-green-700 border border-green-200",
  growing: "bg-blue-50 text-blue-700 border border-blue-200",
  sharpen: "bg-amber-50 text-amber-700 border border-amber-200",
};

export function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

/** A resolved, render-ready piece of the Lean Canvas (main block or sub-block). */
export interface ResolvedCanvasPiece {
  id: string;
  title: string;
  helper: string;
  answer: string | null;
  score?: number;
  dimension?: keyof typeof DIMENSION_MAX;
}

export function resolveFeedback(piece: ResolvedCanvasPiece): CellFeedback | null {
  if (piece.score === undefined || !piece.dimension) return null;
  return cellFeedback(piece.score, DIMENSION_MAX[piece.dimension]);
}

export interface CanvasCellHeaderProps {
  piece: ResolvedCanvasPiece;
  sub?: boolean;
  onOpen: () => void;
  layoutId?: string;
}

/**
 * The compact, in-grid rendering of one Lean Canvas piece (main block or
 * sub-block). Populated pieces are tappable and morph (shared layoutId)
 * into the full-detail overlay. Uncaptured pieces render the authentic
 * grey italic template helper text and are visually lighter.
 */
export function CanvasCellHeader({ piece, sub, onOpen, layoutId }: CanvasCellHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const feedback = resolveFeedback(piece);
  const captured = piece.answer !== null && piece.answer.trim().length > 0;

  return (
    <motion.div
      layoutId={shouldReduceMotion ? undefined : layoutId}
      onClick={onOpen}
      whileTap={captured && !shouldReduceMotion ? { scale: 0.97 } : undefined}
      role={captured ? "button" : undefined}
      tabIndex={captured ? 0 : undefined}
      onKeyDown={(e) => {
        if (!captured) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`flex h-full flex-col gap-0.5 px-1.5 py-1 text-left ${captured ? "cursor-pointer" : "cursor-default"}`}
    >
      <h3
        className={`font-bold uppercase tracking-tight text-black ${sub ? "text-[6px]" : "text-[7px]"}`}
      >
        {piece.title}
      </h3>
      {captured ? (
        <>
          <p
            className={`flex-1 overflow-hidden leading-snug text-slate-700 ${sub ? "text-[6.5px]" : "text-[7px]"}`}
          >
            {truncate(piece.answer!, sub ? 60 : 140)}
          </p>
          {feedback ? (
            <span
              className={`mt-auto inline-flex w-fit items-center rounded-full px-1.5 py-[1px] text-[6px] font-medium ${TONE_CLASSES[feedback.tone]}`}
            >
              {feedback.label}
            </span>
          ) : null}
        </>
      ) : (
        <p
          className={`italic leading-snug text-slate-400 ${sub ? "text-[6px]" : "text-[6.5px]"}`}
        >
          {piece.helper}
        </p>
      )}
    </motion.div>
  );
}

export interface CanvasOverlayCardProps {
  piece: ResolvedCanvasPiece;
  onClose: () => void;
  layoutId?: string;
}

/** The expanded, shared-element overlay for a tapped canvas piece. */
export function CanvasOverlayCard({ piece, onClose, layoutId }: CanvasOverlayCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const feedback = resolveFeedback(piece);
  const max = piece.dimension ? DIMENSION_MAX[piece.dimension] : undefined;
  const ratio = max && piece.score !== undefined ? Math.min(1, Math.max(0, piece.score / max)) : 0;

  return (
    <motion.div
      layoutId={shouldReduceMotion ? undefined : layoutId}
      initial={shouldReduceMotion ? { opacity: 0 } : undefined}
      animate={shouldReduceMotion ? { opacity: 1 } : undefined}
      exit={shouldReduceMotion ? { opacity: 0 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-6 shadow-2xl shadow-slate-900/10"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold uppercase tracking-tight text-slate-800">
          {piece.title}
        </h3>
        {feedback ? (
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${TONE_CLASSES[feedback.tone]}`}
          >
            {feedback.label}
          </span>
        ) : null}
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{piece.answer}</p>

      {max !== undefined && piece.score !== undefined ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Dimension score</span>
            <span className="tabular-nums">
              {piece.score}/{max}
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
      ) : null}

      <button
        type="button"
        onClick={onClose}
        className="mt-1 self-start text-sm font-medium text-slate-400 transition hover:text-slate-600"
      >
        Close
      </button>
    </motion.div>
  );
}

export default CanvasCellHeader;
