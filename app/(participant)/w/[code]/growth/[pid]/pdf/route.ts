import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import { getGrowthPlan, generateAndSaveGrowthPlan } from "@/db/queries/growth";
import { renderGrowthPlanPdf } from "@/pdf/GrowthPlanDocument";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string; pid: string }> },
) {
  const { code, pid } = await params;

  const workshop = await getWorkshopByJoinCode(code);
  const participant = await getParticipant(pid);

  if (!workshop || !participant || participant.workshopId !== workshop.id) {
    return new Response("Not found", { status: 404 });
  }

  let plan = await getGrowthPlan(pid);
  if (!plan) {
    plan = await generateAndSaveGrowthPlan(pid);
  }

  const buffer = await renderGrowthPlanPdf(participant.founderName, participant.startupName, plan);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="growth-plan-${participant.startupName}.pdf"`,
    },
  });
}
