import { EvaluationResultSchema, type EvaluationResult } from "./schema";
import { SYSTEM_PROMPT, buildScoringPrompt, type ScoringPromptInput } from "./prompts";
import { stageForScore } from "@/lib/readiness";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const INVALID_OUTPUT_NOTE =
  "Your previous output was invalid JSON for the schema; return only valid JSON matching the required shape.";

export function hasOpenRouterKey(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function callOpenRouter(messages: ChatMessage[]): Promise<unknown> {
  // A stalled LLM request must not hang the caller. Without a timeout, a hung
  // fetch never throws, so the mock-fallback in evaluate.ts (which only catches
  // errors) never fires and the result server-component loads forever on first
  // scan-in. Aborting turns the stall into a throw the fallback handles.
  const timeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS) || 20_000;
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY?.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_SCORE_MODEL?.trim(),
      messages,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("OpenRouter response missing message content");
  }

  return JSON.parse(content);
}

export async function openRouterEvaluate(input: ScoringPromptInput): Promise<EvaluationResult> {
  const userPrompt = buildScoringPrompt(input);
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const parsed = await callOpenRouter(messages);
      const result = EvaluationResultSchema.safeParse(parsed);
      if (result.success) {
        // Recompute the stage from the backend score so a model that returns
        // an inconsistent readinessStage can never persist a mismatched value.
        return { ...result.data, readinessStage: stageForScore(result.data.backendScore) };
      }
      if (attempt === 0) {
        messages.push({ role: "user", content: INVALID_OUTPUT_NOTE });
        continue;
      }
      throw new Error(`OpenRouter output failed schema validation: ${result.error.message}`);
    } catch (error) {
      if (attempt === 0 && error instanceof SyntaxError) {
        messages.push({ role: "user", content: INVALID_OUTPUT_NOTE });
        continue;
      }
      throw error;
    }
  }

  throw new Error("OpenRouter evaluation failed after retry");
}
