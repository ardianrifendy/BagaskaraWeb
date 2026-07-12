import { NextRequest, NextResponse } from "next/server";
import { TOP_100_CRYPTOS } from "@/lib/prediction/providers/coingecko";
import { searchYahooStock } from "@/lib/prediction/providers/yahoo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ ok: true, results: [] });
  }

  const qLower = query.toLowerCase().trim();

  // 1. Cari Kripto dari list lokal (Top 100)
  const cryptoResults = TOP_100_CRYPTOS.filter(
    (c) =>
      c.id.toLowerCase().includes(qLower) ||
      c.symbol.toLowerCase().includes(qLower) ||
      c.name.toLowerCase().includes(qLower)
  ).map((c) => ({
    id: c.id,
    symbol: c.symbol,
    name: c.name,
    type: "crypto"
  }));

  // 2. Cari Saham IDX via Yahoo Finance
  interface StockResult { id: string; symbol: string; name: string; type: string; }
  let stockResults: StockResult[] = [];
  try {
    const yahooResults = await searchYahooStock(qLower);
    stockResults = yahooResults.map((s: { symbol: string; name: string; }) => ({
      // Simpan simbol Yahoo asli di ID (misal: "BBCA.JK") namun dalam lowercase untuk membedakan di route
      id: s.symbol.toLowerCase(),
      symbol: s.symbol.replace(".JK", ""),
      name: s.name,
      type: "stock"
    }));
  } catch (err) {
    console.error("Failed search stocks:", err);
  }

  // Gabungkan hasil pencarian
  const results = [...cryptoResults, ...stockResults];

  return NextResponse.json({
    ok: true,
    results: results.slice(0, 10) // Ambil maks 10 hasil gabungan
  });
}