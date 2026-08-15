import { eq, count } from "drizzle-orm";
import { db } from "../client";
import { participants } from "../schema";
import { newId } from "@/lib/ids";

export type Participant = typeof participants.$inferSelect;

export async function createParticipant(input: {
  workshopId: string; founderName: string; startupName: string; contact: string;
  sector?: string; stage?: string; teamSize?: string; productType?: string;
  businessModel?: string; consentFollowup?: boolean;
}): Promise<Participant> {
  const [created] = await db.insert(participants)
    .values({ id: newId(), ...input, consentFollowup: input.consentFollowup ?? false })
    .returning();
  return created;
}

export async function getParticipant(id: string): Promise<Participant | undefined> {
  return db.query.participants.findFirst({ where: eq(participants.id, id) });
}

export async function completeParticipant(id: string): Promise<void> {
  await db.update(participants).set({ completedAt: new Date() }).where(eq(participants.id, id));
}

export async function countByWorkshop(workshopId: string): Promise<number> {
  const [row] = await db.select({ n: count() }).from(participants)
    .where(eq(participants.workshopId, workshopId));
  return row?.n ?? 0;
}
