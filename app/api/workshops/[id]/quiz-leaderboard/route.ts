import { NextResponse } from "next/server";
import { getWorkshopById } from "@/db/queries/workshops";
import { listWorkshopQuizLeaderboard } from "@/db/queries/quiz";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const workshop = await getWorkshopById(id);
  if (!workshop) return NextResponse.json({ error: "Workshop not found" }, { status: 404 });

  const leaderboard = await listWorkshopQuizLeaderboard(id);
  return NextResponse.json({ leaderboard });
}
