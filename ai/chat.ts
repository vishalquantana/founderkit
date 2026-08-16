import { hasOpenRouterKey } from "./openrouter";
import { VAMSHI_SYSTEM_PROMPT } from "./persona";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AnswerAsVamshiInput {
  message: string;
  context: string;
  history: { role: "user" | "assistant"; content: string }[];
}

/**
 * Extracts the startup name from a founder-context block built by
 * `buildFounderContext` (format: "Startup: <name>" on its own line or
 * alongside the founder name). Used only by the offline mock so the demo
 * flow feels grounded even without an OpenRouter key.
 */
function extractStartupName(context: string): string | undefined {
  const match = context.match(/Startup:\s*([^\n·]+)/i);
  return match?.[1]?.trim() || undefined;
}

/**
 * Deterministic, non-random mock reply used when no OpenRouter key is
 * configured. Still reads like Vamshi (pragmatic, one concrete next step)
 * and references the founder's startup name when it's present in the
 * supplied context, so the whole chat flow is testable offline.
 */
function mockAnswer(input: AnswerAsVamshiInput): string {
  const startup = extractStartupName(input.context);
  const who = startup ? `${startup}` : "your startup";
  return (
    `Good question for ${who}. Before adding more to the product, go get signal: talk to 5 people who feel ` +
    `this problem today and see if they'd actually pay or commit. Applause isn't proof — repeat behaviour is. ` +
    `(Running in offline demo mode right now, so treat this as a placeholder; the live Vamshi.AI will ground ` +
    `this in your actual canvas answers.) Next step: message 5 prospects this week and ask for 15 minutes.`
  );
}

/**
 * Text-completion caller for the Vamshi.AI persona chat. Mirrors
 * `callOpenRouter` in ./openrouter.ts but requests plain text (no
 * `response_format: json_object`) since we want a conversational reply,
 * not structured JSON.
 */
export async function answerAsVamshi(input: AnswerAsVamshiInput): Promise<string> {
  if (!hasOpenRouterKey()) {
    return mockAnswer(input);
  }

  const messages: ChatMessage[] = [
    { role: "system", content: VAMSHI_SYSTEM_PROMPT },
    ...input.history.slice(-8),
    { role: "user", content: `${input.context}\n\nFounder asks: ${input.message}` },
  ];

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_CHAT_MODEL ?? process.env.OPENROUTER_SCORE_MODEL,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter chat request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("OpenRouter chat response missing message content");
  }

  return content.trim();
}
