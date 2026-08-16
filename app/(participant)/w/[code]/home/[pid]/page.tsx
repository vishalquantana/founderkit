import { getWorkshopByJoinCode, type WorkshopSettings } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import { getResponses } from "@/db/queries/responses";
import { getResult } from "@/db/queries/results";
import { FounderHome } from "@/components/result/FounderHome";
import { resultAccessState } from "../../result/result-guard";
import type { SectionKey } from "@/db/schema";

export default async function FounderHomePage({
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
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-amber-500"
            aria-hidden="true"
          >
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-800">We couldn&apos;t find that snapshot</h1>
        <p className="max-w-xs text-sm leading-relaxed text-slate-500">
          Double-check the link with your facilitator, or head back and complete the workshop to
          get your Quantana AI Cofounder snapshot.
        </p>
      </main>
    );
  }

  const responses = await getResponses(pid);
  const answers = responses.reduce((acc, response) => {
    acc[response.section as SectionKey] = response.mainAnswer;
    return acc;
  }, {} as Record<SectionKey, string>);

  const result = (await getResult(pid)) ?? null;
  const completed = Boolean(participant!.completedAt);
  const canvasUnlocked = Boolean((workshop!.settings as WorkshopSettings | null)?.canvasUnlocked);

  return (
    <FounderHome
      participant={{
        founderName: participant!.founderName,
        startupName: participant!.startupName,
        contact: participant!.contact,
        sector: participant!.sector,
        stage: participant!.stage,
        teamSize: participant!.teamSize,
        productType: participant!.productType,
        businessModel: participant!.businessModel,
      }}
      result={result}
      completed={completed}
      canvasUnlocked={canvasUnlocked}
      answers={answers}
      canvasExtras={(participant!.canvasExtras as Record<string, string> | null) ?? undefined}
      code={code}
      pid={pid}
    />
  );
}
