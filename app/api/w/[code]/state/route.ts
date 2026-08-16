import { getWorkshopByJoinCode, type WorkshopSettings } from "@/db/queries/workshops";

export interface WorkshopStateResponse {
  canvasUnlocked: boolean;
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
};

// Non-sensitive (just the unlock flag, no auth) so founders' clients can
// poll it every few seconds to pick up the presenter's "Unlock Lean Canvas"
// toggle without a manual refresh.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await params;

  const workshop = await getWorkshopByJoinCode(code);
  const settings = (workshop?.settings as WorkshopSettings | null) ?? null;

  const data: WorkshopStateResponse = {
    canvasUnlocked: Boolean(settings?.canvasUnlocked),
  };

  return Response.json(data, { headers: CACHE_HEADERS });
}
