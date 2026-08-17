import { eq, desc, sql } from "drizzle-orm";
import { db } from "../client";
import { quizSubmissions, participants } from "../schema";
import { newId } from "@/lib/ids";
import type { QuizSubmissionRow } from "../schema";

export interface QuizSubmissionInput {
  workshopId: string;
  participantId: string;
  score: number;
  badgeTitle: string;
  badgeKey: string;
  timeTakenSeconds: number;
  responses: Array<{ qId: number; picked: number | null; correct: boolean }>;
}

let tableCreated = false;

async function ensureQuizTable() {
  if (tableCreated) return;
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS quiz_submissions (
        id TEXT PRIMARY KEY,
        workshop_id TEXT NOT NULL REFERENCES workshops(id),
        participant_id TEXT NOT NULL REFERENCES participants(id),
        score INTEGER NOT NULL,
        badge_title TEXT NOT NULL,
        badge_key TEXT NOT NULL,
        time_taken_seconds INTEGER NOT NULL,
        responses TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);
    tableCreated = true;
  } catch (err) {
    console.warn("ensureQuizTable warning:", err);
  }
}

export async function submitQuizResult(input: QuizSubmissionInput): Promise<QuizSubmissionRow> {
  await ensureQuizTable();
  const [created] = await db
    .insert(quizSubmissions)
    .values({
      id: newId(),
      workshopId: input.workshopId,
      participantId: input.participantId,
      score: input.score,
      badgeTitle: input.badgeTitle,
      badgeKey: input.badgeKey,
      timeTakenSeconds: input.timeTakenSeconds,
      responses: input.responses as unknown as Record<string, unknown>,
    })
    .returning();

  return created;
}

export async function getParticipantQuiz(participantId: string): Promise<QuizSubmissionRow | undefined> {
  await ensureQuizTable();
  try {
    return await db.query.quizSubmissions.findFirst({
      where: eq(quizSubmissions.participantId, participantId),
      orderBy: desc(quizSubmissions.createdAt),
    });
  } catch (err) {
    console.warn("getParticipantQuiz fallback:", err);
    return undefined;
  }
}

export async function listWorkshopQuizLeaderboard(workshopId: string) {
  await ensureQuizTable();
  try {
    const rows = await db
      .select({
        id: quizSubmissions.id,
        participantId: quizSubmissions.participantId,
        score: quizSubmissions.score,
        badgeTitle: quizSubmissions.badgeTitle,
        badgeKey: quizSubmissions.badgeKey,
        timeTakenSeconds: quizSubmissions.timeTakenSeconds,
        createdAt: quizSubmissions.createdAt,
        founderName: participants.founderName,
        startupName: participants.startupName,
      })
      .from(quizSubmissions)
      .innerJoin(participants, eq(quizSubmissions.participantId, participants.id))
      .where(eq(quizSubmissions.workshopId, workshopId))
      .orderBy(desc(quizSubmissions.score), desc(quizSubmissions.createdAt));

    return rows;
  } catch (err) {
    console.warn("listWorkshopQuizLeaderboard fallback:", err);
    return [];
  }
}

export async function resetWorkshopQuizSubmissions(workshopId: string): Promise<void> {
  await ensureQuizTable();
  try {
    await db.delete(quizSubmissions).where(eq(quizSubmissions.workshopId, workshopId));
  } catch (err) {
    console.warn("resetWorkshopQuizSubmissions warning:", err);
  }
}
