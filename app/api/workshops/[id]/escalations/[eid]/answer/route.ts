import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { answerEscalation, insertChatMessage, insertFaq } from "@/db/queries/chat";
import { assertOwnership } from "@/app/(admin)/workshops/[id]/ownership";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; eid: string }> },
): Promise<NextResponse> {
  const { id, eid } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  const workshop = await getWorkshopById(id);

  if (!workshop) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!assertOwnership(userId, workshop)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { presenterReply?: string } | null;
  const presenterReply = body?.presenterReply?.trim();
  if (!presenterReply) {
    return NextResponse.json({ error: "presenterReply is required" }, { status: 400 });
  }
  if (presenterReply.length > 4000) {
    return NextResponse.json({ error: "presenterReply is too long" }, { status: 400 });
  }

  // Flip the escalation to answered and learn who to deliver to.
  const { participantId, question } = await answerEscalation({
    escalationId: eid,
    presenterReply,
    answeredBy: userId!,
  });

  // Deliver the answer back to the founder (arrives on their next history poll)
  // AND grow the workshop FAQ so the next identical question is answered instantly.
  await Promise.all([
    insertChatMessage({
      participantId,
      role: "assistant",
      content: presenterReply,
      intent: "human_resolved",
      confidence: 100,
    }),
    insertFaq({
      workshopId: id,
      question,
      answer: presenterReply,
      source: "human_resolved",
    }),
  ]);

  return NextResponse.json({ ok: true });
}
