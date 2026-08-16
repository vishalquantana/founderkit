import { eq, and, ne, inArray } from "drizzle-orm";
import { db } from "../client";
import { polls, pollVotes } from "../schema";
import { newId } from "@/lib/ids";
import type { Poll } from "../schema";

export type { Poll };

export async function createPoll(input: {
  workshopId: string;
  question: string;
  options: string[];
  position: number;
}): Promise<Poll> {
  const [created] = await db
    .insert(polls)
    .values({
      id: newId(),
      workshopId: input.workshopId,
      question: input.question,
      options: input.options,
      position: input.position,
      status: "draft" as const,
    })
    .returning();
  return created;
}

export async function updatePoll(input: {
  pollId: string;
  question: string;
  options: string[];
}): Promise<void> {
  await db
    .update(polls)
    .set({ question: input.question, options: input.options })
    .where(eq(polls.id, input.pollId));
}

export async function deletePoll(pollId: string): Promise<void> {
  await db.delete(pollVotes).where(eq(pollVotes.pollId, pollId));
  await db.delete(polls).where(eq(polls.id, pollId));
}

/** Delete all votes for a poll, resetting its tally to zero without deleting the poll itself. */
export async function deletePollVotes(pollId: string): Promise<void> {
  await db.delete(pollVotes).where(eq(pollVotes.pollId, pollId));
}

/** Delete all votes across every poll in a workshop, resetting every tally to zero. */
export async function deleteAllPollVotes(workshopId: string): Promise<void> {
  const workshopPolls = await listPolls(workshopId);
  if (workshopPolls.length === 0) return;

  await db.delete(pollVotes).where(
    inArray(
      pollVotes.pollId,
      workshopPolls.map((p) => p.id),
    ),
  );
}

export async function getPoll(pollId: string): Promise<Poll | undefined> {
  return db.query.polls.findFirst({ where: eq(polls.id, pollId) });
}

export async function listPolls(workshopId: string): Promise<Poll[]> {
  return db.query.polls.findMany({
    where: eq(polls.workshopId, workshopId),
    orderBy: (p, { asc }) => [asc(p.position), asc(p.createdAt)],
  });
}

export async function getActivePoll(workshopId: string): Promise<Poll | undefined> {
  return db.query.polls.findFirst({
    where: and(eq(polls.workshopId, workshopId), eq(polls.status, "active")),
  });
}

export async function activatePoll(pollId: string): Promise<void> {
  const poll = await db.query.polls.findFirst({ where: eq(polls.id, pollId) });
  if (!poll) return;

  await db
    .update(polls)
    .set({ status: "closed" })
    .where(
      and(
        eq(polls.workshopId, poll.workshopId),
        eq(polls.status, "active"),
        ne(polls.id, pollId),
      ),
    );

  await db.update(polls).set({ status: "active" }).where(eq(polls.id, pollId));
}

export async function closePoll(pollId: string): Promise<void> {
  await db.update(polls).set({ status: "closed" }).where(eq(polls.id, pollId));
}

export async function castVote(input: {
  pollId: string;
  voterId: string;
  choiceIndex: number;
}): Promise<void> {
  await db
    .insert(pollVotes)
    .values({
      id: newId(),
      pollId: input.pollId,
      voterId: input.voterId,
      choiceIndex: input.choiceIndex,
    })
    .onConflictDoUpdate({
      target: [pollVotes.pollId, pollVotes.voterId],
      set: { choiceIndex: input.choiceIndex },
    });
}

/** Bucket raw choice indices into per-option counts for `optionCount` options. */
export function tallyVotes(
  choiceIndices: number[],
  optionCount: number,
): { counts: number[]; total: number } {
  const counts = new Array(optionCount).fill(0);
  let total = 0;
  for (const i of choiceIndices) {
    if (i >= 0 && i < optionCount) {
      counts[i] += 1;
      total += 1;
    }
  }
  return { counts, total };
}

export async function getPollTally(pollId: string): Promise<{ counts: number[]; total: number }> {
  const poll = await getPoll(pollId);
  if (!poll) return { counts: [], total: 0 };

  const options = poll.options as string[];
  const votes = await db.query.pollVotes.findMany({ where: eq(pollVotes.pollId, pollId) });
  return tallyVotes(votes.map((v) => v.choiceIndex), options.length);
}
