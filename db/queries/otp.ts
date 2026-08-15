import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "../client";
import { otpCodes } from "../schema";
import { newId } from "@/lib/ids";

export async function createOtp(email: string, codeHash: string, expiresAt: Date): Promise<void> {
  await db.insert(otpCodes).values({ id: newId(), email, codeHash, expiresAt });
}

export async function findActiveOtp(
  email: string,
): Promise<{ id: string; codeHash: string } | undefined> {
  const row = await db.query.otpCodes.findFirst({
    where: and(
      eq(otpCodes.email, email),
      isNull(otpCodes.consumedAt),
      gt(otpCodes.expiresAt, new Date()),
    ),
    orderBy: desc(otpCodes.createdAt),
  });
  if (!row) return undefined;
  return { id: row.id, codeHash: row.codeHash };
}

export async function consumeOtp(id: string): Promise<void> {
  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, id));
}
