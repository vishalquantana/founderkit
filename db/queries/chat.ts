import { eq, and, or, isNull, sql } from "drizzle-orm";
import { db } from "../client";
import { chatMessages, faqs, escalations, participants } from "../schema";
import { newId } from "@/lib/ids";
import type { ChatMessageRow, FaqRow, EscalationRow } from "../schema";

export type { ChatMessageRow, FaqRow, EscalationRow };

export async function insertChatMessage(input: {
  participantId: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: number;
  flagged?: boolean;
  escalationId?: string;
}): Promise<{ id: string }> {
  const id = newId();
  await db.insert(chatMessages).values({
    id,
    participantId: input.participantId,
    role: input.role,
    content: input.content,
    intent: input.intent,
    confidence: input.confidence,
    flagged: input.flagged ?? false,
    escalationId: input.escalationId,
  });
  return { id };
}

export async function getMessages(participantId: string): Promise<ChatMessageRow[]> {
  return db.query.chatMessages.findMany({
    where: eq(chatMessages.participantId, participantId),
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  });
}

export async function getWorkshopFaqs(workshopId: string): Promise<FaqRow[]> {
  return db.query.faqs.findMany({
    where: or(eq(faqs.workshopId, workshopId), isNull(faqs.workshopId)),
  });
}

export async function insertFaq(input: {
  workshopId: string | null;
  question: string;
  answer: string;
  source: "seed" | "manual" | "human_resolved";
  topic?: string;
}): Promise<{ id: string }> {
  const id = newId();
  await db
    .insert(faqs)
    .values({
      id,
      workshopId: input.workshopId,
      question: input.question,
      answer: input.answer,
      source: input.source,
      topic: input.topic,
    })
    .onConflictDoNothing();
  return { id };
}

export async function countFaqs(workshopId: string | null): Promise<number> {
  const where =
    workshopId === null ? isNull(faqs.workshopId) : eq(faqs.workshopId, workshopId);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(faqs)
    .where(where);
  return row?.count ?? 0;
}

export async function createEscalation(input: {
  workshopId: string;
  participantId: string;
  questionMessageId: string;
  question: string;
}): Promise<{ id: string }> {
  const id = newId();
  await db.insert(escalations).values({
    id,
    workshopId: input.workshopId,
    participantId: input.participantId,
    questionMessageId: input.questionMessageId,
    question: input.question,
    status: "open" as const,
  });
  return { id };
}

export async function getOpenEscalations(workshopId: string): Promise<EscalationRow[]> {
  return db.query.escalations.findMany({
    where: and(eq(escalations.workshopId, workshopId), eq(escalations.status, "open")),
    orderBy: (e, { asc }) => [asc(e.createdAt)],
  });
}

export async function getEscalation(escalationId: string): Promise<EscalationRow | undefined> {
  return db.query.escalations.findFirst({ where: eq(escalations.id, escalationId) });
}

export async function answerEscalation(input: {
  escalationId: string;
  presenterReply: string;
  answeredBy: string;
}): Promise<{ participantId: string; question: string }> {
  const row = await db.query.escalations.findFirst({
    where: eq(escalations.id, input.escalationId),
  });
  if (!row) throw new Error(`Escalation not found: ${input.escalationId}`);

  await db
    .update(escalations)
    .set({
      status: "answered",
      presenterReply: input.presenterReply,
      answeredBy: input.answeredBy,
      answeredAt: new Date(),
    })
    .where(eq(escalations.id, input.escalationId));

  return { participantId: row.participantId, question: row.question };
}

export async function getWorkshopConversations(
  workshopId: string,
): Promise<{ participant: { id: string; founderName: string; startupName: string }; messages: ChatMessageRow[] }[]> {
  const rows = await db.query.participants.findMany({
    where: eq(participants.workshopId, workshopId),
  });

  const conversations = await Promise.all(
    rows.map(async (p) => {
      const messages = await getMessages(p.id);
      return {
        participant: { id: p.id, founderName: p.founderName, startupName: p.startupName },
        messages,
      };
    }),
  );

  return conversations.filter((c) => c.messages.length > 0);
}

export async function lockParticipant(participantId: string): Promise<void> {
  await db
    .update(participants)
    .set({ lockedAt: new Date() })
    .where(eq(participants.id, participantId));
}

export async function unlockParticipant(participantId: string): Promise<void> {
  await db
    .update(participants)
    .set({ lockedAt: null })
    .where(eq(participants.id, participantId));
}

export async function isParticipantLocked(participantId: string): Promise<boolean> {
  const row = await db.query.participants.findFirst({
    where: eq(participants.id, participantId),
    columns: { lockedAt: true },
  });
  return !!row?.lockedAt;
}
