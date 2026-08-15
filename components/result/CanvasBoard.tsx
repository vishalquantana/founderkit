"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CANVAS_CELLS } from "@/lib/result-view";
import { CanvasCell } from "./CanvasCell";
import type { EvaluationResult } from "@/ai/schema";
import type { SectionKey } from "@/db/schema";

export interface CanvasBoardProps {
  result: EvaluationResult;
  answers: Record<SectionKey, string>;
  className?: string;
}

/**
 * The interactive lean canvas board — the signature "aha" artifact of the
 * results screen. Renders a grid of tappable tiles, one per canvas cell;
 * tapping a tile morphs it (via a shared `layoutId`) into a full-detail
 * overlay card.
 */
export function CanvasBoard({ result, answers, className }: CanvasBoardProps) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const openCell = CANVAS_CELLS.find((cell) => cell.section === openSection) ?? null;

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CANVAS_CELLS.map((cell) => (
          <CanvasCell
            key={cell.section}
            cell={cell}
            answer={answers[cell.section] ?? ""}
            score={result.dimensionScores[cell.dimension]}
            isOpen={false}
            onToggle={() => setOpenSection(cell.section)}
          />
        ))}
      </div>

      <AnimatePresence>
        {openCell ? (
          <motion.div
            key="canvas-scrim"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.2 }}
            onClick={() => setOpenSection(null)}
          >
            <CanvasCell
              cell={openCell}
              answer={answers[openCell.section] ?? ""}
              score={result.dimensionScores[openCell.dimension]}
              isOpen
              onToggle={() => setOpenSection(null)}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default CanvasBoard;
