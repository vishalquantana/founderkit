import { describe, it, expect } from "vitest";
import { tallyVotes } from "@/db/queries/polls";

describe("tallyVotes", () => {
  it("buckets votes and ignores out-of-range", () => {
    expect(tallyVotes([0, 0, 1, 2, 5, -1], 3)).toEqual({ counts: [2, 1, 1], total: 4 });
  });

  it("zero-fills with no votes", () => {
    expect(tallyVotes([], 4)).toEqual({ counts: [0, 0, 0, 0], total: 0 });
  });
});
