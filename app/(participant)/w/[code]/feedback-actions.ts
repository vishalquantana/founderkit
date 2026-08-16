"use server";

import { cookies } from "next/headers";
import { submitFeedback } from "@/db/queries/feedback";
import { sendSlackErrorAlert } from "@/lib/slack-logger";

const PID_COOKIE = "mrs_pid";

async function assertOwnsParticipant(participantId: string): Promise<void> {
  const cookieStore = await cookies();
  const pid = cookieStore.get(PID_COOKIE)?.value;
  if (!pid) {
    cookieStore.set(PID_COOKIE, participantId, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return;
  }
  if (pid !== participantId) {
    throw new Error("Not authorized for this participant");
  }
}

export async function submitFeedbackAction(input: {
  participantId: string;
  q1Usefulness: string;
  q2MostValuable: string;
  q3IdentifiedAssumptions: string;
  q4AiToolUsefulness: string;
  q5Next7DaysAction: string;
  q6Suggestions?: string;
  q7FollowupInterest: string;
  q7ContactInfo?: string;
}) {
  try {
    await assertOwnsParticipant(input.participantId);
    if (!input.q1Usefulness || !input.q2MostValuable || !input.q3IdentifiedAssumptions || !input.q4AiToolUsefulness || !input.q5Next7DaysAction || !input.q7FollowupInterest) {
      throw new Error("Please complete all required feedback questions");
    }

    const res = await submitFeedback(input);
    return { success: true, feedbackId: res.id };
  } catch (err) {
    await sendSlackErrorAlert({
      source: "server-action",
      error: err,
      context: { action: "submitFeedbackAction", participantId: input.participantId },
    });
    throw err;
  }
}
