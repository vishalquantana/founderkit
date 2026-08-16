import { notFound } from "next/navigation";
import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import { getFeedbackSubmission } from "@/db/queries/feedback";
import { FounderTabBar } from "@/components/participant/FounderTabBar";
import { FeedbackForm } from "@/components/participant/FeedbackForm";

export default async function FeedbackPage({
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

  const initialSubmission = await getFeedbackSubmission(pid);

  return (
    <main className="min-h-screen bg-background pb-20">
      <FeedbackForm
        code={code}
        pid={pid}
        founderName={participant.founderName}
        startupName={participant.startupName}
        initialSubmission={initialSubmission ?? null}
      />
      <FounderTabBar
        code={code}
        pid={pid}
        active="home"
        canvasUnlocked={true}
        hasResult={true}
      />
    </main>
  );
}
