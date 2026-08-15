import { describe, it, expect } from "vitest";
import { newId, newJoinCode } from "../ids";

describe("ids", () => {
  it("newId returns a 21-char unique string", () => {
    expect(newId()).toHaveLength(21);
    expect(newId()).not.toBe(newId());
  });
  it("newJoinCode is 6 uppercase chars without ambiguous characters", () => {
    const code = newJoinCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
});
