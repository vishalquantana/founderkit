"use server";
import { cookies } from "next/headers";
import { createParticipant, completeParticipant, updateParticipant, updateCanvasExtra } from "@/db/queries/participants";
import { saveResponse } from "@/db/queries/responses";
import { getWorkshopById } from "@/db/queries/workshops";
import { maybeEmailResult } from "@/email/send-result";
import { probeSection } from "@/ai/probe";
import { evaluateParticipant } from "@/ai/evaluate";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function startParticipant(input: {
  workshopId: string; founderName: string; startupName: string; contact: string;
  mobile?: string;
  sector?: string; stage?: string; teamSize?: string; productType?: string;
  businessModel?: string; consentFollowup?: boolean;
}): Promise<{ participantId: string }> {
  const workshop = await getWorkshopById(input.workshopId);
  if (!workshop || workshop.status === "closed") {
    throw new Error("Workshop is not accepting participants");
  }

  const founderName = requireNonEmpty(input.founderName, "founderName");
  const startupName = requireNonEmpty(input.startupName, "startupName");
  const contact = requireNonEmpty(input.contact, "email"); // email is required
  if (!EMAIL_RE.test(contact)) throw new Error("A valid email is required");
  const mobile = input.mobile?.trim()
    ? requireNonEmpty(input.mobile, "mobile", 40)
    : undefined;

  const p = await createParticipant({
    ...input,
    founderName,
    startupName,
    contact,
    mobile,
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
  probeQuestion?: string | null; probeAnswer?: string | null;
}): Promise<void> {
  await assertOwnsParticipant(input.participantId);
  if (input.mainAnswer.length > MAX_ANSWER_LENGTH) {
    throw new Error("mainAnswer is too long");
  }
  await saveResponse(input);
}

export async function saveCanvasBlock(input: {
  participantId: string; blockKey: string; text: string;
}): Promise<void> {
  await assertOwnsParticipant(input.participantId);
  if (!input.blockKey?.trim()) throw new Error("blockKey is required");
  if (input.text.length > MAX_ANSWER_LENGTH) {
    throw new Error("text is too long");
  }
  await updateCanvasExtra(input.participantId, input.blockKey, input.text);
}

export async function probeSectionAction(input: {
  section: SectionKey; mainAnswer: string; probeEnabled: boolean;
}): Promise<{ question: string | null }> {
  if (!input.probeEnabled) return { question: null };
  try {
    const r = await probeSection({ section: input.section, mainAnswer: input.mainAnswer });
    return { question: r.needsProbe ? r.question : null };
  } catch {
    return { question: null };
  }
}

export async function finishParticipant(participantId: string): Promise<void> {
  await assertOwnsParticipant(participantId);
  await completeParticipant(participantId);
  await maybeEmailResult(participantId).catch(() => {});
}

export async function reevaluateParticipant(participantId: string): Promise<void> {
  await assertOwnsParticipant(participantId);
  await evaluateParticipant(participantId); // re-reads responses, regenerates result, upserts via saveResult
}

export async function updateParticipantProfile(input: {
  participantId: string;
  founderName: string;
  startupName: string;
  sector?: string;
  stage?: string;
  teamSize?: string;
  productType?: string;
  businessModel?: string;
}): Promise<void> {
  await assertOwnsParticipant(input.participantId);
  const founderName = requireNonEmpty(input.founderName, "founderName");
  const startupName = requireNonEmpty(input.startupName, "startupName");
  await updateParticipant(input.participantId, {
    founderName,
    startupName,
    sector: input.sector?.trim() || null,
    stage: input.stage?.trim() || null,
    teamSize: input.teamSize?.trim() || null,
    productType: input.productType?.trim() || null,
    businessModel: input.businessModel?.trim() || null,
  });
}
