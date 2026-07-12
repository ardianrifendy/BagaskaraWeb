import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const res = await fetch("https://instances.cobalt.best/api/v1/instances", {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error(`HTTP error status ${res.status}`);
    }

    const data = await res.json();
    // Filter instances supporting youtube and status up
    const active = data.filter((ins: any) =>
      (ins.status === "up" || ins.alive) &&
      ins.api &&
      !ins.url.includes("localhost")
    );

    return NextResponse.json({
      ok: true,
      total_active: active.length,
      instances: active.slice(0, 15).map((ins: any) => ins.api || ins.url)
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || String(err)
    });
  }
}
