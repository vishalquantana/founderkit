import { cookies } from "next/headers";
import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import {
  insertChatMessage,
  getWorkshopFaqs,
  insertFaq,
  countFaqs,
  createEscalation,
  lockParticipant,
  unlockParticipant,
  isParticipantLocked,
  getRecentMessages,
} from "@/db/queries/chat";
import { classifyGuard, ABUSE_REPLY, INJECTION_REPLY, IDENTITY_REPLY } from "@/ai/guards";
import { findBestFaqMatch } from "@/ai/faq-match";
import { estimateConfidence, LOW_CONFIDENCE } from "@/ai/confidence";
import { GROWTH_FAQ_SEED } from "@/ai/persona";
import { notifyEscalation } from "@/lib/slack";
import { sendSlackErrorAlert } from "@/lib/slack-logger";
import { answerAsVamshi } from "@/ai/chat";
import { buildFounderContext } from "@/ai/chat-context";

const PID_COOKIE = "mrs_pid";
const MAX_MESSAGE_LENGTH = 2000;
const FALLBACK_REPLY = "Let me check with the team and get back to you.";
const HISTORY_TURNS_FOR_LLM = 8;

export interface ChatTurnResponse {
  reply: string;
  flagged: boolean;
  locked: boolean;
}

async function assertOwnsParticipant(participantId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const pid = cookieStore.get(PID_COOKIE)?.value;
  if (!pid && participantId) {
    cookieStore.set(PID_COOKIE, participantId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return true;
  }
  return pid === participantId;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await params;

  let body: { participantId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { participantId, message } = body;
  if (!participantId || typeof message !== "string") {
    await sendSlackErrorAlert({
      source: "backend",
      error: "participantId and message are required",
      context: { api: "/api/w/[code]/chat", body },
    });
    return Response.json({ error: "participantId and message are required" }, { status: 400 });
  }

  const trimmed = message.trim();
  if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) {
    await sendSlackErrorAlert({
      source: "backend",
      error: "message must be between 1 and 2000 characters",
      context: { api: "/api/w/[code]/chat", participantId, length: trimmed.length },
    });
    return Response.json({ error: "message must be between 1 and 2000 characters" }, { status: 400 });
  }

  const authorized = await assertOwnsParticipant(participantId);
  if (!authorized) {
    await sendSlackErrorAlert({
      source: "backend",
      error: "Not authorized for this participant",
      context: { api: "/api/w/[code]/chat", participantId },
    });
    return Response.json({ error: "Not authorized for this participant" }, { status: 403 });
  }

  const workshop = await getWorkshopByJoinCode(code);
  if (!workshop) {
    await sendSlackErrorAlert({
      source: "backend",
      error: "Workshop not found",
      context: { api: "/api/w/[code]/chat", code },
    });
    return Response.json({ error: "Workshop not found" }, { status: 404 });
  }

  const participant = await getParticipant(participantId);
  if (!participant || participant.workshopId !== workshop.id) {
    await sendSlackErrorAlert({
      source: "backend",
      error: "Participant not found for this workshop",
      context: { api: "/api/w/[code]/chat", participantId, workshopId: workshop.id },
    });
    return Response.json({ error: "Participant not found for this workshop" }, { status: 404 });
  }

  const guard = classifyGuard(trimmed);

  // Locked check comes after the unlock-keyword classification so a locked
  // participant can still escape lockout, but before any other processing.
  const locked = await isParticipantLocked(participantId);
  if (locked && guard !== "unlock") {
    const data: ChatTurnResponse = { reply: "", flagged: false, locked: true };
    return Response.json(data);
  }

  if (guard === "unlock") {
    await unlockParticipant(participantId);
    const reply = "You're back in. How can I help?";
    await insertChatMessage({ participantId, role: "assistant", content: reply });
    const data: ChatTurnResponse = { reply, flagged: false, locked: false };
    return Response.json(data);
  }

  if (guard === "abuse") {
    await insertChatMessage({ participantId, role: "user", content: trimmed });
    await lockParticipant(participantId);
    await insertChatMessage({ participantId, role: "assistant", content: ABUSE_REPLY, flagged: true });
    const data: ChatTurnResponse = { reply: ABUSE_REPLY, flagged: true, locked: true };
    return Response.json(data);
  }

  if (guard === "injection" || guard === "identity") {
    const reply = guard === "injection" ? INJECTION_REPLY : IDENTITY_REPLY;
    await insertChatMessage({ participantId, role: "user", content: trimmed });
    await insertChatMessage({
      participantId,
      role: "assistant",
      content: reply,
      intent: guard,
    });
    const data: ChatTurnResponse = { reply, flagged: false, locked: false };
    return Response.json(data);
  }

  // Ensure the global seed FAQs exist. Re-seed whenever the seed list has
  // grown (e.g. after a deploy that adds deck-derived FAQs) — insertFaq uses
  // onConflictDoNothing against the partial unique index on (question) where
  // workshop_id IS NULL, so re-running is idempotent and won't duplicate rows.
  if ((await countFaqs(null)) < GROWTH_FAQ_SEED.length) {
    for (const faq of GROWTH_FAQ_SEED) {
      await insertFaq({
        workshopId: null,
        question: faq.question,
        answer: faq.answer,
        source: "seed",
        topic: faq.topic,
      });
    }
  }

  const workshopFaqs = await getWorkshopFaqs(workshop.id);
  const faqMatch = findBestFaqMatch(trimmed, workshopFaqs);

  if (faqMatch) {
    await insertChatMessage({ participantId, role: "user", content: trimmed });
    await insertChatMessage({
      participantId,
      role: "assistant",
      content: faqMatch.faq.answer,
      confidence: 95,
      intent: "faq",
    });
    const data: ChatTurnResponse = { reply: faqMatch.faq.answer, flagged: false, locked: false };
    return Response.json(data);
  }

  // Create an escalation and fire a best-effort Slack ping with a click-to-reply
  // link. The Slack post never blocks the response and never throws.
  async function escalate(questionMessageId: string, question: string): Promise<void> {
    const esc = await createEscalation({
      workshopId: workshop!.id,
      participantId: participantId!,
      questionMessageId,
      question,
    });
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
    const replyUrl = `${base}/workshops/${workshop!.id}/chats/${esc.id}`;
    void notifyEscalation({
      question,
      founderName: participant?.founderName,
      startupName: participant?.startupName,
      replyUrl,
    });
  }

  let reply: string;
  let flagged: boolean;
  try {
    const context = await buildFounderContext(participantId, participant);
    const history = (await getRecentMessages(participantId, HISTORY_TURNS_FOR_LLM))
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    reply = await answerAsVamshi({ message: trimmed, context, history });
    const confidence = estimateConfidence(reply);
    flagged = confidence < LOW_CONFIDENCE;

    const userMsg = await insertChatMessage({ participantId, role: "user", content: trimmed });
    await insertChatMessage({
      participantId,
      role: "assistant",
      content: reply,
      confidence: Math.round(confidence * 100),
      flagged,
    });

    if (flagged) {
      await escalate(userMsg.id, trimmed);
    }
  } catch (err) {
    console.error("Vamshi.AI chat generation error:", err);
    await sendSlackErrorAlert({
      source: "backend",
      error: err,
      context: { api: "/api/w/[code]/chat", participantId, message: trimmed },
    });
    reply = FALLBACK_REPLY;
    flagged = true;
    const userMsg = await insertChatMessage({ participantId, role: "user", content: trimmed });
    await insertChatMessage({
      participantId,
      role: "assistant",
      content: reply,
      flagged: true,
    });
    await escalate(userMsg.id, trimmed);
  }

  const data: ChatTurnResponse = { reply, flagged, locked: false };
  return Response.json(data);
}
