import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

export function generateOtp(): string {
  const n = randomInt(0, 1_000_000);
  return String(n).padStart(6, "0");
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
