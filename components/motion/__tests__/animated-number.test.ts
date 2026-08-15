import { describe, it, expect } from "vitest";
import { clampCount } from "../AnimatedNumber";

describe("clampCount", () => {
  it("rounds and clamps to target", () => {
    expect(clampCount(3.6, 100)).toBe(4);
    expect(clampCount(-2, 100)).toBe(0);
    expect(clampCount(140, 100)).toBe(100);
  });
});
