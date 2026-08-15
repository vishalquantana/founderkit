import { describe, it, expect } from "vitest";
import { generateOtp, hashOtp, verifyOtp } from "../otp";

describe("otp", () => {
  it("generates a 6-digit numeric code", () => {
    const code = generateOtp();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("hashes and verifies", async () => {
    const code = generateOtp();
    const hash = await hashOtp(code);
    expect(hash).not.toBe(code);
    expect(await verifyOtp(code, hash)).toBe(true);
  });

  it("rejects a wrong code", async () => {
    const hash = await hashOtp("123456");
    expect(await verifyOtp("654321", hash)).toBe(false);
  });
});
