import type { EvaluationResult } from "@/ai/schema";
import type { ReadinessStage, SectionKey } from "@/db/schema";
import { STAGE_META, DIMENSION_MAX, DIMENSIONS } from "@/lib/readiness";
import { CANVAS_CELLS, cellFeedback } from "@/lib/result-view";

export const STAGE_COLOR_HEX: Record<ReadinessStage, string> = {
  idea_clarity: "#64748b",
  discovery_ready: "#3b82f6",
  mvp_candidate: "#8b5cf6",
  pilot_ready: "#22c55e",
  revenue_ready: "#d4a017",
};

export interface PdfModelCell {
  title: string;
  answer: string;
  feedback: string;
  score: number;
  max: number;
}

export interface PdfModelDimension {
  label: string;
  score: number;
  max: number;
}

export interface PdfModel {
  title: string;
  stageLabel: string;
  stageColor: string;
  summary: string;
  strengths: string[];
  assumptions: string[];
  mvpExperiment: string;
  sevenDayPlan: { day: string; text: string }[];
  improvedPitch: string;
  reflectionQuestion: string;
  score: number;
  cells: PdfModelCell[];
  dimensions: PdfModelDimension[];
}

export interface BuildPdfModelInput {
  founderName: string;
  startupName: string;
  result: EvaluationResult;
  answers: Record<SectionKey, string>;
}

const DIMENSION_LABELS: Record<(typeof DIMENSIONS)[number], string> = {
  problemClarity: "Problem Clarity",
  customerClarity: "Customer Clarity",
  valuePayment: "Value & Payment",
  mvpQuality: "MVP Quality",
  distribution: "Distribution",
  validation: "Validation",
  teamStageFit: "Team-Stage Fit",
  cashflow: "Cashflow",
};

export function buildPdfModel(input: BuildPdfModelInput): PdfModel {
  const { founderName, startupName, result, answers } = input;

  const cells: PdfModelCell[] = CANVAS_CELLS.map((cell) => {
    const score = result.dimensionScores[cell.dimension];
    const max = DIMENSION_MAX[cell.dimension];
    return {
      title: cell.title,
      answer: answers[cell.section] ?? "",
      feedback: cellFeedback(score, max).label,
      score,
      max,
    };
  });

  const dimensions: PdfModelDimension[] = DIMENSIONS.map((dimension) => ({
    label: DIMENSION_LABELS[dimension],
    score: result.dimensionScores[dimension],
    max: DIMENSION_MAX[dimension],
  }));

  return {
    title: `${founderName}, here's where ${startupName} stands`,
    stageLabel: STAGE_META[result.readinessStage].label,
    stageColor: STAGE_COLOR_HEX[result.readinessStage],
    summary: result.summary,
    strengths: result.strengths,
    assumptions: result.assumptions,
    mvpExperiment: result.mvpExperiment,
    sevenDayPlan: result.sevenDayPlan,
    improvedPitch: result.improvedPitch,
    reflectionQuestion: result.reflectionQuestion,
    score: result.backendScore,
    cells,
    dimensions,
  };
}
