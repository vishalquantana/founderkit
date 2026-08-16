"use client";

import { LEAN_CANVAS_BLOCKS, canvasCellTone } from "@/lib/result-view";
import { DIMENSION_MAX } from "@/lib/readiness";
import type { EvaluationResult } from "@/ai/schema";
import type { SectionKey } from "@/db/schema";

export type MiniMapTone = "strong" | "growing" | "sharpen" | "empty";

/** Mini-map cell fill classes per tone — the only strong colours on the card. */
export const MINI_MAP_TONE_CLASSES: Record<MiniMapTone, string> = {
  strong: "bg-green-200/80 dark:bg-green-400/30",
  growing: "bg-blue-200/80 dark:bg-blue-400/30",
  sharpen: "bg-amber-200/80 dark:bg-amber-400/30",
  empty: "bg-slate-200/70 dark:bg-white/10",
};

export const MINI_MAP_LEGEND_SWATCH_CLASSES: Record<"strong" | "growing" | "sharpen", string> = {
  strong: "bg-green-500",
  growing: "bg-blue-500",
  sharpen: "bg-amber-500",
};

export interface CanvasMiniMapCell {
  key: string;
  title: string;
  gridArea: string;
  tone: MiniMapTone;
}

/** Resolve the 9 Lean Canvas blocks into mini-map cell tones from a result + answers. */
export function resolveMiniMapCells(
  result: EvaluationResult,
  answers: Record<SectionKey, string>,
): CanvasMiniMapCell[] {
  return LEAN_CANVAS_BLOCKS.map((block) => {
    const score = block.dimension ? result.dimensionScores[block.dimension] : undefined;
    const max = block.dimension ? DIMENSION_MAX[block.dimension] : undefined;
    return {
      key: block.key,
      title: block.title,
      gridArea: block.gridArea,
      tone: canvasCellTone(score, max),
    };
  });
}

export interface CanvasMiniMapProps {
  cells: CanvasMiniMapCell[];
  activeIndex?: number;
  onSelect?: (index: number) => void;
  className?: string;
}

/**
 * The colour-coded, tappable 9-block Lean Canvas mini-map — shared between
 * `LeanCanvasExplorer` (full interactive carousel) and `FounderHome` (a
 * static at-a-glance preview linking out to the full canvas).
 */
export function CanvasMiniMap({ cells, activeIndex, onSelect, className }: CanvasMiniMapProps) {
  return (
    <div
      className={`grid gap-[3px] rounded-lg border p-1 ${className ?? ""}`}
      style={{
        gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
        gridTemplateRows: "repeat(3, 18px)",
        borderColor: "var(--pulse-border-strong)",
        background: "var(--pulse-surface-strong)",
      }}
    >
      {cells.map((cell, i) => {
        const interactive = typeof onSelect === "function";
        return (
          <button
            key={cell.key}
            type="button"
            aria-label={cell.title}
            aria-pressed={activeIndex === i}
            disabled={!interactive}
            onClick={interactive ? () => onSelect(i) : undefined}
            style={{ gridArea: cell.gridArea }}
            className={`rounded-[3px] transition ${MINI_MAP_TONE_CLASSES[cell.tone]} ${
              activeIndex === i ? "outline outline-2 outline-offset-1 outline-[var(--pulse-violet)]" : ""
            } ${interactive ? "" : "cursor-default"}`}
          />
        );
      })}
    </div>
  );
}

export interface CanvasMiniMapLegendProps {
  className?: string;
}

export function CanvasMiniMapLegend({ className }: CanvasMiniMapLegendProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-[11px] text-muted ${className ?? ""}`}>
      <span className="flex items-center gap-1.5">
        <span className={`inline-block h-2 w-2 rounded-full ${MINI_MAP_LEGEND_SWATCH_CLASSES.strong}`} />
        Strong
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`inline-block h-2 w-2 rounded-full ${MINI_MAP_LEGEND_SWATCH_CLASSES.growing}`} />
        Growing
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`inline-block h-2 w-2 rounded-full ${MINI_MAP_LEGEND_SWATCH_CLASSES.sharpen}`} />
        Sharpen
      </span>
    </div>
  );
}

export default CanvasMiniMap;
