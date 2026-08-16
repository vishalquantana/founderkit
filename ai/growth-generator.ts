import { GrowthPlanSchema, type GrowthPlanData } from "./growth-schema";
import { GROWTH_SYSTEM_PROMPT, buildGrowthPrompt, type GrowthPromptInput } from "./growth-prompt";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const INVALID_OUTPUT_NOTE =
  "Your previous output was invalid JSON for the schema; return only valid JSON matching the required shape.";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function callOpenRouter(messages: ChatMessage[]): Promise<unknown> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY?.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_SCORE_MODEL?.trim() || "google/gemini-2.5-flash-001",
      messages,
      response_format: { type: "json_object" },
    }),
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

export function generateMockGrowthPlan(input: GrowthPromptInput): GrowthPlanData {
  const target = input.participant.sector || "ideal customers";
  return {
    primaryChannel: "Founder-led direct outreach & industry networks",
    targetSegment: `Early adopters in ${target} seeking immediate workflow efficiency`,
    conversionGoal: "Secure 10 pilot commitments with active feedback",
    successMetric30Day: "5 target users complete the core activation workflow",
    biggestRisk: "Founders focus on product polish instead of active customer conversations",
    lowHangingOpportunity: "Leverage personal network and warm LinkedIn introductions for immediate user interviews",
    topChannels: [
      "Founder-led LinkedIn / Email outreach",
      "Direct WhatsApp / Community engagement",
      "Targeted industry webinars & demo sessions",
    ],
    plan30Day: [
      "Conduct 15 customer discovery conversations",
      "Set up a simple 1-page waitlist / demo request page",
      "Secure first 5 pilot users for manual onboarding",
    ],
    plan60Day: [
      "Run pilot with 10–20 active users",
      "Test willingness-to-pay with a paid pilot offer",
      "Collect and document 2 compelling customer case studies",
    ],
    plan90Day: [
      "Double down on the best-performing distribution channel",
      "Build a structured customer referral incentive",
      "Prepare customer expansion & 50-customer pipeline plan",
    ],
    metricsToTrack: [
      "Number of weekly founder outreach conversations",
      "Activation rate (% of signups reaching core value)",
      "Pilot completion & conversion to paid",
    ],
    outreachScript: `Hi [Name], I noticed your work in ${target}. We are building a simple solution to help founders stream validation and distribution. I'm reaching out to get feedback from 3 experienced leaders — not pitching anything, just learning. Would you be open to a 15-minute chat this week?`,
    avoidOverbuildingRec: "Do not add any new software features until at least 5 customers use the existing core flow repeatedly.",
  };
}

export async function openRouterGenerateGrowthPlan(input: GrowthPromptInput): Promise<GrowthPlanData> {
  if (!process.env.OPENROUTER_API_KEY) {
    return generateMockGrowthPlan(input);
  }

  const userPrompt = buildGrowthPrompt(input);
  const messages: ChatMessage[] = [
    { role: "system", content: GROWTH_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const parsed = await callOpenRouter(messages);
      const result = GrowthPlanSchema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
      if (attempt === 0) {
        messages.push({ role: "user", content: INVALID_OUTPUT_NOTE });
        continue;
      }
    } catch (error) {
      if (attempt === 0) {
        messages.push({ role: "user", content: INVALID_OUTPUT_NOTE });
        continue;
      }
    }
  }

  return generateMockGrowthPlan(input);
}
