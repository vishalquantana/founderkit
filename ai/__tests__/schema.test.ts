import { describe, it, expect } from "vitest";
import { EvaluationResultSchema } from "../schema";

const valid = {
  backendScore: 52,
  dimensionScores: { problemClarity: 10, customerClarity: 8, valuePayment: 12, mvpQuality: 9, distribution: 7, validation: 4, teamStageFit: 2, cashflow: 0 },
  readinessStage: "mvp_candidate",
  summary: "s", strengths: ["a", "b"], assumptions: ["c", "d"],
  mvpExperiment: "m", sevenDayPlan: [{ day: "Day 1", text: "x" }],
  improvedPitch: "p", reflectionQuestion: "q",
  sectionFeedback: {
    problem: "Sharpen who exactly feels this pain most.",
    customer: "Clarify who pays versus who uses.",
    value: "Test whether customers will actually pay.",
    mvp: "Keep the MVP manual for now.",
    distribution: "Name your first repeatable channel.",
    proof: "Collect a few more concrete data points.",
  },
};

describe("EvaluationResultSchema", () => {
  it("accepts a valid result", () => {
    expect(EvaluationResultSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects wrong strengths length", () => {
    expect(EvaluationResultSchema.safeParse({ ...valid, strengths: ["only one"] }).success).toBe(false);
  });
  it("rejects a missing sectionFeedback key", () => {
    const { proof, ...rest } = valid.sectionFeedback;
    void proof;
    expect(
      EvaluationResultSchema.safeParse({ ...valid, sectionFeedback: rest }).success
    ).toBe(false);
  });
});
