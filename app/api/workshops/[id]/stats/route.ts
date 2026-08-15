import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { getWorkshopStats } from "@/db/queries/admin";
import { assertOwnership } from "@/app/(admin)/workshops/[id]/ownership";

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

  const stats = await getWorkshopStats(id);
  return NextResponse.json(stats);
}
