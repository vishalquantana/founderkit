import { describe, it, expect } from "vitest";
import { gaugePercent } from "@/lib/gauge";

describe("gaugePercent", () => {
  it("clamps and rounds", () => {
    expect(gaugePercent(71)).toBe(71);
    expect(gaugePercent(-5)).toBe(0);
    expect(gaugePercent(140)).toBe(100);
    expect(gaugePercent(71.6)).toBe(72);
  });
});
