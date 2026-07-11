import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/sms", "/api/sms"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isExcluded(pathname: string): boolean {
  return (
    pathname === "/sms/login" ||
    pathname.startsWith("/sms/login/") ||
    pathname === "/api/sms-auth" ||
    pathname.startsWith("/api/sms-auth/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hanya proses jika path ada di daftar dilindungi dan bukan halaman login/auth
  if (!isProtectedPath(pathname) || isExcluded(pathname)) {
    return NextResponse.next();
  }

  const password = process.env.SMS_DASHBOARD_PASSWORD;

  // Jika tidak diset di environment, kita asumsikan bypass (contoh untuk local dev)
  if (!password) {
    return NextResponse.next();
  }

  const token = request.cookies.get("sms_auth_token")?.value;
  // Gunakan btoa untuk kompatibilitas edge runtime
  const expectedToken = btoa(password);

  // Jika token valid, lanjutkan request
  if (token === expectedToken) {
    return NextResponse.next();
  }

  // Jika API request, kembalikan 401 JSON
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized. Silakan login ke dashboard." },
      { status: 401 }
    );
  }

  // Redirect user ke halaman login
  const loginUrl = new URL("/sms/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/sms/:path*", "/api/sms/:path*"],
};
