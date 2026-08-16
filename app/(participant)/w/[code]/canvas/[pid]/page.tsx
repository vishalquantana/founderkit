import { notFound, redirect } from "next/navigation";
import { getWorkshopByJoinCode, type WorkshopSettings } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import { getResponses } from "@/db/queries/responses";
import { CanvasWizard } from "@/components/participant/CanvasWizard";
import { resultAccessState } from "../../result/result-guard";
import type { SectionKey } from "@/db/schema";

export default async function CanvasPage({
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

  const canvasUnlocked = Boolean((workshop!.settings as WorkshopSettings | null)?.canvasUnlocked);
  if (!canvasUnlocked) {
    redirect(`/w/${code}/home/${pid}`);
  }

  const responses = await getResponses(pid);
  const initialAnswers = responses.reduce((acc, response) => {
    acc[response.section as SectionKey] = response.mainAnswer;
    return acc;
  }, {} as Record<SectionKey, string>);

  return (
    <CanvasWizard
      workshop={{
        joinCode: workshop!.joinCode,
        probeEnabled: Boolean((workshop!.settings as WorkshopSettings | null)?.probeEnabled),
      }}
      participantId={pid}
      initialAnswers={initialAnswers}
    />
  );
}
