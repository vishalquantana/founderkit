import { describe, it, expect } from "vitest";
import { resolveInitialTheme, nextTheme, THEME_STORAGE_KEY, FONT_STORAGE_KEY } from "@/lib/theme";

describe("resolveInitialTheme", () => {
  it("defaults to light when nothing is stored", () => {
    expect(resolveInitialTheme(null)).toBe("light");
  });

  it("returns dark only for the exact 'dark' string", () => {
    expect(resolveInitialTheme("dark")).toBe("dark");
  });

  it("falls back to light for any unexpected value", () => {
    expect(resolveInitialTheme("light")).toBe("light");
    expect(resolveInitialTheme("purple")).toBe("light");
    expect(resolveInitialTheme("")).toBe("light");
  });

  it("exposes the storage keys", () => {
    expect(THEME_STORAGE_KEY).toBe("mrs-theme");
    expect(FONT_STORAGE_KEY).toBe("mrs-fontpx");
  });
});

describe("nextTheme", () => {
  it("flips light to dark and back", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});
