import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { getParticipant } from "@/db/queries/participants";
import { getResponses } from "@/db/queries/responses";
import { getOrCreateResult } from "@/ai/evaluate";
import { buildPdfModel } from "@/pdf/model";
import { renderResultPdf } from "@/pdf/ResultDocument";
import type { SectionKey } from "@/db/schema";

// react-pdf renders on Node APIs (Buffer, fonts) that are not available on
// the Edge runtime, so this route must run on Node.
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

  const responses = await getResponses(pid);
  const answers = responses.reduce((acc, response) => {
    acc[response.section as SectionKey] = response.mainAnswer;
    return acc;
  }, {} as Record<SectionKey, string>);

  const result = await getOrCreateResult(pid);

  const model = buildPdfModel({
    founderName: participant.founderName,
    startupName: participant.startupName,
    result,
    answers,
  });

  const buffer = await renderResultPdf(model);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mvp-readiness-${participant.startupName}.pdf"`,
    },
  });
}
