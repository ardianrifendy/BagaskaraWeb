import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/media-downloader/rate-limit";
import { resolveMedia } from "@/lib/media-downloader/providers";
import { MediaResolveError, type MediaErrorCode } from "@/lib/media-downloader/types";

export const dynamic = "force-dynamic";

function statusForCode(code: MediaErrorCode): number {
  switch (code) {
    case "INVALID_URL":
    case "UNSUPPORTED_PLATFORM":
      return 400;
    case "PRIVATE_OR_NOT_FOUND":
      return 404;
    case "RATE_LIMITED":
      return 429;
    case "PROVIDER_ERROR":
      return 502;
    default:
      return 502;
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_URL",
        message: "Link tidak valid. Pastikan Anda menyalin link lengkap dari aplikasi.",
      },
      { status: 400 }
    );
  }

  const url =
    typeof body === "object" && body !== null && "url" in body
      ? (body as { url?: unknown }).url
      : undefined;

  if (typeof url !== "string" || url.trim().length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_URL",
        message: "Link tidak valid. Pastikan Anda menyalin link lengkap dari aplikasi.",
      },
      { status: 400 }
    );
  }

  if (checkRateLimit(getClientIp(request))) {
    return NextResponse.json(
      {
        ok: false,
        error: "RATE_LIMITED",
        message: "Terlalu banyak permintaan. Silakan coba lagi dalam satu menit.",
      },
      { status: 429 }
    );
  }

  try {
    const result = await resolveMedia(url);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof MediaResolveError) {
      return NextResponse.json(
        { ok: false, error: err.code, message: err.message },
        { status: statusForCode(err.code) }
      );
    }

    console.error("[api/media-downloader/resolve] unexpected error", err);
    return NextResponse.json(
      {
        ok: false,
        error: "PROVIDER_ERROR",
        message: "Terjadi kendala saat memproses link. Silakan coba beberapa saat lagi.",
      },
      { status: 500 }
    );
  }
}
