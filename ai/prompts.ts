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
- One founder reflection question`;

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
  "reflectionQuestion": string
}`;
}
