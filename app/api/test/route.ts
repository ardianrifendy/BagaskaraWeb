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
      throw new Error(`HTTP error status ${res.status} from instances list`);
    }

    const data = await res.json();
    return NextResponse.json({
      ok: true,
      count: data.length,
      first_few: data.slice(0, 10).map((ins: any) => ({
        name: ins.name,
        url: ins.url,
        api: ins.api || ins.url,
        status: ins.status,
        alive: ins.alive
      }))
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || String(err)
    });
  }
}
