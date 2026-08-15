import type { EvaluationResult } from "@/ai/schema";
import type { ReadinessStage, SectionKey } from "@/db/schema";
import { STAGE_META, DIMENSION_MAX, DIMENSIONS } from "@/lib/readiness";
import { LEAN_CANVAS_BLOCKS, cellFeedback } from "@/lib/result-view";

export const STAGE_COLOR_HEX: Record<ReadinessStage, string> = {
  idea_clarity: "#64748b",
  discovery_ready: "#3b82f6",
  mvp_candidate: "#8b5cf6",
  pilot_ready: "#22c55e",
  revenue_ready: "#d4a017",
};

export interface PdfModelSubBlock {
  title: string;
  helper: string;
  answer: string | null;
}

export interface PdfModelBlock {
  key: string;
  title: string;
  helper: string;
  gridArea: string;
  answer: string | null;
  feedback: string | null;
  score?: number;
  max?: number;
  sub?: PdfModelSubBlock;
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
  blocks: PdfModelBlock[];
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

function resolveAnswer(
  answers: Record<SectionKey, string>,
  result: EvaluationResult,
  source?: SectionKey,
  pitchSource?: boolean,
): string | null {
  if (source) return (answers[source] ?? "").trim() || null;
  if (pitchSource) return result.improvedPitch?.trim() || null;
  return null;
}

export function buildPdfModel(input: BuildPdfModelInput): PdfModel {
  const { founderName, startupName, result, answers } = input;

  const blocks: PdfModelBlock[] = LEAN_CANVAS_BLOCKS.map((block) => {
    const answer = resolveAnswer(answers, result, block.source, block.pitchSource);
    const score = block.dimension ? result.dimensionScores[block.dimension] : undefined;
    const max = block.dimension ? DIMENSION_MAX[block.dimension] : undefined;
    const feedback = score !== undefined && max !== undefined ? cellFeedback(score, max).label : null;

    const sub: PdfModelSubBlock | undefined = block.sub
      ? {
          title: block.sub.title,
          helper: block.sub.helper,
          answer: resolveAnswer(answers, result, block.sub.source, block.sub.pitchSource),
        }
      : undefined;

    return {
      key: block.key,
      title: block.title,
      helper: block.helper,
      gridArea: block.gridArea,
      answer,
      feedback,
      score,
      max,
      sub,
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
    blocks,
    dimensions,
  };
}
