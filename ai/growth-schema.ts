import { z } from "zod";

export const GrowthPlanSchema = z.object({
  primaryChannel: z.string(),
  targetSegment: z.string(),
  conversionGoal: z.string(),
  successMetric30Day: z.string(),
  biggestRisk: z.string(),
  lowHangingOpportunity: z.string(),
  topChannels: z.array(z.string()).min(1),
  plan30Day: z.array(z.string()).min(1),
  plan60Day: z.array(z.string()).min(1),
  plan90Day: z.array(z.string()).min(1),
  metricsToTrack: z.array(z.string()).min(1),
  outreachScript: z.string(),
  avoidOverbuildingRec: z.string(),
});

export type GrowthPlanData = z.infer<typeof GrowthPlanSchema>;
