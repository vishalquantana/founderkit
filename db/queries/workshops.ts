import { eq } from "drizzle-orm";
import { db } from "../client";
import { workshops } from "../schema";
import { newId, newJoinCode } from "@/lib/ids";
import { DEFAULT_SETTINGS, DEFAULT_CONSENT_TEXT } from "@/lib/workshop-defaults";

export type WorkshopSettings = {
  liveViews: { dashboard: boolean; wordCloud: boolean; progression: boolean };
  leaderboard: boolean;
  probeEnabled: boolean;
  canvasUnlocked: boolean;
  feedbackPrompted?: boolean;
};

export type Workshop = typeof workshops.$inferSelect;

export async function createWorkshop(input: { ownerId: string; name: string }): Promise<Workshop> {
  const row = {
    id: newId(),
    ownerId: input.ownerId,
    name: input.name,
    joinCode: newJoinCode(),
    status: "draft" as const,
    consentText: DEFAULT_CONSENT_TEXT,
    settings: DEFAULT_SETTINGS,
  };
  const [created] = await db.insert(workshops).values(row).returning();
  return created;
}

export async function getWorkshopByJoinCode(code: string): Promise<Workshop | undefined> {
  return db.query.workshops.findFirst({ where: eq(workshops.joinCode, code) });
}

export async function getWorkshopById(id: string): Promise<Workshop | undefined> {
  return db.query.workshops.findFirst({ where: eq(workshops.id, id) });
}
