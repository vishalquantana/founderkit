import { auth } from "@/auth";

export default auth((req) => {
  const isLogin = req.nextUrl.pathname === "/login";
  if (!req.auth && !isLogin) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/workshops/:path*"],
};
