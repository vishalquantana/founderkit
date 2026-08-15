import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { responses } from "../schema";
import { newId } from "@/lib/ids";
import type { SectionKey } from "../schema";

export type Response = typeof responses.$inferSelect;

export async function saveResponse(input: {
  participantId: string; section: SectionKey; mainAnswer: string;
  probeQuestion?: string | null; probeAnswer?: string | null;
}): Promise<void> {
  const existing = await db.query.responses.findFirst({
    where: and(eq(responses.participantId, input.participantId), eq(responses.section, input.section)),
  });
  if (existing) {
    await db.update(responses).set({
      mainAnswer: input.mainAnswer,
      probeQuestion: input.probeQuestion ?? existing.probeQuestion,
      probeAnswer: input.probeAnswer ?? existing.probeAnswer,
    }).where(eq(responses.id, existing.id));
  } else {
    await db.insert(responses).values({
      id: newId(), participantId: input.participantId, section: input.section,
      mainAnswer: input.mainAnswer,
      probeQuestion: input.probeQuestion ?? null, probeAnswer: input.probeAnswer ?? null,
    });
  }
}

export async function getResponses(participantId: string): Promise<Response[]> {
  return db.query.responses.findMany({ where: eq(responses.participantId, participantId) });
}
