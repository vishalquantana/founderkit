import { getWorkshopByJoinCode } from "@/db/queries/workshops";
import { listPolls, getActivePoll, getPollTally } from "@/db/queries/polls";

export interface FounderPollListItem {
  id: string;
  question: string;
  options: string[];
  status: string;
  position: number;
  counts: number[];
  total: number;
}

export interface FounderPollsResponse {
  polls: FounderPollListItem[];
  activePollId: string | null;
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
};

// Aggregates only (no PII, no auth — founders are anonymous), so a short
// in-memory TTL cache keeps repeated polling from many founders off the DB.
// 5s staleness on vote counts is acceptable for this use case.
const CACHE_TTL_MS = 5000;
const cache = new Map<string, { at: number; data: FounderPollsResponse }>();

export function invalidatePollsCache(code?: string) {
  if (code) {
    cache.delete(code);
  } else {
    cache.clear();
  }
}

async function computePolls(code: string): Promise<FounderPollsResponse> {
  const workshop = await getWorkshopByJoinCode(code);
  if (!workshop) {
    return { polls: [], activePollId: null };
  }

  const [allPolls, activePoll] = await Promise.all([
    listPolls(workshop.id),
    getActivePoll(workshop.id),
  ]);

  const polls = await Promise.all(
    allPolls.map(async (poll) => {
      const { counts, total } = await getPollTally(poll.id);
      return {
        id: poll.id,
        question: poll.question,
        options: poll.options as string[],
        status: poll.status,
        position: poll.position,
        counts,
        total,
      };
    }),
  );

  return { polls, activePollId: activePoll?.id ?? null };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await params;

  const cached = cache.get(code);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Response.json(cached.data, { headers: CACHE_HEADERS });
  }

  const data = await computePolls(code);
  cache.set(code, { at: Date.now(), data });

  return Response.json(data, { headers: CACHE_HEADERS });
}
