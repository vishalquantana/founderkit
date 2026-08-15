import type { SectionKey, ReadinessStage } from "@/db/schema";
import { DIMENSIONS, DIMENSION_MAX, stageForScore, type Dimension } from "@/lib/readiness";
import { EvaluationResultSchema, type EvaluationResult } from "./schema";

export interface MockEvaluateInput {
  responses: { section: SectionKey; mainAnswer: string }[];
}

/**
 * Deterministic detail heuristic: score scales with answer length and the
 * presence of concrete signal words (numbers, named channels, evidence of
 * payment/repeat use, etc). No randomness, no Date — same input always
 * produces the same output.
 */
const CONCRETE_MARKERS = [
  /\d+/, // any number (counts of users, %, days...)
  /\bpay|paid|payment|pricing|price|fee|subscri/i,
  /\brepeat|retain|return|renew/i,
  /\bpilot|trial|commit(ted)?|pre-committed/i,
  /\bwhatsapp|instagram|facebook|linkedin|email|market|store|shop|referral|channel/i,
  /\buser|customer|shopkeeper|founder|owner/i,
];

function detailScore(answer: string | undefined, max: number): number {
  const text = (answer ?? "").trim();
  if (text.length === 0) return 0;

  // Length component: up to 60% of max, scaling with characters (saturating).
  const lengthRatio = Math.min(text.length / 160, 1);
  const lengthPoints = lengthRatio * 0.6 * max;

  // Concrete-signal component: up to 40% of max, one slice per marker hit.
  const hits = CONCRETE_MARKERS.filter((re) => re.test(text)).length;
  const markerRatio = Math.min(hits / CONCRETE_MARKERS.length, 1);
  const markerPoints = markerRatio * 0.4 * max;

  const raw = lengthPoints + markerPoints;
  return Math.max(0, Math.min(max, Math.round(raw)));
}

function findAnswer(responses: MockEvaluateInput["responses"], section: SectionKey): string {
  return responses.find((r) => r.section === section)?.mainAnswer ?? "";
}

/**
 * Maps each of the 8 scoring dimensions to the section answer(s) that best
 * evidence it, per the brief:
 * - problemClarity <- problem
 * - customerClarity <- customer
 * - valuePayment <- value (+ proof for payment evidence)
 * - mvpQuality <- mvp
 * - distribution <- distribution
 * - validation <- proof (+ value)
 * - teamStageFit <- proof (+ mvp) — founder execution signal
 * - cashflow <- value (+ proof) — payment/pricing signal
 */
function computeDimensionScores(responses: MockEvaluateInput["responses"]): Record<Dimension, number> {
  const problem = findAnswer(responses, "problem");
  const customer = findAnswer(responses, "customer");
  const value = findAnswer(responses, "value");
  const mvp = findAnswer(responses, "mvp");
  const distribution = findAnswer(responses, "distribution");
  const proof = findAnswer(responses, "proof");

  const combine = (a: string, b: string) => [a, b].filter(Boolean).join(" ");

  const scores: Record<Dimension, number> = {
    problemClarity: detailScore(problem, DIMENSION_MAX.problemClarity),
    customerClarity: detailScore(customer, DIMENSION_MAX.customerClarity),
    valuePayment: detailScore(combine(value, proof), DIMENSION_MAX.valuePayment),
    mvpQuality: detailScore(mvp, DIMENSION_MAX.mvpQuality),
    distribution: detailScore(distribution, DIMENSION_MAX.distribution),
    validation: detailScore(combine(proof, value), DIMENSION_MAX.validation),
    teamStageFit: detailScore(combine(proof, mvp), DIMENSION_MAX.teamStageFit),
    cashflow: detailScore(combine(value, proof), DIMENSION_MAX.cashflow),
  };

  return scores;
}

interface StageCopy {
  summary: string;
  strengths: [string, string];
  assumptions: [string, string];
  mvpExperiment: string;
  sevenDayPlan: { day: string; text: string }[];
  improvedPitch: string;
  reflectionQuestion: string;
}

const STAGE_COPY: Record<ReadinessStage, StageCopy> = {
  idea_clarity: {
    summary:
      "You have an interesting direction, but the problem and customer segment need sharper definition before building.",
    strengths: [
      "You have identified a broad problem area.",
      "The idea can be tested without heavy technology investment.",
    ],
    assumptions: [
      "Who feels this problem most urgently?",
      "Whether the user and payer are the same person.",
    ],
    mvpExperiment:
      "Speak to 10 target users and document their current workaround, pain intensity, and willingness to try a solution.",
    sevenDayPlan: [
      { day: "Day 1", text: "Define one target user segment" },
      { day: "Day 2-3", text: "Talk to 10 users" },
      { day: "Day 4", text: "Identify repeated pain points" },
      { day: "Day 5", text: "Draft one simple offer" },
      { day: "Day 6", text: "Test the offer with 5 users" },
      { day: "Day 7", text: "Decide whether to build, pivot, or pause" },
    ],
    improvedPitch: "We help [specific user] solve [specific pain] through [simple solution].",
    reflectionQuestion: "What evidence would convince you not to build this?",
  },
  discovery_ready: {
    summary:
      "You have a direction and some early clarity, but a few important assumptions still need validation before you commit to building.",
    strengths: [
      "You can describe the problem and who experiences it.",
      "You have a starting point for reaching early users.",
    ],
    assumptions: [
      "Whether the customer segment you picked is the one that feels the pain most.",
      "Whether people will take real action (time, money, referral) to solve this problem.",
    ],
    mvpExperiment:
      "Run 10 structured discovery conversations to confirm the problem, the customer, and the first channel before building anything.",
    sevenDayPlan: [
      { day: "Day 1", text: "Write down your top 3 assumptions" },
      { day: "Day 2-3", text: "Run 10 discovery conversations" },
      { day: "Day 4", text: "Cluster the strongest patterns you heard" },
      { day: "Day 5", text: "Sketch a simple offer based on those patterns" },
      { day: "Day 6", text: "Share the offer with 5 people for reaction" },
      { day: "Day 7", text: "Decide what still needs proof before building" },
    ],
    improvedPitch: "We help [customer segment] with [specific problem] using [early solution idea].",
    reflectionQuestion: "What would you need to see to feel confident this problem is worth solving?",
  },
  mvp_candidate: {
    summary:
      "You have reasonable problem clarity and can move into a small MVP experiment. Avoid building a full product yet. Focus on testing willingness to pay and repeat usage.",
    strengths: ["Clear first customer segment.", "MVP can be tested quickly."],
    assumptions: [
      "Whether customers will pay after the first trial.",
      "Whether your first channel can generate repeatable leads.",
    ],
    mvpExperiment:
      "Run a 7-day concierge MVP with 10 target users. Deliver the service manually, collect feedback, and test payment.",
    sevenDayPlan: [
      { day: "Day 1", text: "List first 10 users" },
      { day: "Day 2", text: "Send founder-led outreach" },
      { day: "Day 3", text: "Run 3 discovery calls" },
      { day: "Day 4", text: "Deliver manual MVP to 2 users" },
      { day: "Day 5", text: "Ask for payment or commitment" },
      { day: "Day 6", text: "Capture objections" },
      { day: "Day 7", text: "Decide what to build next" },
    ],
    improvedPitch: "We help [specific customer] achieve [outcome] without [current pain].",
    reflectionQuestion: "What part of your product can remain manual until customers prove they care?",
  },
  pilot_ready: {
    summary:
      "You have enough clarity to run a controlled pilot. Your focus should now shift from building features to measuring adoption, payment, and repeat usage.",
    strengths: [
      "Strong problem and customer clarity.",
      "Early evidence suggests users may adopt the solution.",
    ],
    assumptions: [
      "Whether users return without founder pushing.",
      "Whether the payer sees enough value to continue.",
    ],
    mvpExperiment: "Run a 2-week pilot with 3-5 customers. Define success metrics before starting.",
    sevenDayPlan: [
      { day: "Day 1", text: "Define pilot success metrics" },
      { day: "Day 2", text: "Confirm pilot users" },
      { day: "Day 3", text: "Set up MVP workflow" },
      { day: "Day 4-6", text: "Run pilot and capture usage" },
      { day: "Day 7", text: "Review adoption, payment, and objections" },
    ],
    improvedPitch:
      "We help [customer segment] improve [business/personal outcome] by [solution], measured through [success metric].",
    reflectionQuestion: "If this pilot works, what is the next repeatable channel to find similar customers?",
  },
  revenue_ready: {
    summary:
      "You have real signs of payment, repeat use, or adoption. The focus now is proving the model holds as you grow, not proving the idea works.",
    strengths: [
      "You have evidence customers pay or return.",
      "You have a repeatable way to reach new customers.",
    ],
    assumptions: [
      "Whether this growth channel keeps working as you scale past your first customers.",
      "Whether margins and delivery hold up as volume increases.",
    ],
    mvpExperiment:
      "Run a small growth experiment: double down on your best channel with 20 new customers and track cost, conversion, and repeat rate.",
    sevenDayPlan: [
      { day: "Day 1", text: "Review what is driving repeat usage or payment" },
      { day: "Day 2", text: "Identify your single best acquisition channel" },
      { day: "Day 3-4", text: "Push that channel to 20 new prospects" },
      { day: "Day 5", text: "Track conversion and cost per customer" },
      { day: "Day 6", text: "Check delivery quality holds at higher volume" },
      { day: "Day 7", text: "Decide where to invest next" },
    ],
    improvedPitch:
      "We help [customer segment] achieve [proven outcome], already trusted by [early customers/evidence].",
    reflectionQuestion: "What would need to be true for this channel to bring you 10x the customers?",
  },
};

export function mockEvaluate(input: MockEvaluateInput): EvaluationResult {
  const responses = input.responses ?? [];
  const dimensionScores = computeDimensionScores(responses);

  const backendScore = Math.max(
    0,
    Math.min(100, DIMENSIONS.reduce((sum, dim) => sum + dimensionScores[dim], 0))
  );

  const readinessStage = stageForScore(backendScore);
  const copy = STAGE_COPY[readinessStage];

  const result: EvaluationResult = {
    backendScore,
    dimensionScores,
    readinessStage,
    summary: copy.summary,
    strengths: [...copy.strengths],
    assumptions: [...copy.assumptions],
    mvpExperiment: copy.mvpExperiment,
    sevenDayPlan: copy.sevenDayPlan.map((d) => ({ ...d })),
    improvedPitch: copy.improvedPitch,
    reflectionQuestion: copy.reflectionQuestion,
  };

  return EvaluationResultSchema.parse(result);
}
