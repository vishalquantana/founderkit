import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { getWorkshopFaqs, insertFaq, updateFaq, deleteFaq } from "@/db/queries/chat";
import { GROWTH_FAQ_SEED } from "@/ai/persona";
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

  const dbFaqs = await getWorkshopFaqs(id);

  return NextResponse.json({
    seedFaqs: GROWTH_FAQ_SEED,
    workshopFaqs: dbFaqs,
  });
}

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

  const body = (await request.json().catch(() => null)) as {
    action?: "create" | "update" | "delete";
    id?: string;
    question?: string;
    answer?: string;
    topic?: string;
  } | null;

  if (body?.action === "delete" && body.id) {
    await deleteFaq(body.id);
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "update" && body.id && body.question && body.answer) {
    await updateFaq({
      id: body.id,
      question: body.question.trim(),
      answer: body.answer.trim(),
      topic: body.topic?.trim(),
    });
    return NextResponse.json({ ok: true });
  }

  const question = body?.question?.trim();
  const answer = body?.answer?.trim();

  if (!question || !answer) {
    return NextResponse.json({ error: "question and answer are required" }, { status: 400 });
  }
  if (question.length > 500 || answer.length > 4000) {
    return NextResponse.json({ error: "question or answer is too long" }, { status: 400 });
  }

  await insertFaq({
    workshopId: id,
    question,
    answer,
    source: "manual",
    topic: body?.topic?.trim(),
  });

  return NextResponse.json({ ok: true });
}
