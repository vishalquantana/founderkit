import { describe, it, expect } from "vitest";
import { hasVoted, recordChoice, getChoice } from "@/lib/voting";

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

describe("recordChoice / getChoice", () => {
  it("is SSR-safe: never throws without a DOM/localStorage", () => {
    expect(() => recordChoice("poll-1", 2)).not.toThrow();
    expect(() => getChoice("poll-1")).not.toThrow();
  });

  it("returns null for a poll with no recorded choice", () => {
    expect(getChoice("poll-never-answered")).toBeNull();
  });
});
