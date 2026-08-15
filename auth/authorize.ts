import { getUserByEmail } from "@/db/queries/users";
import { verifyPassword } from "@/lib/passwords";

export async function authorizeCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string } | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  if (!(await verifyPassword(password, user.passwordHash))) return null;
  return { id: user.id, email: user.email, name: user.name };
}
