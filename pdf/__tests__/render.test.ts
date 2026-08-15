import { describe, it, expect } from "vitest";
import { buildPdfModel } from "../model";
import { renderResultPdf } from "../ResultDocument";

it("renders a non-empty PDF buffer", async () => {
  const model = buildPdfModel({
    founderName: "Asha", startupName: "KiranaLoop",
    result: {
      backendScore: 72,
      dimensionScores: { problemClarity: 12, customerClarity: 9, valuePayment: 15, mvpQuality: 10, distribution: 7, validation: 7, teamStageFit: 3, cashflow: 2 },
      readinessStage: "pilot_ready", summary: "s", strengths: ["a", "b"], assumptions: ["c", "d"],
      mvpExperiment: "m", sevenDayPlan: [{ day: "Day 1", text: "x" }], improvedPitch: "p", reflectionQuestion: "q",
    } as any,
    answers: { problem: "P", customer: "C", value: "V", mvp: "M", distribution: "D", proof: "PR" } as any,
  });
  const buf = await renderResultPdf(model);
  expect(buf.length).toBeGreaterThan(1000);
  expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
});
