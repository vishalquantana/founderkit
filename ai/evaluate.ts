import { getParticipant } from "@/db/queries/participants";
import { getResponses } from "@/db/queries/responses";
import { saveResult, getResult } from "@/db/queries/results";
import { mockEvaluate, type MockEvaluateInput } from "./mock";
import { openRouterEvaluate, hasOpenRouterKey } from "./openrouter";
import type { ScoringPromptInput } from "./prompts";
import type { EvaluationResult } from "./schema";

export async function evaluateParticipant(participantId: string): Promise<EvaluationResult> {
  const participant = await getParticipant(participantId);
  const responses = await getResponses(participantId);
  const scoringResponses = responses as unknown as MockEvaluateInput["responses"];

  let result: EvaluationResult;
  if (hasOpenRouterKey()) {
    try {
      const scoringInput: ScoringPromptInput = {
        participant: {
          founderName: participant?.founderName ?? "",
          startupName: participant?.startupName ?? "",
          stage: participant?.stage ?? undefined,
          teamSize: participant?.teamSize ?? undefined,
          productType: participant?.productType ?? undefined,
        },
        responses: scoringResponses,
      };
      result = await openRouterEvaluate(scoringInput);
    } catch (error) {
      console.warn(`openRouterEvaluate failed, falling back to mockEvaluate: ${error}`);
      result = mockEvaluate({ responses: scoringResponses });
    }
  } else {
    result = mockEvaluate({ responses: scoringResponses });
  }

  await saveResult(participantId, result);
  return result;
}

export async function getOrCreateResult(participantId: string): Promise<EvaluationResult> {
  const existing = await getResult(participantId);
  if (existing) return existing;
  return evaluateParticipant(participantId);
}
