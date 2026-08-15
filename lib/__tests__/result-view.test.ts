import { describe, it, expect } from "vitest";
import { stageColorClasses, cellFeedback, CANVAS_CELLS } from "../result-view";

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
  it("has 6 canvas cells covering the 6 sections", () => {
    expect(CANVAS_CELLS.map((c) => c.section).sort()).toEqual(
      ["customer", "distribution", "mvp", "problem", "proof", "value"],
    );
  });
});
