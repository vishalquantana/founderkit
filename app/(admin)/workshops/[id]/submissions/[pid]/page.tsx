import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import { getResponses } from "@/db/queries/responses";
import { getOrCreateResult } from "@/ai/evaluate";
import { ResultView } from "@/components/result/ResultView";
import { assertOwnership } from "../../ownership";
import type { SectionKey } from "@/db/schema";

export default async function PresenterSubmissionPage({
  params,
}: {
  params: Promise<{ id: string; pid: string }>;
}) {
  const { id, pid } = await params;
  const session = await auth();
  const workshop = await getWorkshopById(id);

  if (!assertOwnership(session?.user?.id, workshop)) {
    notFound();
  }

  const participant = await getParticipant(pid);
  if (!participant || participant.workshopId !== id) {
    notFound();
  }

  const responses = await getResponses(pid);
  const answers = responses.reduce((acc, response) => {
    acc[response.section as SectionKey] = response.mainAnswer;
    return acc;
  }, {} as Record<SectionKey, string>);

  const result = await getOrCreateResult(pid);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 p-6 sm:p-10">
      <Link
        href={`/workshops/${id}`}
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Back to workshop
      </Link>
      <ResultView
        result={result}
        answers={answers}
        founderName={participant.founderName}
        startupName={participant.startupName}
        code={workshop!.joinCode}
        pid={pid}
      />
    </main>
  );
}
