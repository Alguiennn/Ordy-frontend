import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const auth = req.cookies.get("ordy_auth")?.value;
  const hasValidToken = auth && auth !== "true" && auth.split(".").length === 3;
  const { pathname } = req.nextUrl;

  // Si no tiene un token válido y no está en /login → redirige a /login
  if (!hasValidToken && pathname !== "/login") {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("ordy_auth");
    return res;
  }

  // Si tiene un token válido y va a /login → redirige a /dashboard
  if (hasValidToken && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons).*)"],
};