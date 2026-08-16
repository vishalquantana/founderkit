import { notFound } from "next/navigation";
import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import { FounderPolls } from "@/components/participant/FounderPolls";
import { resultAccessState } from "../../result/result-guard";

export default async function FounderPollsPage({
  params,
}: {
  params: Promise<{ code: string; pid: string }>;
}) {
  const { code, pid } = await params;
  const workshop = await getWorkshopByJoinCode(code);
  const participant = await getParticipant(pid);

  const state = resultAccessState({
    participant: participant ? { id: participant.id, workshopId: participant.workshopId } : undefined,
    workshopId: workshop?.id,
  });

  if (state === "missing") {
    notFound();
  }

  return <FounderPolls code={code} participantId={pid} />;
}
