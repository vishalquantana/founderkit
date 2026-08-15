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

export interface LeanCanvasSubBlock {
  key: string;
  title: string;
  helper: string;
  source?: SectionKey;
  pitchSource?: boolean;
}

export interface LeanCanvasBlock {
  key: string;
  title: string;
  helper: string;
  /** CSS grid-area style coordinates: "row-start / col-start / row-end / col-end" */
  gridArea: string;
  source?: SectionKey;
  pitchSource?: boolean;
  dimension?: Dimension;
  sub?: LeanCanvasSubBlock;
}

/**
 * The authentic Ash Maurya Lean Canvas — 9 blocks laid out on a
 * 10-column x 3-row grid, plus the bottom Cost Structure / Revenue
 * Streams band. Populated where the app's 6 sections map onto the
 * template; the rest carry the verbatim template helper text and are
 * explicitly marked as not captured in this snapshot.
 */
export const LEAN_CANVAS_BLOCKS: LeanCanvasBlock[] = [
  {
    key: "problem",
    title: "Problem",
    helper: "List your top 1–3 problems.",
    gridArea: "1 / 1 / 3 / 3",
    source: "problem",
    dimension: "problemClarity",
    sub: {
      key: "existingAlternatives",
      title: "Existing Alternatives",
      helper: "List how these problems are solved today.",
    },
  },
  {
    key: "solution",
    title: "Solution",
    helper: "Outline a possible solution for each problem.",
    gridArea: "1 / 3 / 2 / 5",
    source: "mvp",
    dimension: "mvpQuality",
  },
  {
    key: "keyMetrics",
    title: "Key Metrics",
    helper: "List the key numbers that tell you how your business is doing.",
    gridArea: "2 / 3 / 3 / 5",
    source: "proof",
    dimension: "validation",
  },
  {
    key: "uniqueValueProposition",
    title: "Unique Value Proposition",
    helper:
      "Single, clear, compelling message that states why you are different and worth paying attention.",
    gridArea: "1 / 5 / 3 / 7",
    source: "value",
    dimension: "valuePayment",
    sub: {
      key: "highLevelConcept",
      title: "High-Level Concept",
      helper: "List your X for Y analogy e.g. YouTube = Flickr for videos.",
      pitchSource: true,
    },
  },
  {
    key: "unfairAdvantage",
    title: "Unfair Advantage",
    helper: "Something that cannot easily be bought or copied.",
    gridArea: "1 / 7 / 2 / 9",
  },
  {
    key: "channels",
    title: "Channels",
    helper: "List your path to customers (inbound or outbound).",
    gridArea: "2 / 7 / 3 / 9",
    source: "distribution",
    dimension: "distribution",
  },
  {
    key: "customerSegments",
    title: "Customer Segments",
    helper: "List your target customers and users.",
    gridArea: "1 / 9 / 3 / 11",
    source: "customer",
    dimension: "customerClarity",
    sub: {
      key: "earlyAdopters",
      title: "Early Adopters",
      helper: "List the characteristics of your ideal customers.",
    },
  },
  {
    key: "costStructure",
    title: "Cost Structure",
    helper: "List your fixed and variable costs.",
    gridArea: "3 / 1 / 4 / 6",
  },
  {
    key: "revenueStreams",
    title: "Revenue Streams",
    helper: "List your sources of revenue.",
    gridArea: "3 / 6 / 4 / 11",
  },
];
