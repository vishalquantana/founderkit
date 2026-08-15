import { describe, it, expect } from "vitest";
import { assertOwnership } from "../[id]/ownership";
describe("assertOwnership", () => {
  it("true only when owner matches", () => {
    expect(assertOwnership("u1", { ownerId: "u1" })).toBe(true);
    expect(assertOwnership("u1", { ownerId: "u2" })).toBe(false);
    expect(assertOwnership(undefined, { ownerId: "u1" })).toBe(false);
    expect(assertOwnership("u1", undefined)).toBe(false);
  });
});
