import { NextResponse } from "next/server";
import { getPoll, castVote } from "@/db/queries/polls";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { choiceIndex, voterId } = (body ?? {}) as {
    choiceIndex?: unknown;
    voterId?: unknown;
  };

  if (
    typeof choiceIndex !== "number" ||
    !Number.isInteger(choiceIndex) ||
    choiceIndex < 0
  ) {
    return NextResponse.json({ error: "invalid choiceIndex" }, { status: 400 });
  }

  if (typeof voterId !== "string" || voterId.length === 0) {
    return NextResponse.json({ error: "invalid voterId" }, { status: 400 });
  }

  const poll = await getPoll(id);
  if (!poll || poll.status !== "active") {
    return NextResponse.json({ error: "poll not active" }, { status: 409 });
  }

  await castVote({ pollId: id, voterId, choiceIndex });

  return NextResponse.json({ ok: true });
}
