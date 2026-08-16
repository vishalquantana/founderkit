import { describe, it, expect } from "vitest";
import { canvasCellTone } from "@/lib/result-view";

describe("canvasCellTone", () => {
  it("is empty when unscored", () => {
    expect(canvasCellTone(undefined, undefined)).toBe("empty");
    expect(canvasCellTone(5, 0)).toBe("empty");
  });
  it("maps score bands to tones", () => {
    expect(canvasCellTone(8, 10)).toBe("strong"); // 0.8
    expect(canvasCellTone(5, 10)).toBe("growing"); // 0.5
    expect(canvasCellTone(2, 10)).toBe("sharpen"); // 0.2
  });
});
