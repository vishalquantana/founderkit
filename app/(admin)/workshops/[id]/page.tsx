import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { getWorkshopStats, listSubmissions } from "@/db/queries/admin";
import { getResponses } from "@/db/queries/responses";
import { StatsPanel } from "@/components/admin/StatsPanel";
import { SubmissionsTable, type SubmissionRow } from "@/components/admin/SubmissionsTable";
import { WorkshopControls } from "@/components/admin/WorkshopControls";
import { assertOwnership } from "./ownership";
import { updateStatus, updateSettings } from "./actions";
import type { SectionKey, WorkshopStatus } from "@/db/schema";
import type { WorkshopSettings } from "@/db/queries/workshops";

export default async function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const workshop = await getWorkshopById(id);

  if (!assertOwnership(session?.user?.id, workshop)) {
    notFound();
  }

  const [stats, submissions] = await Promise.all([
    getWorkshopStats(id),
    listSubmissions(id),
  ]);

  const submissionRows: SubmissionRow[] = await Promise.all(
    submissions.map(async ({ participant, result }) => {
      const responses = await getResponses(participant.id);
      const answers = responses.reduce((acc, response) => {
        acc[response.section as SectionKey] = response.mainAnswer;
        return acc;
      }, {} as Partial<Record<SectionKey, string>>);
      return { participant, result, answers };
    }),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 p-6 sm:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-muted transition-colors hover:text-foreground">
            ← Back to workshops
          </Link>
          <h1 className="font-display text-gradient mt-1 text-2xl font-bold">{workshop!.name}</h1>
          <p className="text-sm text-muted">
            Join code{" "}
            <span className="font-mono font-semibold tracking-widest text-foreground">
              {workshop!.joinCode}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/api/workshops/${id}/export`} className="pulse-btn-secondary px-4 py-2 text-sm">
            Download CSV
          </a>
          <Link href={`/present/${id}`} className="pulse-btn px-4 py-2 text-sm">
            Open Present mode
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-8">
          <StatsPanel workshopId={id} initialStats={stats} />

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Submissions
            </h2>
            <SubmissionsTable submissions={submissionRows} />
          </div>
        </div>

        <div className="pulse-card p-5">
          <WorkshopControls
            workshopId={id}
            status={workshop!.status as WorkshopStatus}
            settings={workshop!.settings as WorkshopSettings}
            onUpdateStatus={updateStatus}
            onUpdateSettings={updateSettings}
          />
        </div>
      </div>
    </main>
  );
}
