import { eq } from "drizzle-orm";
import { db } from "../client";
import { participants, responses, results } from "../schema";
import type { ReadinessStage } from "../schema";
import { getWorkshopStats } from "./admin";
import { getWorkshopById } from "./workshops";
import type { WorkshopSettings } from "./workshops";
import { aliasFor } from "@/lib/present";

export async function getPresentData(workshopId: string): Promise<{
  total: number;
  completed: number;
  stageDistribution: Record<ReadinessStage, number>;
  sectorBreakdown: { sector: string; count: number }[];
  problems: string[];
  progression: { alias: string; stage: ReadinessStage }[];
}> {
  const stats = await getWorkshopStats(workshopId);
  const workshop = await getWorkshopById(workshopId);
  const settings = workshop?.settings as WorkshopSettings | undefined;
  const useNames = !!settings?.leaderboard;

  const parts = await db.query.participants.findMany({
    where: eq(participants.workshopId, workshopId),
  });

  const completedParticipants = parts.filter((p) => p.completedAt != null);

  const problems: string[] = [];
  for (const p of completedParticipants) {
    const problemResponses = await db.query.responses.findMany({
      where: eq(responses.participantId, p.id),
    });
    for (const r of problemResponses) {
      if (r.section === "problem" && r.mainAnswer) {
        problems.push(r.mainAnswer);
      }
    }
  }

  const progression: { alias: string; stage: ReadinessStage }[] = [];
  let index = 0;
  for (const p of completedParticipants) {
    const resultRow = await db.query.results.findFirst({
      where: eq(results.participantId, p.id),
    });
    if (resultRow) {
      progression.push({
        alias: aliasFor({ startupName: p.startupName, index, useNames }),
        stage: resultRow.readinessStage as ReadinessStage,
      });
      index += 1;
    }
  }

  return {
    total: stats.total,
    completed: stats.completed,
    stageDistribution: stats.stageDistribution,
    sectorBreakdown: stats.sectorBreakdown,
    problems,
    progression,
  };
}
