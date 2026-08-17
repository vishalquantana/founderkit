import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { getWorkshopStats, listSubmissions } from "@/db/queries/admin";
import { getResponses } from "@/db/queries/responses";
import { listPolls } from "@/db/queries/polls";
import { StatsPanel } from "@/components/admin/StatsPanel";
import { SubmissionsTable, type SubmissionRow } from "@/components/admin/SubmissionsTable";
import { WorkshopControls } from "@/components/admin/WorkshopControls";
import { PollManager } from "@/components/admin/PollManager";
import { WorkshopWorkspace } from "@/components/admin/WorkshopWorkspace";
import { ChatsPanel } from "@/components/admin/ChatsPanel";
import { KnowledgeBasePanel } from "@/components/admin/KnowledgeBasePanel";
import { FeedbackPanel } from "@/components/admin/FeedbackPanel";
import { ActiveUsersBadge } from "@/components/admin/ActiveUsersBadge";
import { assertOwnership } from "./ownership";
import { updateStatus, updateSettings, updateWorkshopName, resetAllQuizSubmissionsAction } from "./actions";
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

  const [stats, submissions, polls] = await Promise.all([
    getWorkshopStats(id),
    listSubmissions(id),
    listPolls(id),
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
    <main className="flex min-h-screen w-full flex-col gap-8 p-6 sm:p-10">
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
          <ActiveUsersBadge workshopId={id} initial={stats.total} />
          <a href={`/api/workshops/${id}/export`} className="pulse-btn-secondary px-4 py-2 text-sm">
            Download CSV
          </a>
          <Link href={`/present/${id}`} className="pulse-btn px-4 py-2 text-sm">
            Open Present mode
          </Link>
        </div>
      </header>

      <WorkshopWorkspace
        submissions={
          <div className="flex flex-col gap-8">
            <StatsPanel workshopId={id} initialStats={stats} />
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Submissions
              </h2>
              <SubmissionsTable submissions={submissionRows} workshopId={id} />
            </div>
          </div>
        }
        polls={
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Poll questions
            </h2>
            <PollManager workshopId={id} polls={polls} />
          </div>
        }
        chats={
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Vamshi.AI chats
            </h2>
            <ChatsPanel workshopId={id} />
          </div>
        }
        feedback={
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Founder Session Feedback
            </h2>
            <FeedbackPanel workshopId={id} />
          </div>
        }
        knowledgeBase={
          <div>
            <KnowledgeBasePanel workshopId={id} />
          </div>
        }
        settingsView={
          <div className="flex flex-col gap-4 max-w-2xl">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Workshop & Live Presentation Settings
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Configure workshop status, name, Lean Canvas lock state, visible live projection tabs, and quiz submissions.
              </p>
            </div>
            <div className="pulse-card p-6">
              <WorkshopControls
                workshopId={id}
                workshopName={workshop!.name}
                status={workshop!.status as WorkshopStatus}
                settings={workshop!.settings as WorkshopSettings}
                onUpdateStatus={updateStatus}
                onUpdateSettings={updateSettings}
                onUpdateName={updateWorkshopName}
                onResetQuiz={resetAllQuizSubmissionsAction}
              />
            </div>
          </div>
        }
      />
    </main>
  );
}
