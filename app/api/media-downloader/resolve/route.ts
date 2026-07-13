import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      error: "PROVIDER_ERROR",
      message: "Layanan Media Downloader sedang dinonaktifkan sementara untuk pemeliharaan server.",
    },
    { status: 503 }
  );
}
