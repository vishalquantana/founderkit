import { notFound, redirect } from "next/navigation";
import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import { getResponses } from "@/db/queries/responses";
import { getGrowthPlan } from "@/db/queries/growth";
import { FounderTabBar } from "@/components/participant/FounderTabBar";
import { GrowthPlanView } from "@/components/result/GrowthPlanView";

export default async function GrowthPlanPage({
  params,
}: {
  params: Promise<{ code: string; pid: string }>;
}) {
  const { code, pid } = await params;

  const workshop = await getWorkshopByJoinCode(code);
  const participant = await getParticipant(pid);

  if (!workshop || !participant || participant.workshopId !== workshop.id) {
    notFound();
  }

  const responses = await getResponses(pid);
  if (responses.length === 0) {
    redirect(`/w/${code}/canvas/${pid}`);
  }

  const initialPlan = await getGrowthPlan(pid);

  return (
    <main className="min-h-screen bg-background pb-20">
      <GrowthPlanView
        code={code}
        pid={pid}
        founderName={participant.founderName}
        startupName={participant.startupName}
        contactEmail={participant.contact}
        initialPlan={initialPlan ?? null}
      />
      <FounderTabBar
        code={code}
        pid={pid}
        active="growth"
        canvasUnlocked={true}
        hasResult={true}
      />
    </main>
  );
}
