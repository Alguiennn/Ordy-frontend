import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const backendRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      const detail = Array.isArray(errorData.message)
        ? errorData.message.join(", ")
        : errorData.message;
      return NextResponse.json(
        { error: detail || "Credenciales incorrectas" },
        { status: backendRes.status }
      );
    }

    const { access_token, user } = await backendRes.json();

    const res = NextResponse.json({ ok: true, user });
    res.cookies.set("ordy_auth", access_token, {
      httpOnly: false, // Accessible by both client and server-side components
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}