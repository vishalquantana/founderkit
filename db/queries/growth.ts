import { eq } from "drizzle-orm";
import { db } from "../client";
import { growthPlans, type SectionKey } from "../schema";
import { getParticipant } from "./participants";
import { getResponses } from "./responses";
import { openRouterGenerateGrowthPlan } from "@/ai/growth-generator";
import type { GrowthPlanData } from "@/ai/growth-schema";
import { newId } from "@/lib/ids";

export type GrowthPlanRow = typeof growthPlans.$inferSelect;

export async function getGrowthPlan(participantId: string): Promise<GrowthPlanRow | undefined> {
  return db.query.growthPlans.findFirst({ where: eq(growthPlans.participantId, participantId) });
}

export async function generateAndSaveGrowthPlan(participantId: string): Promise<GrowthPlanRow> {
  const existing = await getGrowthPlan(participantId);
  if (existing) return existing;

  const participant = await getParticipant(participantId);
  if (!participant) throw new Error("Participant not found");

  const responses = await getResponses(participantId);
  if (responses.length === 0) {
    throw new Error("Please complete your Lean Canvas framework first before generating a growth plan.");
  }
  const answers = responses.reduce((acc, r) => {
    acc[r.section as SectionKey] = r.mainAnswer;
    return acc;
  }, {} as Record<string, string>);

  const planData: GrowthPlanData = await openRouterGenerateGrowthPlan({
    participant: {
      founderName: participant.founderName,
      startupName: participant.startupName,
      sector: participant.sector,
      stage: participant.stage,
      teamSize: participant.teamSize,
      productType: participant.productType,
      businessModel: participant.businessModel,
    },
    answers,
    canvasExtras: participant.canvasExtras,
  });

  const [row] = await db
    .insert(growthPlans)
    .values({
      id: newId(),
      participantId,
      primaryChannel: planData.primaryChannel,
      targetSegment: planData.targetSegment,
      conversionGoal: planData.conversionGoal,
      successMetric30Day: planData.successMetric30Day,
      biggestRisk: planData.biggestRisk,
      lowHangingOpportunity: planData.lowHangingOpportunity,
      topChannels: planData.topChannels,
      plan30Day: planData.plan30Day,
      plan60Day: planData.plan60Day,
      plan90Day: planData.plan90Day,
      metricsToTrack: planData.metricsToTrack,
      outreachScript: planData.outreachScript,
      avoidOverbuildingRec: planData.avoidOverbuildingRec,
      checkedTasks: [],
      aiRaw: planData as unknown as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: growthPlans.participantId,
      set: {
        primaryChannel: planData.primaryChannel,
        targetSegment: planData.targetSegment,
        conversionGoal: planData.conversionGoal,
        successMetric30Day: planData.successMetric30Day,
        biggestRisk: planData.biggestRisk,
        lowHangingOpportunity: planData.lowHangingOpportunity,
        topChannels: planData.topChannels,
        plan30Day: planData.plan30Day,
        plan60Day: planData.plan60Day,
        plan90Day: planData.plan90Day,
        metricsToTrack: planData.metricsToTrack,
        outreachScript: planData.outreachScript,
        avoidOverbuildingRec: planData.avoidOverbuildingRec,
        aiRaw: planData as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
}

export async function toggleGrowthTask(participantId: string, taskId: string): Promise<string[]> {
  const plan = await getGrowthPlan(participantId);
  if (!plan) throw new Error("Growth plan not found");

  const checked = new Set<string>(plan.checkedTasks ?? []);
  if (checked.has(taskId)) {
    checked.delete(taskId);
  } else {
    checked.add(taskId);
  }

  const updatedChecked = Array.from(checked);
  await db
    .update(growthPlans)
    .set({ checkedTasks: updatedChecked, updatedAt: new Date() })
    .where(eq(growthPlans.participantId, participantId));

  return updatedChecked;
}
