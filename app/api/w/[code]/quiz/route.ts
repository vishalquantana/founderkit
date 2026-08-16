import { NextResponse } from "next/server";
import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import { submitQuizResult, getParticipantQuiz } from "@/db/queries/quiz";
import { buildQuizQuestions } from "@/lib/quiz";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const workshop = await getWorkshopByJoinCode(code);
  if (!workshop) return NextResponse.json({ error: "Workshop not found" }, { status: 404 });

  const url = new URL(request.url);
  const pid = url.searchParams.get("pid");

  const existing = pid ? await getParticipantQuiz(pid) : null;
  const questions = buildQuizQuestions();

  return NextResponse.json({
    questions,
    submission: existing ?? null,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const workshop = await getWorkshopByJoinCode(code);
  if (!workshop) return NextResponse.json({ error: "Workshop not found" }, { status: 404 });

  try {
    const body = await request.json();
    const { participantId, score, badgeTitle, badgeKey, timeTakenSeconds, responses } = body;

    const participant = await getParticipant(participantId);
    if (!participant || participant.workshopId !== workshop.id) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const created = await submitQuizResult({
      workshopId: workshop.id,
      participantId,
      score: Number(score) || 0,
      badgeTitle: String(badgeTitle || "DCP"),
      badgeKey: String(badgeKey || "dcp"),
      timeTakenSeconds: Number(timeTakenSeconds) || 60,
      responses: responses || [],
    });

    return NextResponse.json({ ok: true, result: created });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
