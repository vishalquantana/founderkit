import { getParticipant, markResultEmailed } from "@/db/queries/participants";
import { getWorkshopById } from "@/db/queries/workshops";
import { getOrCreateResult } from "@/ai/evaluate";
import { STAGE_META } from "@/lib/readiness";
import { hasSendgrid, sendEmail } from "./sendgrid";
import { resultEmail } from "./templates";

export async function maybeEmailResult(participantId: string): Promise<void> {
  try {
    const participant = await getParticipant(participantId);
    if (!participant) return;
    if (!participant.consentFollowup) return;
    if (participant.resultEmailedAt) return;
    if (!hasSendgrid()) return;

    const workshop = await getWorkshopById(participant.workshopId);
    if (!workshop) return;

    const result = await getOrCreateResult(participantId);

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const link = `${base}/w/${workshop.joinCode}/result/${participantId}`;
    const stageLabel = STAGE_META[result.readinessStage].label;

    const content = resultEmail({
      founderName: participant.founderName,
      startupName: participant.startupName,
      stageLabel,
      summary: result.summary,
      link,
    });

    const { ok } = await sendEmail({
      to: participant.contact,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    if (ok) {
      await markResultEmailed(participantId);
    }
  } catch (error) {
    console.warn(`maybeEmailResult failed for participant ${participantId}: ${error}`);
  }
}
