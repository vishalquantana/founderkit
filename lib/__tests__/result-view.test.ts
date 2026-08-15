import { describe, it, expect } from "vitest";
import { stageColorClasses, cellFeedback, LEAN_CANVAS_BLOCKS } from "../result-view";

describe("result-view helpers", () => {
  it("gives distinct classes per stage and never uses red", () => {
    const s = stageColorClasses("mvp_candidate");
    expect(s.badge).toMatch(/purple|violet/);
    expect(JSON.stringify(stageColorClasses("idea_clarity"))).not.toMatch(/red/);
  });
  it("maps score ratio to encouraging feedback", () => {
    expect(cellFeedback(14, 15).tone).toBe("strong");
    expect(cellFeedback(8, 15).tone).toBe("growing");
    expect(cellFeedback(3, 15).tone).toBe("sharpen");
    expect(cellFeedback(3, 15).label).not.toMatch(/bad|weak|fail/i);
  });

  it("has the 9 authentic Lean Canvas blocks with correct titles", () => {
    expect(LEAN_CANVAS_BLOCKS.map((b) => b.title)).toEqual([
      "Problem",
      "Solution",
      "Key Metrics",
      "Unique Value Proposition",
      "Unfair Advantage",
      "Channels",
      "Customer Segments",
      "Cost Structure",
      "Revenue Streams",
    ]);
  });

  it("gives Problem / UVP / Customer Segments the correct sub-sections", () => {
    const byKey = Object.fromEntries(LEAN_CANVAS_BLOCKS.map((b) => [b.key, b]));
    expect(byKey.problem.sub?.title).toBe("Existing Alternatives");
    expect(byKey.uniqueValueProposition.sub?.title).toBe("High-Level Concept");
    expect(byKey.customerSegments.sub?.title).toBe("Early Adopters");
    expect(byKey.uniqueValueProposition.sub?.pitchSource).toBe(true);
  });

  it("maps the app's 6 sections onto the correct blocks", () => {
    const byKey = Object.fromEntries(LEAN_CANVAS_BLOCKS.map((b) => [b.key, b]));
    expect(byKey.problem.source).toBe("problem");
    expect(byKey.problem.dimension).toBe("problemClarity");
    expect(byKey.solution.source).toBe("mvp");
    expect(byKey.solution.dimension).toBe("mvpQuality");
    expect(byKey.keyMetrics.source).toBe("proof");
    expect(byKey.keyMetrics.dimension).toBe("validation");
    expect(byKey.uniqueValueProposition.source).toBe("value");
    expect(byKey.uniqueValueProposition.dimension).toBe("valuePayment");
    expect(byKey.channels.source).toBe("distribution");
    expect(byKey.channels.dimension).toBe("distribution");
    expect(byKey.customerSegments.source).toBe("customer");
    expect(byKey.customerSegments.dimension).toBe("customerClarity");
  });

  it("leaves unfairAdvantage / costStructure / revenueStreams uncaptured", () => {
    const byKey = Object.fromEntries(LEAN_CANVAS_BLOCKS.map((b) => [b.key, b]));
    expect(byKey.unfairAdvantage.source).toBeUndefined();
    expect(byKey.costStructure.source).toBeUndefined();
    expect(byKey.revenueStreams.source).toBeUndefined();
  });
});
