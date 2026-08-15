import type { ReadinessStage } from "@/db/schema";
import type { WorkshopSettings } from "@/db/queries/workshops";

export interface PresentData {
  total: number;
  completed: number;
  stageDistribution: Record<ReadinessStage, number>;
  sectorBreakdown: { sector: string; count: number }[];
  problems: string[];
  progression: { alias: string; stage: ReadinessStage }[];
  settings?: WorkshopSettings;
}
