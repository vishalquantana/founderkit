import { cookies } from "next/headers";
import { getMessages, isParticipantLocked } from "@/db/queries/chat";

export const dynamic = "force-dynamic";

const PID_COOKIE = "mrs_pid";

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  flagged: boolean;
  createdAt: Date;
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[];
  locked: boolean;
}

async function assertOwnsParticipant(participantId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const pid = cookieStore.get(PID_COOKIE)?.value;
  return Boolean(pid) && pid === participantId;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  // `code` is unused (history is keyed by participantId, which already
  // scopes to a single workshop), but destructuring keeps the route
  // signature consistent with the other `w/[code]` handlers.
  await params;

  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get("participantId");
  if (!participantId) {
    return Response.json({ error: "participantId is required" }, { status: 400 });
  }

  const authorized = await assertOwnsParticipant(participantId);
  if (!authorized) {
    return Response.json({ error: "Not authorized for this participant" }, { status: 403 });
  }

  const [rows, locked] = await Promise.all([
    getMessages(participantId),
    isParticipantLocked(participantId),
  ]);

  const data: ChatHistoryResponse = {
    messages: rows.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      flagged: m.flagged,
      createdAt: m.createdAt,
    })),
    locked,
  };

  return Response.json(data);
}
