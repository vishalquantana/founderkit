import { describe, it, expect } from "vitest";
import { resultAccessState } from "../result-guard";

describe("resultAccessState", () => {
  it("ok only when participant belongs to workshop", () => {
    expect(resultAccessState({ participant: { id: "p1", workshopId: "w1" }, workshopId: "w1" })).toBe("ok");
    expect(resultAccessState({ participant: { id: "p1", workshopId: "w2" }, workshopId: "w1" })).toBe("missing");
    expect(resultAccessState({ participant: undefined, workshopId: "w1" })).toBe("missing");
  });
});
