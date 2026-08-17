import { eq, count } from "drizzle-orm";
import { db } from "../client";
import { participants } from "../schema";
import { newId } from "@/lib/ids";

export type Participant = typeof participants.$inferSelect;

export async function createParticipant(input: {
  workshopId: string; founderName: string; startupName: string; contact: string;
  mobile?: string;
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

export async function updateParticipant(
  id: string,
  fields: Partial<Pick<Participant, "founderName" | "startupName" | "sector" | "stage" | "teamSize" | "productType" | "businessModel">>,
): Promise<void> {
  await db.update(participants).set(fields).where(eq(participants.id, id));
}

/**
 * Merge a single Lean Canvas "extra" block answer into the participant's
 * `canvasExtras` map. Empty text removes the key. Returns nothing.
 */
export async function updateCanvasExtra(
  id: string,
  blockKey: string,
  text: string,
): Promise<void> {
  const participant = await getParticipant(id);
  if (!participant) throw new Error("Participant not found");
  const current: Record<string, string> = { ...(participant.canvasExtras ?? {}) };
  const trimmed = text.trim();
  if (trimmed) {
    current[blockKey] = trimmed;
  } else {
    delete current[blockKey];
  }
  const next = Object.keys(current).length > 0 ? current : null;
  await db.update(participants).set({ canvasExtras: next }).where(eq(participants.id, id));
}

export async function completeParticipant(id: string): Promise<void> {
  await db.update(participants).set({ completedAt: new Date() }).where(eq(participants.id, id));
}

export async function markResultEmailed(id: string): Promise<void> {
  await db.update(participants).set({ resultEmailedAt: new Date() }).where(eq(participants.id, id));
}

export async function deleteParticipant(id: string): Promise<void> {
  const { responses, results, growthPlans, feedbackSubmissions, escalations, chatMessages } = await import("../schema");
  // Clean up dependent child tables first
  await db.delete(escalations).where(eq(escalations.participantId, id));
  await db.delete(chatMessages).where(eq(chatMessages.participantId, id));
  await db.delete(growthPlans).where(eq(growthPlans.participantId, id));
  await db.delete(feedbackSubmissions).where(eq(feedbackSubmissions.participantId, id));
  await db.delete(results).where(eq(results.participantId, id));
  await db.delete(responses).where(eq(responses.participantId, id));
  // Delete participant
  await db.delete(participants).where(eq(participants.id, id));
}

/**
 * Delete EVERY submission for a workshop — all participants and their
 * dependent rows across every child table — so the presenter can start the
 * room fresh. FK-safe order: children before parents. poll_votes.voter_id is
 * the participant id for signed-in founders.
 */
export async function deleteAllWorkshopSubmissions(workshopId: string): Promise<number> {
  const { inArray } = await import("drizzle-orm");
  const {
    responses, results, growthPlans, feedbackSubmissions, escalations,
    chatMessages, quizSubmissions, pollVotes,
  } = await import("../schema");

  const parts = await db
    .select({ id: participants.id })
    .from(participants)
    .where(eq(participants.workshopId, workshopId));
  const ids = parts.map((p) => p.id);
  if (ids.length === 0) return 0;

  await db.delete(escalations).where(inArray(escalations.participantId, ids));
  await db.delete(chatMessages).where(inArray(chatMessages.participantId, ids));
  await db.delete(quizSubmissions).where(inArray(quizSubmissions.participantId, ids));
  await db.delete(feedbackSubmissions).where(inArray(feedbackSubmissions.participantId, ids));
  await db.delete(growthPlans).where(inArray(growthPlans.participantId, ids));
  await db.delete(results).where(inArray(results.participantId, ids));
  await db.delete(responses).where(inArray(responses.participantId, ids));
  await db.delete(pollVotes).where(inArray(pollVotes.voterId, ids));
  await db.delete(participants).where(inArray(participants.id, ids));
  return ids.length;
}

export async function countByWorkshop(workshopId: string): Promise<number> {
  const [row] = await db.select({ n: count() }).from(participants)
    .where(eq(participants.workshopId, workshopId));
  return row?.n ?? 0;
}
