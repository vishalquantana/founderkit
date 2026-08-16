"use server";

import { cookies } from "next/headers";
import { generateAndSaveGrowthPlan, toggleGrowthTask } from "@/db/queries/growth";
import { getParticipant } from "@/db/queries/participants";
import { renderGrowthPlanPdf } from "@/pdf/GrowthPlanDocument";
import { hasSendgrid, sendEmail } from "@/email/sendgrid";

const PID_COOKIE = "mrs_pid";

async function assertOwnsParticipant(participantId: string): Promise<void> {
  const cookieStore = await cookies();
  const pid = cookieStore.get(PID_COOKIE)?.value;
  if (!pid || pid !== participantId) {
    throw new Error("Not authorized for this participant");
  }
}

export async function generateGrowthPlanAction(participantId: string) {
  await assertOwnsParticipant(participantId);
  const plan = await generateAndSaveGrowthPlan(participantId);
  return plan;
}

export async function toggleGrowthTaskAction(participantId: string, taskId: string) {
  await assertOwnsParticipant(participantId);
  const checked = await toggleGrowthTask(participantId, taskId);
  return { checked };
}

export async function emailGrowthPlanAction(participantId: string) {
  await assertOwnsParticipant(participantId);
  const participant = await getParticipant(participantId);
  if (!participant || !participant.contact) {
    throw new Error("Participant email not found");
  }

  const plan = await generateAndSaveGrowthPlan(participantId);

  if (!hasSendgrid()) {
    return { ok: false, message: "Email service is not configured (SENDGRID_API_KEY missing)" };
  }

  const pdfBuffer = await renderGrowthPlanPdf(
    participant.founderName,
    participant.startupName,
    plan,
  );
  const base64Pdf = pdfBuffer.toString("base64");

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: participant.contact }] }],
        from: { email: process.env.SENDGRID_FROM_EMAIL },
        subject: `Your 90-Day Growth & Distribution Plan - ${participant.startupName}`,
        content: [
          {
            type: "text/plain",
            value: `Hi ${participant.founderName},\n\nHere is your custom 90-Day Growth & Distribution Plan for ${participant.startupName}.\n\nPrimary Channel: ${plan.primaryChannel}\nTarget Segment: ${plan.targetSegment}\n\nPlease find your attached PDF plan.\n\nBest,\nQuantana AI Team`,
          },
          {
            type: "text/html",
            value: `<div style="font-family: sans-serif; line-height: 1.6;"><h2>Hi ${participant.founderName},</h2><p>Here is your custom <strong>90-Day Growth & Distribution Plan</strong> for <strong>${participant.startupName}</strong>.</p><ul><li><strong>Primary Channel:</strong> ${plan.primaryChannel}</li><li><strong>Target Segment:</strong> ${plan.targetSegment}</li></ul><p>Your complete checklist, metrics, and founder-led outreach script are attached in the PDF document.</p><br/><p>Best regards,<br/><strong>Quantana AI Team</strong></p></div>`,
          },
        ],
        attachments: [
          {
            content: base64Pdf,
            filename: `Growth-Plan-${participant.startupName}.pdf`,
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      }),
    });

    if (response.ok) {
      return { ok: true, message: `Growth plan emailed to ${participant.contact}` };
    } else {
      const errText = await response.text();
      console.error("Failed to email growth plan:", errText);
      return { ok: false, message: "Failed to send email via SendGrid" };
    }
  } catch (err) {
    console.error("Email growth plan error:", err);
    return { ok: false, message: "An unexpected error occurred while sending email" };
  }
}
