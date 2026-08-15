"use server";
import { cookies } from "next/headers";
import { createParticipant, completeParticipant } from "@/db/queries/participants";
import { saveResponse } from "@/db/queries/responses";
import { getWorkshopById } from "@/db/queries/workshops";
import type { SectionKey } from "@/db/schema";

const PID_COOKIE = "mrs_pid";
const MAX_FIELD_LENGTH = 200;
const MAX_ANSWER_LENGTH = 5000;

function requireNonEmpty(value: string, field: string, maxLength = MAX_FIELD_LENGTH): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`${field} is required`);
  if (trimmed.length > maxLength) throw new Error(`${field} is too long`);
  return trimmed;
}

export async function startParticipant(input: {
  workshopId: string; founderName: string; startupName: string; contact: string;
  sector?: string; stage?: string; teamSize?: string; productType?: string;
  businessModel?: string; consentFollowup?: boolean;
}): Promise<{ participantId: string }> {
  const workshop = await getWorkshopById(input.workshopId);
  if (!workshop || workshop.status === "closed") {
    throw new Error("Workshop is not accepting participants");
  }

  const founderName = requireNonEmpty(input.founderName, "founderName");
  const startupName = requireNonEmpty(input.startupName, "startupName");
  const contact = requireNonEmpty(input.contact, "contact");

  const p = await createParticipant({
    ...input,
    founderName,
    startupName,
    contact,
  });

  const cookieStore = await cookies();
  cookieStore.set(PID_COOKIE, p.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return { participantId: p.id };
}

async function assertOwnsParticipant(participantId: string): Promise<void> {
  const cookieStore = await cookies();
  const pid = cookieStore.get(PID_COOKIE)?.value;
  if (!pid || pid !== participantId) {
    throw new Error("Not authorized for this participant");
  }
}

export async function saveSectionAnswer(input: {
  participantId: string; section: SectionKey; mainAnswer: string;
}): Promise<void> {
  await assertOwnsParticipant(input.participantId);
  if (input.mainAnswer.length > MAX_ANSWER_LENGTH) {
    throw new Error("mainAnswer is too long");
  }
  await saveResponse(input);
}

export async function finishParticipant(participantId: string): Promise<void> {
  await assertOwnsParticipant(participantId);
  await completeParticipant(participantId);
}
