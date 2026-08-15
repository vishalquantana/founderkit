import { describe, it, expect } from "vitest";
import { workshopJoinState } from "../w/[code]/join-state";

describe("workshopJoinState", () => {
  it("maps status to join state", () => {
    expect(workshopJoinState(undefined)).toBe("missing");
    expect(workshopJoinState("closed")).toBe("closed");
    expect(workshopJoinState("live")).toBe("open");
    expect(workshopJoinState("draft")).toBe("open");
  });
});
