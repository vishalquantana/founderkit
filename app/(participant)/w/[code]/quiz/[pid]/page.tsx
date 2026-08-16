import { notFound } from "next/navigation";
import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import { getParticipantQuiz } from "@/db/queries/quiz";
import { buildQuizQuestions } from "@/lib/quiz";
import { LiveQuizChallenge } from "@/components/participant/LiveQuizChallenge";

export default async function ParticipantQuizPage({
  params,
}: {
  params: Promise<{ code: string; pid: string }>;
}) {
  const { code, pid } = await params;
  const workshop = await getWorkshopByJoinCode(code);
  if (!workshop) notFound();

  const participant = await getParticipant(pid);
  if (!participant || participant.workshopId !== workshop.id) notFound();

  const existing = await getParticipantQuiz(pid);
  const initialQuestions = buildQuizQuestions();

  return (
    <LiveQuizChallenge
      code={code}
      pid={pid}
      founderName={participant.founderName}
      startupName={participant.startupName}
      initialQuestions={initialQuestions}
      initialSubmission={
        existing
          ? {
              score: existing.score,
              badgeTitle: existing.badgeTitle,
              badgeKey: existing.badgeKey,
            }
          : null
      }
    />
  );
}
