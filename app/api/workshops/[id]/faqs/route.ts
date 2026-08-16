import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { insertFaq } from "@/db/queries/chat";
import { assertOwnership } from "@/app/(admin)/workshops/[id]/ownership";

/**
 * Presenter adds a FAQ by hand (workshop-scoped, source "manual"). Combined
 * with the seed FAQs and the human_resolved answers harvested from the Chats
 * queue, this is the third way the knowledge base grows.
 */
export async function POST(
  request: Request,
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

  const body = (await request.json().catch(() => null)) as
    | { question?: string; answer?: string }
    | null;
  const question = body?.question?.trim();
  const answer = body?.answer?.trim();

  if (!question || !answer) {
    return NextResponse.json({ error: "question and answer are required" }, { status: 400 });
  }
  if (question.length > 500 || answer.length > 4000) {
    return NextResponse.json({ error: "question or answer is too long" }, { status: 400 });
  }

  await insertFaq({ workshopId: id, question, answer, source: "manual" });

  return NextResponse.json({ ok: true });
}
