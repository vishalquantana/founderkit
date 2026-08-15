import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { authorizeCredentials } from "@/auth/authorize";
import { getUserByEmail } from "@/db/queries/users";
import { findActiveOtp, consumeOtp } from "@/db/queries/otp";
import { verifyOtp } from "@/lib/otp";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = creds?.email as string | undefined;
        const password = creds?.password as string | undefined;
        if (!email || !password) return null;
        return authorizeCredentials(email, password);
      },
    }),
    Credentials({
      id: "otp",
      credentials: { email: {}, code: {} },
      authorize: async (creds) => {
        const email = creds?.email as string | undefined;
        const code = creds?.code as string | undefined;
        if (!email || !code) return null;

        const user = await getUserByEmail(email);
        if (!user) return null;

        const active = await findActiveOtp(email);
        if (!active) return null;

        const valid = await verifyOtp(code, active.codeHash);
        if (!valid) return null;

        await consumeOtp(active.id);
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
