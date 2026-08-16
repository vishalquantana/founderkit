import { describe, it, expect } from "vitest";
import { composeSectionAnswer } from "@/lib/section-answer";

describe("composeSectionAnswer", () => {
  it("joins chip and detail with an em dash", () => {
    expect(composeSectionAnswer("Landing page MVP", "targeting SME founders"))
      .toBe("Landing page MVP — targeting SME founders");
  });
  it("returns just the chip when there is no detail", () => {
    expect(composeSectionAnswer("Landing page MVP", "   ")).toBe("Landing page MVP");
  });
  it("returns just the detail when no chip is selected", () => {
    expect(composeSectionAnswer(null, "my own answer")).toBe("my own answer");
  });
  it("returns empty string when neither is present", () => {
    expect(composeSectionAnswer(null, "   ")).toBe("");
  });
  it("trims the detail", () => {
    expect(composeSectionAnswer(null, "  hi  ")).toBe("hi");
  });
});
