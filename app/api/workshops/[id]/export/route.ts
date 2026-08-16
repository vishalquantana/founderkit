import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { listSubmissions } from "@/db/queries/admin";
import { getResponses } from "@/db/queries/responses";
import { assertOwnership } from "@/app/(admin)/workshops/[id]/ownership";
import { toCsv } from "@/lib/csv";
import { SECTIONS } from "@/lib/sections";
import { STAGE_META } from "@/lib/readiness";
import type { SectionKey } from "@/db/schema";

const HEADERS = [
  "Founder name",
  "Startup name",
  "Email",
  "Mobile",
  "Sector",
  "Stage",
  "Team size",
  "Product type",
  "Business model",
  ...SECTIONS.map((s) => s.heading),
  "Backend score",
  "Readiness stage",
  "Completed at",
  "Consent for follow-up",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const session = await auth();
  const workshop = await getWorkshopById(id);

  if (!workshop) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!assertOwnership(session?.user?.id, workshop)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const submissions = await listSubmissions(id);

  const rows = await Promise.all(
    submissions.map(async ({ participant, result }) => {
      const responses = await getResponses(participant.id);
      const answersBySection = responses.reduce((acc, response) => {
        acc[response.section as SectionKey] = response.mainAnswer;
        return acc;
      }, {} as Partial<Record<SectionKey, string>>);

      return [
        participant.founderName,
        participant.startupName,
        participant.contact,
        participant.mobile ?? null,
        participant.sector ?? null,
        participant.stage ?? null,
        participant.teamSize ?? null,
        participant.productType ?? null,
        participant.businessModel ?? null,
        ...SECTIONS.map((section) => answersBySection[section.key] ?? null),
        result ? result.backendScore : null,
        result ? STAGE_META[result.readinessStage].label : null,
        participant.completedAt ? participant.completedAt.toISOString() : null,
        participant.consentFollowup ? "Yes" : "No",
      ];
    }),
  );

  const csv = toCsv(HEADERS, rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="workshop-${workshop.joinCode}.csv"`,
    },
  });
}
