import { notFound } from "next/navigation";
import { getWorkshopByJoinCode, type WorkshopSettings } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import { getResult } from "@/db/queries/results";
import { FounderPolls } from "@/components/participant/FounderPolls";
import { FounderTabBar } from "@/components/participant/FounderTabBar";
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

  const settings = (workshop?.settings as WorkshopSettings | null) ?? null;
  const canvasUnlocked = Boolean(settings?.canvasUnlocked);
  const result = await getResult(pid);
  const hasResult = result != null;

  return (
    <>
      <FounderPolls code={code} participantId={pid} />
      <FounderTabBar code={code} pid={pid} active="polls" canvasUnlocked={canvasUnlocked} hasResult={hasResult} />
    </>
  );
}
