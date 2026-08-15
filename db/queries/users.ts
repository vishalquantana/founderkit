import { eq } from "drizzle-orm";
import { db } from "../client";
import { users } from "../schema";
import { newId } from "@/lib/ids";

export type User = typeof users.$inferSelect;

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function createUser(input: {
  email: string; name: string; passwordHash: string;
}): Promise<User> {
  const [created] = await db.insert(users).values({ id: newId(), ...input }).returning();
  return created;
}
