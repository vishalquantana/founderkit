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
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-600">
            ← Back to workshops
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{workshop!.name}</h1>
          <p className="text-sm text-slate-500">
            Join code <span className="font-mono font-semibold tracking-widest">{workshop!.joinCode}</span>
          </p>
        </div>
        <Link
          href={`/present/${id}`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
        >
          Open Present mode
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-8">
          <StatsPanel workshopId={id} initialStats={stats} />

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Submissions
            </h2>
            <SubmissionsTable submissions={submissionRows} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
