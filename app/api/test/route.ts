import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = "https://www.youtube.com/watch?v=q6t07d2HwS4";
  const format = "mp3";
  const downloadUrl = `https://loader.to/api/ajax/download.php?url=${encodeURIComponent(url)}&format=${format}`;

  try {
    const res = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://loader.to/",
        "Origin": "https://loader.to"
      },
      cache: "no-store"
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON
    }

    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      isJson: json !== null,
      data: json || text.substring(0, 1000)
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || String(err)
    });
  }
}
