import { z } from "zod";
import type { SectionKey } from "@/db/schema";
import { buildProbePrompt } from "./prompts";
import { hasOpenRouterKey } from "./openrouter";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const PROBE_SYSTEM_PROMPT =
  "You are a warm, practical founder coach. You review one workshop answer at a time and decide whether it is specific enough or needs one short, friendly follow-up question. You ask for evidence and behaviour, never opinions or compliments, and you never interrogate the founder like an investor.";

const ProbeResultSchema = z.object({
  needsProbe: z.boolean(),
  question: z.string().nullable(),
});

export type ProbeInput = { section: SectionKey; mainAnswer: string };
export type ProbeResult = z.infer<typeof ProbeResultSchema>;

const QUESTION_BANK: Record<SectionKey, string> = {
  problem: "Who exactly faces this, and what do they do today?",
  customer: "Are the user and payer the same person — who approves payment?",
  value: "What evidence shows they'll pay or renew after the first month?",
  mvp: "If you had 7 days, what single assumption would you test?",
  distribution: "Can you name your first 10 users and how you'll personally reach them?",
  proof: "Did anyone take action — pay, repeat, refer — or just give compliments?",
};

const CONCRETE_MARKERS = /\d|\$|₹|rs\.?\s*\d|pay(ing|ment|s|er)?|customer|user|month|week|day|repeat|refer|survey|interview|pilot|name[ds]?/i;

export function mockProbe({ section, mainAnswer }: ProbeInput): ProbeResult {
  const trimmed = mainAnswer.trim();
  const isVague = trimmed.length < 60 || !CONCRETE_MARKERS.test(trimmed);

  if (isVague) {
    return { needsProbe: true, question: QUESTION_BANK[section] };
  }
  return { needsProbe: false, question: null };
}

export async function openRouterProbe({ section, mainAnswer }: ProbeInput): Promise<ProbeResult> {
  const userPrompt = buildProbePrompt(section, mainAnswer);

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_PROBE_MODEL,
      messages: [
        { role: "system", content: PROBE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter probe request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("OpenRouter probe response missing message content");
  }

  const parsed = JSON.parse(content);
  const result = ProbeResultSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(`OpenRouter probe output failed schema validation: ${result.error.message}`);
  }

  return result.data;
}

export async function probeSection(input: ProbeInput): Promise<ProbeResult> {
  if (hasOpenRouterKey()) {
    try {
      return await openRouterProbe(input);
    } catch (error) {
      console.warn(`openRouterProbe failed, falling back to mockProbe: ${error}`);
      return mockProbe(input);
    }
  }
  return mockProbe(input);
}
