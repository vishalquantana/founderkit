import { eq } from "drizzle-orm";
import { db } from "../client";
import { feedbackSubmissions, participants } from "../schema";
import { newId } from "@/lib/ids";

export type FeedbackSubmission = typeof feedbackSubmissions.$inferSelect;

export async function getFeedbackSubmission(participantId: string): Promise<FeedbackSubmission | undefined> {
  return db.query.feedbackSubmissions.findFirst({
    where: eq(feedbackSubmissions.participantId, participantId),
  });
}

export async function submitFeedback(input: {
  participantId: string;
  q1Usefulness: string;
  q2MostValuable: string;
  q3IdentifiedAssumptions: string;
  q4AiToolUsefulness: string;
  q5Next7DaysAction: string;
  q6Suggestions?: string;
  q7FollowupInterest: string;
  q7ContactInfo?: string;
}): Promise<FeedbackSubmission> {
  const [created] = await db
    .insert(feedbackSubmissions)
    .values({
      id: newId(),
      ...input,
      q6Suggestions: input.q6Suggestions?.trim() || null,
      q7ContactInfo: input.q7ContactInfo?.trim() || null,
    })
    .onConflictDoUpdate({
      target: feedbackSubmissions.participantId,
      set: {
        q1Usefulness: input.q1Usefulness,
        q2MostValuable: input.q2MostValuable,
        q3IdentifiedAssumptions: input.q3IdentifiedAssumptions,
        q4AiToolUsefulness: input.q4AiToolUsefulness,
        q5Next7DaysAction: input.q5Next7DaysAction,
        q6Suggestions: input.q6Suggestions?.trim() || null,
        q7FollowupInterest: input.q7FollowupInterest,
        q7ContactInfo: input.q7ContactInfo?.trim() || null,
      },
    })
    .returning();

  return created;
}

export async function listWorkshopFeedbackSubmissions(workshopId: string) {
  const rows = await db
    .select({
      id: feedbackSubmissions.id,
      participantId: feedbackSubmissions.participantId,
      q1Usefulness: feedbackSubmissions.q1Usefulness,
      q2MostValuable: feedbackSubmissions.q2MostValuable,
      q3IdentifiedAssumptions: feedbackSubmissions.q3IdentifiedAssumptions,
      q4AiToolUsefulness: feedbackSubmissions.q4AiToolUsefulness,
      q5Next7DaysAction: feedbackSubmissions.q5Next7DaysAction,
      q6Suggestions: feedbackSubmissions.q6Suggestions,
      q7FollowupInterest: feedbackSubmissions.q7FollowupInterest,
      q7ContactInfo: feedbackSubmissions.q7ContactInfo,
      createdAt: feedbackSubmissions.createdAt,
      founderName: participants.founderName,
      startupName: participants.startupName,
      contact: participants.contact,
      mobile: participants.mobile,
    })
    .from(feedbackSubmissions)
    .innerJoin(participants, eq(feedbackSubmissions.participantId, participants.id))
    .where(eq(participants.workshopId, workshopId))
    .orderBy(feedbackSubmissions.createdAt);

  return rows;
}
