import { describe, it, expect } from "vitest";
import { POLL_OPTION_COLORS, optionColor } from "@/lib/poll-colors";

describe("optionColor", () => {
  it("returns the first colour (violet) for index 0", () => {
    expect(optionColor(0)).toBe("#8b5cf6");
  });

  it("wraps around when the index exceeds the palette length", () => {
    expect(optionColor(POLL_OPTION_COLORS.length)).toBe(optionColor(0));
    expect(optionColor(POLL_OPTION_COLORS.length + 2)).toBe(optionColor(2));
  });

  it("is negative-safe and returns a valid colour", () => {
    expect(POLL_OPTION_COLORS).toContain(optionColor(-1));
  });
});
