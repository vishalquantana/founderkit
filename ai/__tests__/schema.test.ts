import { describe, it, expect } from "vitest";
import { EvaluationResultSchema } from "../schema";

const valid = {
  backendScore: 52,
  dimensionScores: { problemClarity: 10, customerClarity: 8, valuePayment: 12, mvpQuality: 9, distribution: 7, validation: 4, teamStageFit: 2, cashflow: 0 },
  readinessStage: "mvp_candidate",
  summary: "s", strengths: ["a", "b"], assumptions: ["c", "d"],
  mvpExperiment: "m", sevenDayPlan: [{ day: "Day 1", text: "x" }],
  improvedPitch: "p", reflectionQuestion: "q",
};

describe("EvaluationResultSchema", () => {
  it("accepts a valid result", () => {
    expect(EvaluationResultSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects wrong strengths length", () => {
    expect(EvaluationResultSchema.safeParse({ ...valid, strengths: ["only one"] }).success).toBe(false);
  });
});
