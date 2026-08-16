import { NextResponse } from "next/server";
import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { getActivePoll } from "@/db/queries/polls";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  const { code } = await params;
  const workshop = await getWorkshopByJoinCode(code);

  if (!workshop) {
    return NextResponse.json({ poll: null });
  }

  const poll = await getActivePoll(workshop.id);

  return NextResponse.json({
    poll: poll ? { id: poll.id, question: poll.question, options: poll.options } : null,
  });
}
