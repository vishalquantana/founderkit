"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LEAN_CANVAS_BLOCKS, canvasCellTone, cellFeedback, type CellFeedback } from "@/lib/result-view";
import { DIMENSION_MAX } from "@/lib/readiness";
import { CanvasMiniMap, CanvasMiniMapLegend, type MiniMapTone } from "@/components/result/CanvasMiniMap";
import type { EvaluationResult } from "@/ai/schema";
import type { SectionKey } from "@/db/schema";

export interface LeanCanvasExplorerProps {
  result: EvaluationResult;
  answers: Record<SectionKey, string>;
  className?: string;
}

type Tone = MiniMapTone;

/** Legend + card pill classes per tone, readable in both themes. */
const PILL_TONE_CLASSES: Record<CellFeedback["tone"], string> = {
  strong: "bg-green-500/15 text-green-700 border border-green-500/30 dark:text-green-300",
  growing: "bg-blue-500/15 text-blue-700 border border-blue-500/30 dark:text-blue-300",
  sharpen: "bg-amber-500/15 text-amber-700 border border-amber-500/30 dark:text-amber-300",
};

interface ResolvedBlock {
  key: string;
  title: string;
  helper: string;
  gridArea: string;
  answer: string | null;
  score: number | undefined;
  max: number | undefined;
  tone: Tone;
  recommendations: string[] | undefined;
  fallbackFeedback: string | undefined;
}

function resolveBlock(
  block: (typeof LEAN_CANVAS_BLOCKS)[number],
  answers: Record<SectionKey, string>,
  result: EvaluationResult,
): ResolvedBlock {
  const answer = block.source
    ? (answers[block.source] ?? "").trim() || null
    : block.pitchSource
      ? result.improvedPitch?.trim() || null
      : null;
  const score = block.dimension ? result.dimensionScores[block.dimension] : undefined;
  const max = block.dimension ? DIMENSION_MAX[block.dimension] : undefined;
  const recommendations = block.source ? result.sectionRecommendations?.[block.source] : undefined;
  const fallbackFeedback =
    !recommendations && block.source ? result.sectionFeedback?.[block.source] : undefined;

  return {
    key: block.key,
    title: block.title,
    helper: block.helper,
    gridArea: block.gridArea,
    answer,
    score,
    max,
    tone: canvasCellTone(score, max),
    recommendations,
    fallbackFeedback,
  };
}

/**
 * "Option B" — a colour-coded, tappable mini-map of the 9 Lean Canvas
 * blocks paired with a swipeable card carousel. Replaces the tiny
 * scaled-down landscape canvas on mobile with a legible, theme-aware
 * explorer: tap the mini-map or use Prev/Next to move through blocks,
 * each card surfacing the full answer, score, and recommendations.
 */
export function LeanCanvasExplorer({ result, answers, className }: LeanCanvasExplorerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const blocks = LEAN_CANVAS_BLOCKS.map((block) => resolveBlock(block, answers, result));
  const active = blocks[index];
  const feedback = active.score !== undefined && active.max ? cellFeedback(active.score, active.max) : null;
  const ratio =
    active.max && active.score !== undefined ? Math.min(1, Math.max(0, active.score / active.max)) : 0;

  function goTo(next: number) {
    const clamped = (next + blocks.length) % blocks.length;
    setDirection(clamped > index ? 1 : -1);
    setIndex(clamped);
  }

  return (
    <div className={className}>
      {/* Mini-map */}
      <CanvasMiniMap
        cells={blocks.map((block) => ({
          key: block.key,
          title: block.title,
          gridArea: block.gridArea,
          tone: block.tone,
        }))}
        activeIndex={index}
        onSelect={goTo}
      />

      {/* Legend */}
      <CanvasMiniMapLegend className="mt-2" />

      {/* Card */}
      <div className="pulse-card relative mt-3 overflow-hidden p-4">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={active.key}
            custom={direction}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction >= 0 ? 24 : -24 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction >= 0 ? -24 : 24 }}
            transition={shouldReduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <h3
                className="text-sm font-semibold uppercase tracking-tight"
                style={{ color: "var(--pulse-text)" }}
              >
                {active.title}
              </h3>
              {feedback ? (
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${PILL_TONE_CLASSES[feedback.tone]}`}
                >
                  {feedback.label}
                </span>
              ) : null}
            </div>

            {active.answer ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--pulse-text)" }}>
                {active.answer}
              </p>
            ) : (
              <p className="text-sm italic leading-relaxed text-muted">{active.helper}</p>
            )}

            {active.max !== undefined && active.score !== undefined ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Score</span>
                  <span className="tabular-nums">
                    {active.score}/{active.max}
                  </span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full"
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
                        : { type: "spring", stiffness: 120, damping: 18, delay: 0.05 }
                    }
                  />
                </div>
              </div>
            ) : null}

            {active.recommendations && active.recommendations.length > 0 ? (
              <div
                className="rounded-xl p-3"
                style={{ background: "var(--pulse-surface-strong)", border: "1px solid var(--pulse-border)" }}
              >
                <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                  Recommendations
                </h4>
                <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed" style={{ color: "var(--pulse-text)" }}>
                  {active.recommendations.map((rec) => (
                    <li key={rec}>{rec}</li>
                  ))}
                </ul>
              </div>
            ) : active.fallbackFeedback ? (
              <p
                className="rounded-xl p-3 text-xs leading-relaxed"
                style={{
                  background: "var(--pulse-surface-strong)",
                  border: "1px solid var(--pulse-border)",
                  color: "var(--pulse-text)",
                }}
              >
                <span className="font-semibold">How to sharpen this → </span>
                {active.fallbackFeedback}
              </p>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Carousel controls */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous block"
          className="pulse-btn-secondary px-3 py-1.5 text-xs"
        >
          Prev
        </button>

        <div className="flex items-center gap-1.5" aria-hidden="true">
          {blocks.map((block, i) => (
            <span
              key={block.key}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 18 : 6,
                background: i === index ? "var(--pulse-kicker)" : "var(--pulse-border-strong)",
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next block"
          className="pulse-btn-secondary px-3 py-1.5 text-xs"
        >
          Next
        </button>
      </div>

      <p className="mt-2 text-center text-[11px] text-muted">
        {index + 1} of {blocks.length} · {active.title}
      </p>
    </div>
  );
}

export default LeanCanvasExplorer;
