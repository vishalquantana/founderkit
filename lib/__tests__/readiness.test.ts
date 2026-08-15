import { describe, it, expect } from "vitest";
import { stageForScore, DIMENSION_MAX } from "../readiness";

describe("readiness", () => {
  it("maps scores to stages at boundaries", () => {
    expect(stageForScore(0)).toBe("idea_clarity");
    expect(stageForScore(25)).toBe("idea_clarity");
    expect(stageForScore(26)).toBe("discovery_ready");
    expect(stageForScore(45)).toBe("discovery_ready");
    expect(stageForScore(46)).toBe("mvp_candidate");
    expect(stageForScore(65)).toBe("mvp_candidate");
    expect(stageForScore(66)).toBe("pilot_ready");
    expect(stageForScore(80)).toBe("pilot_ready");
    expect(stageForScore(81)).toBe("revenue_ready");
    expect(stageForScore(100)).toBe("revenue_ready");
  });
  it("dimension maxima sum to 100", () => {
    expect(Object.values(DIMENSION_MAX).reduce((a, b) => a + b, 0)).toBe(100);
  });
});
