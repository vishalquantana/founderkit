import { describe, it, expect } from "vitest";
import { progressPercent } from "../ProgressBar";

describe("progressPercent", () => {
  it("computes clamped percentages", () => {
    expect(progressPercent(1, 6)).toBe(17);
    expect(progressPercent(6, 6)).toBe(100);
    expect(progressPercent(0, 6)).toBe(0);
    expect(progressPercent(9, 6)).toBe(100);
  });
});
