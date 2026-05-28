import { NextResponse } from "next/server";

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? "admin@ordy.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ordy1234";

// Cambiar mas tarde a login con bdd y contraseñas encriptadas en hash
export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("ordy_auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 horas
    path: "/",
  });

  return res;
}