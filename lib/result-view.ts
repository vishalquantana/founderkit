import type { ReadinessStage, SectionKey } from "@/db/schema";
import type { Dimension } from "@/lib/readiness";

export interface StageColorClasses {
  badge: string;
  ring: string;
  bar: string;
  glow: string;
}

/**
 * Soft, positive Tailwind class sets per readiness stage. Never uses red —
 * this is an encouraging payoff screen, not a warning screen.
 */
export const STAGE_COLOR_CLASSES: Record<ReadinessStage, StageColorClasses> = {
  idea_clarity: {
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
    ring: "ring-slate-300",
    bar: "bg-gradient-to-r from-slate-400 to-blue-400",
    glow: "shadow-slate-200/60",
  },
  discovery_ready: {
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    ring: "ring-blue-300",
    bar: "bg-gradient-to-r from-blue-400 to-blue-500",
    glow: "shadow-blue-200/60",
  },
  mvp_candidate: {
    badge: "bg-purple-50 text-purple-700 border border-purple-200",
    ring: "ring-violet-300",
    bar: "bg-gradient-to-r from-purple-400 to-violet-500",
    glow: "shadow-purple-200/60",
  },
  pilot_ready: {
    badge: "bg-green-50 text-green-700 border border-green-200",
    ring: "ring-green-300",
    bar: "bg-gradient-to-r from-green-400 to-emerald-500",
    glow: "shadow-green-200/60",
  },
  revenue_ready: {
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    ring: "ring-amber-300",
    bar: "bg-gradient-to-r from-amber-400 to-yellow-500",
    glow: "shadow-amber-200/60",
  },
};

export function stageColorClasses(stage: ReadinessStage): StageColorClasses {
  return STAGE_COLOR_CLASSES[stage];
}

export interface CellFeedback {
  label: string;
  tone: "strong" | "growing" | "sharpen";
}

/**
 * Encouraging feedback based on the ratio of score to max. Never uses
 * discouraging language like "bad", "weak", or "fail".
 */
export function cellFeedback(score: number, max: number): CellFeedback {
  const ratio = max > 0 ? score / max : 0;
  if (ratio >= 0.7) return { label: "Strong and clear", tone: "strong" };
  if (ratio >= 0.45) return { label: "Coming together", tone: "growing" };
  return { label: "Worth sharpening", tone: "sharpen" };
}

export interface CanvasCell {
  section: SectionKey;
  dimension: Dimension;
  title: string;
}

/** The 6 canvas cells in a pleasing board order with short titles. */
export const CANVAS_CELLS: CanvasCell[] = [
  { section: "problem", dimension: "problemClarity", title: "Problem" },
  { section: "customer", dimension: "customerClarity", title: "Customer Map" },
  { section: "value", dimension: "valuePayment", title: "Value & Payment" },
  { section: "mvp", dimension: "mvpQuality", title: "MVP" },
  { section: "distribution", dimension: "distribution", title: "Distribution" },
  { section: "proof", dimension: "validation", title: "Proof" },
];
