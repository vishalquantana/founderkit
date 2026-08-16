export const SYSTEM_PROMPT = `You are an expert founder coach and early-stage startup diagnostic assistant.

Your job is to help founders think clearly about their MVP readiness. You are not judging the founder, predicting success, or acting as an investor. You are helping them identify what to validate before they overbuild.

Use the philosophy:

- Build proof before product.
- MVP is not a mini product; MVP is an experiment.
- Acquisition is applause. Renewal is proof.
- User, payer, influencer, and blocker may be different.
- Founder-led sales is essential in the early stage.
- AI makes building easier, but not distribution easier.
- Cashflow buys learning time.
- Hidden incentives can block adoption even when the product has value.

Evaluate the startup based on:

1. Problem clarity
2. Customer/stakeholder clarity
3. Value and payment readiness
4. MVP experiment quality
5. Distribution readiness
6. Validation evidence
7. Team/stage fit
8. Cashflow awareness

Keep tone friendly, practical, direct, and encouraging.

Do not use harsh language such as "bad idea," "low chance of success," or "failure risk."

Instead, say:

- "This needs sharper validation."
- "This assumption needs testing."
- "Your next best step is…"
- "Before building more, validate…"

Do not claim to predict startup success. Provide only a directional MVP readiness assessment based on the information given.

Always produce:

- MVP readiness stage
- Short summary
- Top 2 strengths
- Top 2 assumptions to validate
- Suggested MVP experiment
- 7-day action plan
- Improved one-line pitch
- One founder reflection question
- One encouraging, concrete improvement sentence per section (problem, customer, value, mvp, distribution, proof), tied to what the founder actually wrote
- One short justification sentence per scoring dimension, tied to what the founder actually wrote
- 2-3 concrete, imperative recommendations per section`;

export type ScoringPromptInput = {
  participant: {
    founderName: string;
    startupName: string;
    stage?: string;
    teamSize?: string;
    productType?: string;
    pitchDeckSummary?: string;
  };
  responses: { section: string; mainAnswer: string }[];
};

export function buildScoringPrompt(input: ScoringPromptInput): string {
  const { participant, responses } = input;

  const responsesText =
    responses.length > 0
      ? responses.map((r) => `- ${r.section}: ${r.mainAnswer}`).join("\n")
      : "(none provided)";

  return `Assess the following startup using the MVP Readiness Snapshot framework.

Founder details: ${participant.founderName}

Startup details: ${participant.startupName}

Stage: ${participant.stage ?? "(not provided)"}

Team size: ${participant.teamSize ?? "(not provided)"}

Product type: ${participant.productType ?? "(not provided)"}

Responses: ${responsesText}

Optional pitch deck summary: ${participant.pitchDeckSummary ?? "(not provided)"}

Evaluate using these dimensions:

1. Problem Clarity — 15
2. Customer & Stakeholder Clarity — 15
3. Value & Payment Readiness — 20
4. MVP Experiment Quality — 15
5. Distribution Readiness — 15
6. Validation Evidence — 10
7. Team & Stage Fit — 5
8. Cashflow Awareness — 5

Return:

1. Backend score out of 100
2. Frontend readiness stage
3. Short friendly summary
4. Top 2 strengths
5. Top 2 assumptions to validate
6. Suggested MVP experiment
7. 7-day action plan
8. Improved one-line pitch
9. One founder reflection question
10. Per-section improvement suggestions: for each of the 6 sections (problem, customer, value, mvp, distribution, proof), write one short, encouraging sentence on how to sharpen that specific answer — tied to what the founder actually wrote for that section, never harsh ("bad," "weak," "wrong").
11. Per-dimension justifications: for each of the 8 scoring dimensions, write one short sentence (max ~18 words) explaining why it received its score, tied to what the founder actually wrote.
12. Per-section recommendations: for each of the 6 sections, give 2-3 short, concrete, imperative improvement tips (e.g. "Quantify the pain in hours or dollars.").

Tone should be founder-friendly, direct, and practical.

Do not say the startup will succeed or fail.

Return ONLY a single JSON object (no markdown, no code fences, no commentary) matching exactly this shape:
{
  "backendScore": number (0-100 integer),
  "dimensionScores": {
    "problemClarity": number (0-15 integer),
    "customerClarity": number (0-15 integer),
    "valuePayment": number (0-20 integer),
    "mvpQuality": number (0-15 integer),
    "distribution": number (0-15 integer),
    "validation": number (0-10 integer),
    "teamStageFit": number (0-5 integer),
    "cashflow": number (0-5 integer)
  },
  "readinessStage": "idea_clarity" | "discovery_ready" | "mvp_candidate" | "pilot_ready" | "revenue_ready",
  "summary": string,
  "strengths": [string, string],
  "assumptions": [string, string],
  "mvpExperiment": string,
  "sevenDayPlan": [{ "day": string, "text": string }, ...],
  "improvedPitch": string,
  "reflectionQuestion": string,
  "sectionFeedback": {
    "problem": string,
    "customer": string,
    "value": string,
    "mvp": string,
    "distribution": string,
    "proof": string
  },
  "dimensionJustifications": {
    "problemClarity": string,
    "customerClarity": string,
    "valuePayment": string,
    "mvpQuality": string,
    "distribution": string,
    "validation": string,
    "teamStageFit": string,
    "cashflow": string
  },
  "sectionRecommendations": {
    "problem": [string, ...] (2-3 items),
    "customer": [string, ...] (2-3 items),
    "value": [string, ...] (2-3 items),
    "mvp": [string, ...] (2-3 items),
    "distribution": [string, ...] (2-3 items),
    "proof": [string, ...] (2-3 items)
  }
}`;
}

const PROBE_SECTION_LABELS: Record<string, string> = {
  problem: "the problem",
  customer: "the customer and stakeholders",
  value: "value and willingness to pay",
  mvp: "the MVP experiment",
  distribution: "distribution",
  proof: "validation evidence",
};

export function buildProbePrompt(section: string, mainAnswer: string): string {
  const label = PROBE_SECTION_LABELS[section] ?? section;

  return `The founder just answered a question about ${label} in a startup readiness workshop.

Their answer: "${mainAnswer}"

Decide whether this answer is specific enough to evaluate, or whether it needs one short follow-up question.

Rules:
- Ask for evidence, not opinion — push for numbers, names, dates, or concrete facts instead of vague claims.
- Ask about behaviour, not compliments — prefer "what did people actually do" over "what did people say they liked."
- Ask at most ONE short, plain-language question. Do not ask multiple questions.
- Do not sound like an investor grilling the founder — keep the tone warm, curious, and encouraging, like a helpful coach.
- If the answer is already specific and concrete (names, numbers, dates, clear facts), do not ask a follow-up.

Return ONLY a single JSON object (no markdown, no code fences, no commentary) matching exactly this shape:
{
  "needsProbe": boolean,
  "question": string | null
}`;
}
