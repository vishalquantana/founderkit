import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { getEscalation } from "@/db/queries/chat";
import { getParticipant } from "@/db/queries/participants";
import { EscalationReply } from "@/components/admin/EscalationReply";
import { assertOwnership } from "../../ownership";

/**
 * Click-to-reply landing page for a single Vamshi.AI escalation, linked from
 * the Slack notification. Presenter-only. Answering here delivers the reply to
 * the founder and adds it to the workshop FAQ (same endpoint as the Chats tab).
 */
export default async function EscalationReplyPage({
  params,
}: {
  params: Promise<{ id: string; eid: string }>;
}) {
  const { id, eid } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/workshops/${id}/chats/${eid}`);
  }

  const workshop = await getWorkshopById(id);
  if (!assertOwnership(session.user.id, workshop)) {
    notFound();
  }

  const escalation = await getEscalation(eid);
  if (!escalation || escalation.workshopId !== id) {
    notFound();
  }

  const participant = await getParticipant(escalation.participantId).catch(() => null);
  const who =
    [participant?.founderName, participant?.startupName].filter(Boolean).join(" · ") || "A founder";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 p-6 sm:p-10">
      <div>
        <Link href={`/workshops/${id}`} className="text-sm text-muted transition-colors hover:text-foreground">
          ← Back to workshop
        </Link>
        <h1 className="font-display text-gradient mt-1 text-2xl font-bold">Reply to a founder</h1>
        <p className="text-sm text-muted">Vamshi.AI couldn&apos;t answer this — your reply trains it.</p>
      </div>

      <EscalationReply
        workshopId={id}
        escalationId={eid}
        question={escalation.question}
        who={who}
        alreadyAnswered={escalation.status === "answered"}
        previousReply={escalation.presenterReply}
      />
    </main>
  );
}
