import { describe, it, expect } from "vitest";
import { hasVoted } from "@/lib/voting";

describe("hasVoted", () => {
  it("returns false for an empty list", () => {
    expect(hasVoted([], "poll-1")).toBe(false);
  });

  it("returns false when the id is not present", () => {
    expect(hasVoted(["poll-1", "poll-2"], "poll-3")).toBe(false);
  });

  it("returns true when the id is present", () => {
    expect(hasVoted(["poll-1", "poll-2"], "poll-2")).toBe(true);
  });
});
