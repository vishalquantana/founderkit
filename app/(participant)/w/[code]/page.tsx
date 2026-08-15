import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { ConsentGate } from "@/components/participant/ConsentGate";
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

  return <ConsentGate consentText={workshop!.consentText} />;
}
