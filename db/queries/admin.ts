import { eq, desc, count } from "drizzle-orm";
import { db } from "../client";
import { workshops, participants, results } from "../schema";
import type { Workshop, WorkshopSettings } from "./workshops";
import type { WorkshopStatus, ReadinessStage } from "../schema";
import type { Participant } from "./participants";
import type { EvaluationResult } from "@/ai/schema";

export function emptyStageDistribution(): Record<ReadinessStage, number> {
  return {
    idea_clarity: 0,
    discovery_ready: 0,
    mvp_candidate: 0,
    pilot_ready: 0,
    revenue_ready: 0,
  };
}

export async function listWorkshopsByOwner(
  ownerId: string,
): Promise<(Workshop & { participantCount: number })[]> {
  const rows = await db.query.workshops.findMany({
    where: eq(workshops.ownerId, ownerId),
    orderBy: desc(workshops.createdAt),
  });

  const withCounts = await Promise.all(
    rows.map(async (w) => {
      const [row] = await db
        .select({ n: count() })
        .from(participants)
        .where(eq(participants.workshopId, w.id));
      return { ...w, participantCount: row?.n ?? 0 };
    }),
  );

  return withCounts;
}

export async function getWorkshopStats(workshopId: string): Promise<{
  total: number;
  completed: number;
  stageDistribution: Record<ReadinessStage, number>;
  sectorBreakdown: { sector: string; count: number }[];
}> {
  const parts = await db.query.participants.findMany({
    where: eq(participants.workshopId, workshopId),
  });

  const total = parts.length;
  const completed = parts.filter((p) => p.completedAt != null).length;

  const stageDistribution = emptyStageDistribution();
  const sectorCounts = new Map<string, number>();

  for (const p of parts) {
    if (p.sector) {
      sectorCounts.set(p.sector, (sectorCounts.get(p.sector) ?? 0) + 1);
    }

    const resultRow = await db.query.results.findFirst({
      where: eq(results.participantId, p.id),
    });
    if (resultRow) {
      const stage = resultRow.readinessStage as ReadinessStage;
      if (stage in stageDistribution) {
        stageDistribution[stage] += 1;
      }
    }
  }

  const sectorBreakdown = Array.from(sectorCounts.entries()).map(([sector, count]) => ({
    sector,
    count,
  }));

  return { total, completed, stageDistribution, sectorBreakdown };
}

export async function listSubmissions(
  workshopId: string,
): Promise<{ participant: Participant; result?: EvaluationResult }[]> {
  const parts = await db.query.participants.findMany({
    where: eq(participants.workshopId, workshopId),
    orderBy: desc(participants.createdAt),
  });

  return Promise.all(
    parts.map(async (participant) => {
      const row = await db.query.results.findFirst({
        where: eq(results.participantId, participant.id),
      });
      if (!row) return { participant };
      const result: EvaluationResult = {
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
      return { participant, result };
    }),
  );
}

export async function setWorkshopStatus(
  workshopId: string,
  status: WorkshopStatus,
): Promise<void> {
  await db.update(workshops).set({ status }).where(eq(workshops.id, workshopId));
}

export async function setWorkshopSettings(
  workshopId: string,
  settings: WorkshopSettings,
): Promise<void> {
  await db.update(workshops).set({ settings }).where(eq(workshops.id, workshopId));
}
