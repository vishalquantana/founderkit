import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { getPoll, getPollTally } from "@/db/queries/polls";
import { assertOwnership } from "@/app/(admin)/workshops/[id]/ownership";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const session = await auth();

  const poll = await getPoll(id);

  if (!poll) {
    return NextResponse.json({ poll: null, tally: null });
  }

  const workshop = await getWorkshopById(poll.workshopId);

  if (!workshop) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!assertOwnership(session?.user?.id, workshop)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tally = await getPollTally(poll.id);

  return NextResponse.json({
    poll: { id: poll.id, question: poll.question, options: poll.options },
    tally,
  });
}
