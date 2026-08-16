import { describe, it, expect } from "vitest";
import { stepSlideOffset } from "@/components/motion/StepTransition";

describe("stepSlideOffset", () => {
  it("slides in from the right for forward", () => {
    expect(stepSlideOffset("forward")).toBe(24);
  });

  it("slides in from the left for back", () => {
    expect(stepSlideOffset("back")).toBe(-24);
  });
});
