import { describe, it, expect } from "vitest";
import { buildPdfModel } from "../model";

const result = {
  backendScore: 72,
  dimensionScores: { problemClarity: 12, customerClarity: 9, valuePayment: 15, mvpQuality: 10, distribution: 7, validation: 7, teamStageFit: 3, cashflow: 2 },
  readinessStage: "pilot_ready",
  summary: "s", strengths: ["a", "b"], assumptions: ["c", "d"],
  mvpExperiment: "m", sevenDayPlan: [{ day: "Day 1", text: "x" }],
  improvedPitch: "p", reflectionQuestion: "q",
  sectionFeedback: {
    problem: "Sharpen the problem statement.",
    customer: "Narrow the customer segment.",
    value: "Clarify the value proposition.",
    mvp: "Trim the MVP scope.",
    distribution: "Pick one channel to test first.",
    proof: "Add a concrete validation metric.",
  },
} as any;
const answers = { problem: "P", customer: "C", value: "V", mvp: "M", distribution: "D", proof: "PR" } as any;

describe("buildPdfModel", () => {
  it("maps result + answers into the 9-block Lean Canvas model", () => {
    const m = buildPdfModel({ founderName: "Asha", startupName: "KiranaLoop", result, answers });
    expect(m.stageLabel).toBe("Pilot Ready");
    expect(m.score).toBe(72);
    expect(m.blocks).toHaveLength(9);
    expect(m.strengths).toHaveLength(2);
    expect(m.stageColor).toMatch(/^#/);
  });

  it("populates blocks from the right answer sections", () => {
    const m = buildPdfModel({ founderName: "Asha", startupName: "KiranaLoop", result, answers });
    const byKey = Object.fromEntries(m.blocks.map((b) => [b.key, b]));
    expect(byKey.problem.answer).toBe("P");
    expect(byKey.solution.answer).toBe("M");
    expect(byKey.keyMetrics.answer).toBe("PR");
    expect(byKey.uniqueValueProposition.answer).toBe("V");
    expect(byKey.channels.answer).toBe("D");
    expect(byKey.customerSegments.answer).toBe("C");
  });

  it("carries the matching sectionFeedback suggestion into populated blocks", () => {
    const m = buildPdfModel({ founderName: "Asha", startupName: "KiranaLoop", result, answers });
    const byKey = Object.fromEntries(m.blocks.map((b) => [b.key, b]));
    expect(byKey.problem.suggestion).toBe(result.sectionFeedback.problem);
    expect(byKey.solution.suggestion).toBe(result.sectionFeedback.mvp);
    expect(byKey.keyMetrics.suggestion).toBe(result.sectionFeedback.proof);
    expect(byKey.uniqueValueProposition.suggestion).toBe(result.sectionFeedback.value);
    expect(byKey.channels.suggestion).toBe(result.sectionFeedback.distribution);
    expect(byKey.customerSegments.suggestion).toBe(result.sectionFeedback.customer);
  });

  it("carries the improvedPitch into the UVP sub-block (High-Level Concept)", () => {
    const m = buildPdfModel({ founderName: "Asha", startupName: "KiranaLoop", result, answers });
    const uvp = m.blocks.find((b) => b.key === "uniqueValueProposition");
    expect(uvp?.sub?.title).toBe("High-Level Concept");
    expect(uvp?.sub?.answer).toBe("p");
  });

  it("leaves uncaptured blocks with null answers", () => {
    const m = buildPdfModel({ founderName: "Asha", startupName: "KiranaLoop", result, answers });
    const byKey = Object.fromEntries(m.blocks.map((b) => [b.key, b]));
    expect(byKey.unfairAdvantage.answer).toBeNull();
    expect(byKey.costStructure.answer).toBeNull();
    expect(byKey.revenueStreams.answer).toBeNull();
  });
});
