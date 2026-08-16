import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  // Keep presenters signed in as long as practical (180 days); the JWT is
  // refreshed on activity (updateAge default 24h), so an active presenter
  // effectively never gets logged out.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 180 },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/workshops") ||
        pathname.startsWith("/present");
      if (isProtected) return !!auth?.user;
      return true;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
