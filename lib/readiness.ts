import type { ReadinessStage } from "@/db/schema";

export const DIMENSIONS = [
  "problemClarity", "customerClarity", "valuePayment", "mvpQuality",
  "distribution", "validation", "teamStageFit", "cashflow",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_MAX: Record<Dimension, number> = {
  problemClarity: 15, customerClarity: 15, valuePayment: 20, mvpQuality: 15,
  distribution: 15, validation: 10, teamStageFit: 5, cashflow: 5,
};

export function stageForScore(score: number): ReadinessStage {
  if (score <= 25) return "idea_clarity";
  if (score <= 45) return "discovery_ready";
  if (score <= 65) return "mvp_candidate";
  if (score <= 80) return "pilot_ready";
  return "revenue_ready";
}

export const STAGE_META: Record<ReadinessStage, { label: string; color: string; blurb: string }> = {
  idea_clarity: { label: "Idea Clarity", color: "slate-blue", blurb: "You are still sharpening the problem and customer." },
  discovery_ready: { label: "Discovery Ready", color: "blue", blurb: "You have a direction, but important assumptions need validation." },
  mvp_candidate: { label: "MVP Candidate", color: "purple", blurb: "You have enough clarity to test a small MVP." },
  pilot_ready: { label: "Pilot Ready", color: "green", blurb: "You have early clarity and can run a controlled pilot." },
  revenue_ready: { label: "Revenue Ready", color: "gold", blurb: "You have signs of payment, repeat use, or adoption." },
};
