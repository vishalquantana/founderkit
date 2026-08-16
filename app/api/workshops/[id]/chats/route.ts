import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { getOpenEscalations, getWorkshopConversations } from "@/db/queries/chat";
import { assertOwnership } from "@/app/(admin)/workshops/[id]/ownership";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const session = await auth();
  const workshop = await getWorkshopById(id);

  if (!workshop) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!assertOwnership(session?.user?.id, workshop)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [escalations, conversations] = await Promise.all([
    getOpenEscalations(id),
    getWorkshopConversations(id),
  ]);

  return NextResponse.json({
    escalations: escalations.map((e) => ({
      id: e.id,
      participantId: e.participantId,
      question: e.question,
      createdAt: e.createdAt,
    })),
    conversations: conversations.map((c) => ({
      participant: c.participant,
      messages: c.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        flagged: m.flagged,
        createdAt: m.createdAt,
      })),
    })),
  });
}
