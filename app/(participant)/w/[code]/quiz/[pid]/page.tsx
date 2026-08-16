import { notFound } from "next/navigation";
import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
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

  return (
    <LiveQuizChallenge
      code={code}
      pid={pid}
      founderName={participant.founderName}
      startupName={participant.startupName}
    />
  );
}
