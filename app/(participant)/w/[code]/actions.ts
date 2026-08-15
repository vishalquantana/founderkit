"use server";
import { createParticipant, completeParticipant } from "@/db/queries/participants";
import { saveResponse } from "@/db/queries/responses";
import type { SectionKey } from "@/db/schema";

export async function startParticipant(input: {
  workshopId: string; founderName: string; startupName: string; contact: string;
  sector?: string; stage?: string; teamSize?: string; productType?: string;
  businessModel?: string; consentFollowup?: boolean;
}): Promise<{ participantId: string }> {
  const p = await createParticipant(input);
  return { participantId: p.id };
}

export async function saveSectionAnswer(input: {
  participantId: string; section: SectionKey; mainAnswer: string;
}): Promise<void> {
  await saveResponse(input);
}

export async function finishParticipant(participantId: string): Promise<void> {
  await completeParticipant(participantId);
}
