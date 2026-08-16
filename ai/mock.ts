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

const SECTION_LABEL: Record<SectionKey, string> = {
  problem: "the problem",
  customer: "your customer",
  value: "value and payment",
  mvp: "your MVP experiment",
  distribution: "distribution",
  proof: "your proof",
};

const SECTION_NEXT: Record<SectionKey, string> = {
  problem: "the customer segment",
  customer: "whether they will pay",
  value: "the MVP experiment",
  mvp: "your first distribution channel",
  distribution: "repeat usage",
  proof: "your next pilot",
};

/**
 * Deterministic, band-based improvement sentence per section. Low sub-scores
 * (< 50% of that dimension's max) get a "sharpen/clarify" nudge; high
 * sub-scores get an encouraging "nailed it, validate next" nudge. Uses only
 * the responses + already-computed dimensionScores — no randomness, no Date.
 */
function computeSectionFeedback(
  dimensionScores: Record<Dimension, number>
): EvaluationResult["sectionFeedback"] {
  const band = (score: number, max: number): "low" | "high" =>
    score / max >= 0.5 ? "high" : "low";

  const feedbackFor = (section: SectionKey, score: number, max: number): string => {
    const label = SECTION_LABEL[section];
    if (band(score, max) === "low") {
      return `Sharpen and clarify ${label} with a few concrete details before moving on.`;
    }
    return `You've nailed ${label} — next validate ${SECTION_NEXT[section]}.`;
  };

  return {
    problem: feedbackFor("problem", dimensionScores.problemClarity, DIMENSION_MAX.problemClarity),
    customer: feedbackFor("customer", dimensionScores.customerClarity, DIMENSION_MAX.customerClarity),
    value: feedbackFor("value", dimensionScores.valuePayment, DIMENSION_MAX.valuePayment),
    mvp: feedbackFor("mvp", dimensionScores.mvpQuality, DIMENSION_MAX.mvpQuality),
    distribution: feedbackFor("distribution", dimensionScores.distribution, DIMENSION_MAX.distribution),
    proof: feedbackFor("proof", dimensionScores.validation, DIMENSION_MAX.validation),
  };
}

/**
 * Deterministic, band-based one-sentence justification per dimension score.
 * Reuses the same 50%-of-max threshold as computeSectionFeedback. No
 * randomness, no Date — purely a function of the already-computed scores.
 */
const DIMENSION_JUSTIFICATION: Record<Dimension, { high: string; low: string }> = {
  problemClarity: {
    high: "Clear, specific problem tied to a real segment — well articulated.",
    low: "Problem is still broad — add who feels it and how often.",
  },
  customerClarity: {
    high: "User, payer, and influencer roles are named and distinct.",
    low: "Customer roles are still fuzzy — name who uses, pays, and influences.",
  },
  valuePayment: {
    high: "Willingness to pay is backed by pricing or commitments already in hand.",
    low: "Payment readiness is unproven — show pricing or a pre-commitment.",
  },
  mvpQuality: {
    high: "MVP is a lean, testable experiment rather than a full build.",
    low: "MVP still leans toward a full product — cut it down to one testable step.",
  },
  distribution: {
    high: "First channel is concrete and has already produced early reach.",
    low: "Distribution channel is vague — name the exact first channel to use.",
  },
  validation: {
    high: "Real evidence (pilots, conversations, repeat use) backs the idea.",
    low: "Validation evidence is thin — gather more direct user proof.",
  },
  teamStageFit: {
    high: "Founder execution signal matches the current stage well.",
    low: "Execution signal is light for this stage — show more hands-on delivery.",
  },
  cashflow: {
    high: "Early revenue or pricing signal gives some cashflow runway.",
    low: "Cashflow signal is weak — clarify pricing or early revenue plans.",
  },
};

function computeDimensionJustifications(
  dimensionScores: Record<Dimension, number>
): EvaluationResult["dimensionJustifications"] {
  const band = (dim: Dimension): "high" | "low" =>
    dimensionScores[dim] / DIMENSION_MAX[dim] >= 0.5 ? "high" : "low";

  return {
    problemClarity: DIMENSION_JUSTIFICATION.problemClarity[band("problemClarity")],
    customerClarity: DIMENSION_JUSTIFICATION.customerClarity[band("customerClarity")],
    valuePayment: DIMENSION_JUSTIFICATION.valuePayment[band("valuePayment")],
    mvpQuality: DIMENSION_JUSTIFICATION.mvpQuality[band("mvpQuality")],
    distribution: DIMENSION_JUSTIFICATION.distribution[band("distribution")],
    validation: DIMENSION_JUSTIFICATION.validation[band("validation")],
    teamStageFit: DIMENSION_JUSTIFICATION.teamStageFit[band("teamStageFit")],
    cashflow: DIMENSION_JUSTIFICATION.cashflow[band("cashflow")],
  };
}

/**
 * Deterministic 2-3 imperative recommendations per section, lightly varied
 * by that section's dimension score band. No randomness, no Date.
 */
const SECTION_RECOMMENDATIONS: Record<SectionKey, { high: string[]; low: string[] }> = {
  problem: {
    high: [
      "Quantify the pain in hours or dollars lost.",
      "Confirm the problem recurs, not a one-off complaint.",
    ],
    low: [
      "Name the exact sub-segment that feels this problem most.",
      "Quantify the pain in hours or dollars.",
      "Describe the current workaround people use today.",
    ],
  },
  customer: {
    high: [
      "Confirm the payer and user agree on the value delivered.",
      "Map the influencer who nudges the buying decision.",
    ],
    low: [
      "Separate the user, payer, and influencer into distinct people.",
      "Interview the likely payer directly, not just the user.",
      "Note who could block adoption even if the product works.",
    ],
  },
  value: {
    high: [
      "Test a small price increase with the next pilot.",
      "Ask committed customers why they said yes.",
    ],
    low: [
      "State a concrete price and ask for a pre-commitment.",
      "List what the customer currently pays to solve this problem.",
      "Offer a paid pilot instead of a free trial.",
    ],
  },
  mvp: {
    high: [
      "Strip the MVP down to the single riskiest assumption.",
      "Set a clear pass/fail metric before running it.",
    ],
    low: [
      "Cut the MVP to one manual, testable step.",
      "Deliver the first version by hand before automating it.",
      "Define what result would prove the concept.",
    ],
  },
  distribution: {
    high: [
      "Double down on the channel that is already converting.",
      "Track cost and conversion per lead on that channel.",
    ],
    low: [
      "Name the exact first channel to start with.",
      "Run a small test batch through that one channel.",
      "Track how many leads convert from that channel.",
    ],
  },
  proof: {
    high: [
      "Turn one satisfied pilot into a named reference.",
      "Track repeat usage, not just first-time signups.",
    ],
    low: [
      "Run at least 10 structured user conversations.",
      "Capture concrete evidence of repeat use or payment.",
      "Convert a soft yes into a real pilot commitment.",
    ],
  },
};

function computeSectionRecommendations(
  dimensionScores: Record<Dimension, number>
): EvaluationResult["sectionRecommendations"] {
  const band = (dim: Dimension): "high" | "low" =>
    dimensionScores[dim] / DIMENSION_MAX[dim] >= 0.5 ? "high" : "low";

  return {
    problem: [...SECTION_RECOMMENDATIONS.problem[band("problemClarity")]],
    customer: [...SECTION_RECOMMENDATIONS.customer[band("customerClarity")]],
    value: [...SECTION_RECOMMENDATIONS.value[band("valuePayment")]],
    mvp: [...SECTION_RECOMMENDATIONS.mvp[band("mvpQuality")]],
    distribution: [...SECTION_RECOMMENDATIONS.distribution[band("distribution")]],
    proof: [...SECTION_RECOMMENDATIONS.proof[band("validation")]],
  };
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
    sectionFeedback: computeSectionFeedback(dimensionScores),
    dimensionJustifications: computeDimensionJustifications(dimensionScores),
    sectionRecommendations: computeSectionRecommendations(dimensionScores),
  };

  return EvaluationResultSchema.parse(result);
}
