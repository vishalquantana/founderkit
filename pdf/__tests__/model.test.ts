import { describe, it, expect } from "vitest";
import { buildPdfModel } from "../model";

const result = {
  backendScore: 72,
  dimensionScores: { problemClarity: 12, customerClarity: 9, valuePayment: 15, mvpQuality: 10, distribution: 7, validation: 7, teamStageFit: 3, cashflow: 2 },
  readinessStage: "pilot_ready",
  summary: "s", strengths: ["a", "b"], assumptions: ["c", "d"],
  mvpExperiment: "m", sevenDayPlan: [{ day: "Day 1", text: "x" }],
  improvedPitch: "p", reflectionQuestion: "q",
} as any;
const answers = { problem: "P", customer: "C", value: "V", mvp: "M", distribution: "D", proof: "PR" } as any;

describe("buildPdfModel", () => {
  it("maps result + answers into a 6-cell canvas model", () => {
    const m = buildPdfModel({ founderName: "Asha", startupName: "KiranaLoop", result, answers });
    expect(m.stageLabel).toBe("Pilot Ready");
    expect(m.score).toBe(72);
    expect(m.cells).toHaveLength(6);
    expect(m.cells.find((c) => c.title.toLowerCase().includes("problem"))?.answer).toBe("P");
    expect(m.strengths).toHaveLength(2);
    expect(m.stageColor).toMatch(/^#/);
  });
});
