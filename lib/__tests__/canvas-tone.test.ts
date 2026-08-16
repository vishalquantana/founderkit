import { describe, it, expect } from "vitest";
import { canvasCellTone } from "@/lib/result-view";

describe("canvasCellTone", () => {
  it("is empty when there is no answer", () => {
    expect(canvasCellTone(false, 8, 10)).toBe("empty");
    expect(canvasCellTone(false, undefined, undefined)).toBe("empty");
  });

  it("is good when filled but unscored (template extras)", () => {
    expect(canvasCellTone(true, undefined, undefined)).toBe("good");
    expect(canvasCellTone(true, 5, 0)).toBe("good");
  });

  it("maps score bands to tones when filled + scored", () => {
    expect(canvasCellTone(true, 8, 10)).toBe("good"); // 0.8 >= 0.7
    expect(canvasCellTone(true, 7, 10)).toBe("good"); // 0.7 boundary
    expect(canvasCellTone(true, 5, 10)).toBe("needs-work"); // 0.5
    expect(canvasCellTone(true, 4, 10)).toBe("needs-work"); // 0.4 boundary
    expect(canvasCellTone(true, 3, 10)).toBe("bad"); // 0.3
    expect(canvasCellTone(true, 0, 10)).toBe("bad");
  });
});
