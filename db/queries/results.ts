import { eq } from "drizzle-orm";
import { db } from "../client";
import { results } from "../schema";
import { newId } from "@/lib/ids";
import type { EvaluationResult } from "@/ai/schema";

export async function saveResult(participantId: string, r: EvaluationResult): Promise<void> {
  const existing = await db.query.results.findFirst({
    where: eq(results.participantId, participantId),
  });
  if (existing) {
    await db.delete(results).where(eq(results.id, existing.id));
  }
  await db.insert(results).values({
    id: newId(),
    participantId,
    backendScore: r.backendScore,
    dimensionScores: r.dimensionScores,
    readinessStage: r.readinessStage,
    summary: r.summary,
    strengths: r.strengths,
    assumptions: r.assumptions,
    mvpExperiment: r.mvpExperiment,
    sevenDayPlan: r.sevenDayPlan,
    improvedPitch: r.improvedPitch,
    reflectionQuestion: r.reflectionQuestion,
  });
}

export async function getResult(participantId: string): Promise<EvaluationResult | undefined> {
  const row = await db.query.results.findFirst({
    where: eq(results.participantId, participantId),
  });
  if (!row) return undefined;

  return {
    backendScore: row.backendScore,
    dimensionScores: row.dimensionScores as EvaluationResult["dimensionScores"],
    readinessStage: row.readinessStage as EvaluationResult["readinessStage"],
    summary: row.summary,
    strengths: row.strengths as string[],
    assumptions: row.assumptions as string[],
    mvpExperiment: row.mvpExperiment,
    sevenDayPlan: row.sevenDayPlan as EvaluationResult["sevenDayPlan"],
    improvedPitch: row.improvedPitch,
    reflectionQuestion: row.reflectionQuestion,
  };
}
