"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import {
  createPoll,
  updatePoll,
  deletePoll,
  activatePoll,
  closePoll,
  listPolls,
  deletePollVotes,
  deleteAllPollVotes,
} from "@/db/queries/polls";
import { assertOwnership } from "./ownership";

async function assertWorkshopAccess(id: string): Promise<void> {
  const session = await auth();
  const workshop = await getWorkshopById(id);
  if (!assertOwnership(session?.user?.id, workshop)) {
    throw new Error("Not authorized to update this workshop.");
  }
}

export async function createPollAction(
  id: string,
  question: string,
  options: string[],
): Promise<void> {
  await assertWorkshopAccess(id);

  const existing = await listPolls(id);
  await createPoll({
    workshopId: id,
    question,
    options,
    position: existing.length + 1,
  });
  revalidatePath(`/workshops/${id}`);
}

export async function updatePollAction(
  id: string,
  pollId: string,
  question: string,
  options: string[],
): Promise<void> {
  await assertWorkshopAccess(id);

  await updatePoll({ pollId, question, options });
  revalidatePath(`/workshops/${id}`);
}

export async function deletePollAction(id: string, pollId: string): Promise<void> {
  await assertWorkshopAccess(id);

  await deletePoll(pollId);
  revalidatePath(`/workshops/${id}`);
}

export async function activatePollAction(id: string, pollId: string): Promise<void> {
  await assertWorkshopAccess(id);

  await activatePoll(pollId);
  revalidatePath(`/workshops/${id}`);
}

export async function closePollAction(id: string, pollId: string): Promise<void> {
  await assertWorkshopAccess(id);

  await closePoll(pollId);
  revalidatePath(`/workshops/${id}`);
}

export async function resetPollVotesAction(id: string, pollId: string): Promise<void> {
  await assertWorkshopAccess(id);

  await deletePollVotes(pollId);
  revalidatePath(`/workshops/${id}`);
}

export async function resetAllPollsAction(id: string): Promise<void> {
  await assertWorkshopAccess(id);

  await deleteAllPollVotes(id);
  revalidatePath(`/workshops/${id}`);
}
