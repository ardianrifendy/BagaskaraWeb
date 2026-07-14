import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from") || "MYR";

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=IDR`, {
      next: { revalidate: 300 }, // Cache 5 menit di server
    });

    if (!res.ok) {
      throw new Error("Gagal mengambil data dari API Frankfurter.");
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, rate: data.rates.IDR });
  } catch (error) {
    console.error("Forex API proxy error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal mengambil kurs terbaru dari server." },
      { status: 500 }
    );
  }
}
