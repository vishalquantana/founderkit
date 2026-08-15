"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LEAN_CANVAS_BLOCKS, stageColorClasses } from "@/lib/result-view";
import { STAGE_META } from "@/lib/readiness";
import {
  CanvasCellHeader,
  CanvasOverlayCard,
  type ResolvedCanvasPiece,
} from "./CanvasCell";
import type { EvaluationResult } from "@/ai/schema";
import type { SectionKey } from "@/db/schema";

export interface CanvasBoardProps {
  result: EvaluationResult;
  answers: Record<SectionKey, string>;
  className?: string;
}

/** Natural (unscaled) pixel dimensions of the authentic canvas layout. */
const NATURAL_WIDTH = 920;
const NATURAL_HEIGHT = 460;
const MIN_SCALE = 0.36;

function resolveMainPiece(
  block: (typeof LEAN_CANVAS_BLOCKS)[number],
  answers: Record<SectionKey, string>,
  result: EvaluationResult,
): ResolvedCanvasPiece {
  const answer = block.source
    ? (answers[block.source] ?? "").trim() || null
    : block.pitchSource
      ? result.improvedPitch?.trim() || null
      : null;
  return {
    id: block.key,
    title: block.title,
    helper: block.helper,
    answer,
    score: block.dimension ? result.dimensionScores[block.dimension] : undefined,
    dimension: block.dimension,
  };
}

function resolveSubPiece(
  block: (typeof LEAN_CANVAS_BLOCKS)[number],
  answers: Record<SectionKey, string>,
  result: EvaluationResult,
): ResolvedCanvasPiece | null {
  const sub = block.sub;
  if (!sub) return null;
  const answer = sub.source
    ? (answers[sub.source] ?? "").trim() || null
    : sub.pitchSource
      ? result.improvedPitch?.trim() || null
      : null;
  return {
    id: `${block.key}:${sub.key}`,
    title: sub.title,
    helper: sub.helper,
    answer,
    score: undefined,
    dimension: undefined,
  };
}

/**
 * The authentic Lean Canvas board — the classic Ash Maurya 9-block
 * template rendered as a landscape CSS grid, populated with the founder's
 * answers and AI feedback. Scales to fit the container width while
 * preserving its landscape aspect ratio (with a horizontal-scroll
 * fallback once it can no longer shrink legibly). Tapping a populated
 * block morphs it (shared layoutId) into a full-detail overlay.
 */
export function CanvasBoard({ result, answers, className }: CanvasBoardProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const colors = stageColorClasses(result.readinessStage);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? NATURAL_WIDTH;
      setScale(Math.min(1, width / NATURAL_WIDTH));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pieces = new Map<string, ResolvedCanvasPiece>();
  for (const block of LEAN_CANVAS_BLOCKS) {
    pieces.set(block.key, resolveMainPiece(block, answers, result));
    const sub = resolveSubPiece(block, answers, result);
    if (sub) pieces.set(sub.id, sub);
  }
  const openPiece = openId ? (pieces.get(openId) ?? null) : null;

  const effectiveScale = Math.max(scale, MIN_SCALE);
  const needsHorizontalScroll = scale < MIN_SCALE;

  return (
    <div className={className}>
      <div ref={containerRef} className="w-full overflow-x-auto">
        <div
          style={{
            width: needsHorizontalScroll ? NATURAL_WIDTH * MIN_SCALE : "100%",
            height: NATURAL_HEIGHT * effectiveScale,
          }}
        >
          <div
            style={{
              width: NATURAL_WIDTH,
              height: NATURAL_HEIGHT,
              transform: `scale(${effectiveScale})`,
              transformOrigin: "top left",
            }}
            className="relative"
          >
            <div
              className="grid h-full w-full border border-black bg-white"
              style={{
                gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
                gridTemplateRows: "repeat(3, minmax(0, 1fr))",
              }}
            >
              {LEAN_CANVAS_BLOCKS.map((block) => {
                const main = pieces.get(block.key)!;
                const subPiece = block.sub ? pieces.get(`${block.key}:${block.sub.key}`) : null;
                return (
                  <div
                    key={block.key}
                    style={{ gridArea: block.gridArea }}
                    className="flex flex-col divide-y divide-black border border-black overflow-hidden"
                  >
                    <div className="flex-1 overflow-hidden">
                      <CanvasCellHeader
                        piece={main}
                        onOpen={() => main.answer && setOpenId(main.id)}
                        layoutId={`canvas-${main.id}`}
                      />
                    </div>
                    {subPiece ? (
                      <div className="h-[28%] shrink-0 overflow-hidden bg-slate-50/60">
                        <CanvasCellHeader
                          piece={subPiece}
                          sub
                          onOpen={() => subPiece.answer && setOpenId(subPiece.id)}
                          layoutId={`canvas-${subPiece.id}`}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Brand footer, echoing the template's wordmark corner */}
            <div className="pointer-events-none absolute bottom-1 right-1.5 flex items-center gap-1.5 opacity-80">
              <Image src="/quantana-logo.png" alt="Quantana" width={54} height={12} className="h-3 w-auto" />
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-[1px] text-[6px] font-semibold ${colors.badge}`}
              >
                {STAGE_META[result.readinessStage].label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {openPiece ? (
          <motion.div
            key="canvas-scrim"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.2 }}
            onClick={() => setOpenId(null)}
          >
            <CanvasOverlayCard
              piece={openPiece}
              onClose={() => setOpenId(null)}
              layoutId={`canvas-${openPiece.id}`}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default CanvasBoard;
