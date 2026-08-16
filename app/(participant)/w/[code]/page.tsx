import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getWorkshopByJoinCode, type WorkshopSettings } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import { getActivePoll } from "@/db/queries/polls";
import { ParticipantWizard } from "@/components/participant/ParticipantWizard";
import { workshopJoinState } from "./join-state";
import { NotLive } from "./not-live";

const PID_COOKIE = "mrs_pid";

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

  const cookieStore = await cookies();
  const pid = cookieStore.get(PID_COOKIE)?.value;
  if (pid) {
    const participant = await getParticipant(pid);
    if (participant && participant.workshopId === workshop!.id) {
      const activePoll = await getActivePoll(workshop!.id);
      if (activePoll) {
        redirect(`/w/${code}/polls/${pid}`);
      }
      redirect(`/w/${code}/home/${pid}`);
    }
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
