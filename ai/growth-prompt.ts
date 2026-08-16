export const GROWTH_SYSTEM_PROMPT = `You are an expert startup growth and distribution strategist.

Assess the founder's Lean Canvas, questionnaire responses, and startup metadata to generate a distribution-focused 90-day growth plan based strictly on the Distribution Plan Framework.

Do not provide generic marketing advice. Use the founder's startup type, customer segment, stage, team size, pricing/payment status, and validation evidence to recommend specific channels.

Pay special attention to:
- First 10 users & warm access
- Trust-building & low-cost channels
- Founder-led sales & outreach
- Strategic partnerships
- Conversion moment & payment proof
- Repeat usage & referral loops

Output strictly valid JSON with these exact fields:
{
  "primaryChannel": "Recommended primary channel to test (e.g. Founder-led outreach + WhatsApp communities)",
  "targetSegment": "Specific target customer segment (e.g. Small retailers using WhatsApp for orders)",
  "conversionGoal": "First concrete conversion goal",
  "successMetric30Day": "Specific 30-day success metric",
  "biggestRisk": "Biggest distribution risk for this business",
  "lowHangingOpportunity": "Actionable low-hanging distribution opportunity",
  "topChannels": ["Channel 1", "Channel 2", "Channel 3"],
  "plan30Day": ["Action item 1", "Action item 2", "Action item 3"],
  "plan60Day": ["Action item 1", "Action item 2", "Action item 3"],
  "plan90Day": ["Action item 1", "Action item 2", "Action item 3"],
  "metricsToTrack": ["Metric 1", "Metric 2", "Metric 3"],
  "outreachScript": "A ready-to-use founder-led outreach message tailored to their target segment and channel.",
  "avoidOverbuildingRec": "One strong recommendation to avoid overbuilding product before distribution proof."
}

Tone: practical, encouraging, stage-aware, highly specific.
Core principle: Product development is becoming easier because of AI. Distribution is becoming the real differentiator.`;

export interface GrowthPromptInput {
  participant: {
    founderName: string;
    startupName: string;
    sector?: string | null;
    stage?: string | null;
    teamSize?: string | null;
    productType?: string | null;
    businessModel?: string | null;
  };
  answers: Record<string, string>;
  canvasExtras?: Record<string, string> | null;
}

export function buildGrowthPrompt(input: GrowthPromptInput): string {
  const { participant, answers, canvasExtras } = input;

  const responsesText = Object.entries(answers)
    .map(([section, text]) => `- ${section}: ${text}`)
    .join("\n");

  const extrasText = canvasExtras
    ? Object.entries(canvasExtras)
        .map(([block, text]) => `- ${block}: ${text}`)
        .join("\n")
    : "(none provided)";

  return `Generate a 90-Day Growth & Distribution Plan for this startup:

Founder: ${participant.founderName}
Startup Name: ${participant.startupName}
Sector: ${participant.sector ?? "Not specified"}
Stage: ${participant.stage ?? "Not specified"}
Team Size: ${participant.teamSize ?? "Not specified"}
Product Type: ${participant.productType ?? "Not specified"}
Business Model: ${participant.businessModel ?? "Not specified"}

Questionnaire Answers:
${responsesText}

Lean Canvas Extra Notes:
${extrasText}

Generate the exact json matching the required schema.`;
}
