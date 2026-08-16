import { eq, desc } from "drizzle-orm";
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

export async function submitQuizResult(input: QuizSubmissionInput): Promise<QuizSubmissionRow> {
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
  return db.query.quizSubmissions.findFirst({
    where: eq(quizSubmissions.participantId, participantId),
    orderBy: desc(quizSubmissions.createdAt),
  });
}

export async function listWorkshopQuizLeaderboard(workshopId: string) {
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
}
