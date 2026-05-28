import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const auth = req.cookies.get("ordy_auth")?.value;
  const { pathname } = req.nextUrl;

  // Si no está autenticado y no está en /login → redirige a /login
  if (!auth && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Si está autenticado y va a /login → redirige a /dashboard
  if (auth && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons).*)"],
};