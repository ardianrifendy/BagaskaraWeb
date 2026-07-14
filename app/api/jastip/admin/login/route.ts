import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const password = process.env.JASTIP_ADMIN_PASSWORD;

  if (!password) {
    return NextResponse.json(
      { ok: false, error: "Konfigurasi JASTIP_ADMIN_PASSWORD belum diatur di server." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const inputPassword = body.password?.trim() ?? "";

  if (inputPassword !== password) {
    return NextResponse.json({ ok: false, error: "Password salah." }, { status: 401 });
  }

  const token = btoa(password);

  const response = NextResponse.json({ ok: true });
  response.cookies.set("jastip_auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 jam session cookie
  });

  return response;
}
