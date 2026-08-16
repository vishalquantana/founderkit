import { getWorkshopByJoinCode, type WorkshopSettings } from "@/db/queries/workshops";
import { ParticipantWizard } from "@/components/participant/ParticipantWizard";
import { workshopJoinState } from "./join-state";
import { NotLive } from "./not-live";

export default async function WorkshopJoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const workshop = await getWorkshopByJoinCode(code);
  const state = workshopJoinState(workshop?.status);

  if (state === "missing" || state === "closed") {
    return <NotLive state={state} />;
  }

  return (
    <ParticipantWizard
      workshop={{
        id: workshop!.id,
        joinCode: workshop!.joinCode,
        name: workshop!.name,
        consentText: workshop!.consentText,
        probeEnabled: Boolean((workshop!.settings as WorkshopSettings | null)?.probeEnabled),
      }}
    />
  );
}
