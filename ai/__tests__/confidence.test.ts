import { describe, it, expect } from "vitest";
import { estimateConfidence, LOW_CONFIDENCE } from "../confidence";

describe("confidence", () => {
  it("scores an uncertain answer low", () => {
    const score = estimateConfidence("I don't know, let me check");
    expect(score).toBeLessThanOrEqual(0.3);
    expect(score < LOW_CONFIDENCE).toBe(true);
  });

  it("scores a very short answer at or below the low-confidence threshold", () => {
    const score = estimateConfidence("Yes it works");
    expect(score).toBeLessThanOrEqual(0.5);
    expect(score <= LOW_CONFIDENCE).toBe(true);
  });

  it("scores a substantive multi-sentence answer high", () => {
    const score = estimateConfidence(
      "You should price based on the value delivered to your customer, not just your costs. Start with a simple tiered structure and test willingness to pay with real prospects."
    );
    expect(score).toBeGreaterThanOrEqual(0.9);
  });
});
