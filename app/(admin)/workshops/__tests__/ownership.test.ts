import { describe, it, expect } from "vitest";
import { assertOwnership } from "../[id]/ownership";
describe("assertOwnership (shared admin access)", () => {
  it("grants any authenticated admin access to any existing workshop", () => {
    expect(assertOwnership("u1", { ownerId: "u1" })).toBe(true);
    expect(assertOwnership("u1", { ownerId: "u2" })).toBe(true); // shared access
  });
  it("denies when not signed in or workshop missing", () => {
    expect(assertOwnership(undefined, { ownerId: "u1" })).toBe(false);
    expect(assertOwnership("u1", undefined)).toBe(false);
  });
});
