import { describe, it, expect } from "vitest";
import { mockEvaluate } from "../mock";
import { EvaluationResultSchema } from "../schema";

const responses = [
  { section: "problem" as const, mainAnswer: "For small kirana stores, losing repeat customers to apps reduces daily sales." },
  { section: "customer" as const, mainAnswer: "User is the shopkeeper, payer is the owner, coach influences." },
  { section: "value" as const, mainAnswer: "They pay a monthly fee; two shops pre-committed." },
  { section: "mvp" as const, mainAnswer: "A WhatsApp concierge MVP to test reorders." },
  { section: "distribution" as const, mainAnswer: "First 10 from my local market visits." },
  { section: "proof" as const, mainAnswer: "Spoke to 12 shopkeepers, 2 paid pilots." },
];

describe("mockEvaluate", () => {
  it("returns a schema-valid, deterministic result", () => {
    const a = mockEvaluate({ responses });
    const b = mockEvaluate({ responses });
    expect(EvaluationResultSchema.safeParse(a).success).toBe(true);
    expect(a).toEqual(b);
    expect(a.strengths).toHaveLength(2);
    expect(a.backendScore).toBeGreaterThan(0);
    expect(Object.keys(a.sectionFeedback).sort()).toEqual(
      ["customer", "distribution", "mvp", "problem", "proof", "value"].sort()
    );
    for (const v of Object.values(a.sectionFeedback)) {
      expect(typeof v).toBe("string");
      expect(v.length).toBeGreaterThan(0);
    }
  });

  it("produces dimension justifications for all 8 dimensions", () => {
    const r = mockEvaluate({ responses });
    expect(Object.keys(r.dimensionJustifications ?? {}).sort()).toEqual(
      [
        "problemClarity", "customerClarity", "valuePayment", "mvpQuality",
        "distribution", "validation", "teamStageFit", "cashflow",
      ].sort()
    );
    for (const v of Object.values(r.dimensionJustifications ?? {})) {
      expect(typeof v).toBe("string");
      expect(v.length).toBeGreaterThan(0);
    }
  });

  it("produces 2-3 recommendations per section", () => {
    const r = mockEvaluate({ responses });
    expect(Object.keys(r.sectionRecommendations ?? {}).sort()).toEqual(
      ["customer", "distribution", "mvp", "problem", "proof", "value"].sort()
    );
    for (const list of Object.values(r.sectionRecommendations ?? {})) {
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(list.length).toBeLessThanOrEqual(3);
      for (const item of list) {
        expect(typeof item).toBe("string");
        expect(item.length).toBeGreaterThan(0);
      }
    }
  });
  it("empty answers score low → idea_clarity", () => {
    const r = mockEvaluate({ responses: [] });
    expect(r.readinessStage).toBe("idea_clarity");
  });
});
