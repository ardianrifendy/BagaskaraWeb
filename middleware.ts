import { NextRequest, NextResponse } from "next/server";

// Proteksi rute SMS
const PROTECTED_SMS_PATHS = ["/sms", "/api/sms"];
// Proteksi rute Stok
const PROTECTED_STOK_PATHS = ["/stok"];

function isSmsPath(pathname: string): boolean {
  return PROTECTED_SMS_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isStokPath(pathname: string): boolean {
  return PROTECTED_STOK_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Tangani proteksi SMS
  if (isSmsPath(pathname)) {
    // Exclude halaman login SMS
    if (
      pathname === "/sms/login" ||
      pathname.startsWith("/sms/login/") ||
      pathname === "/api/sms-auth" ||
      pathname.startsWith("/api/sms-auth/")
    ) {
      return NextResponse.next();
    }

    const password = process.env.SMS_DASHBOARD_PASSWORD;
    if (!password) {
      return NextResponse.next();
    }

    const token = request.cookies.get("sms_auth_token")?.value;
    const expectedToken = btoa(password);

    if (token === expectedToken) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Silakan login ke dashboard." },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/sms/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Tangani proteksi Stok
  if (isStokPath(pathname)) {
    // Exclude halaman login Stok
    if (pathname === "/stok/login" || pathname.startsWith("/stok/login/")) {
      return NextResponse.next();
    }

    const pin = process.env.STOK_PIN || "bagaskara";
    const token = request.cookies.get("stok_auth_token")?.value;
    const expectedToken = btoa(pin);

    if (token === expectedToken) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/stok/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/sms/:path*", "/api/sms/:path*", "/stok/:path*"],
};

