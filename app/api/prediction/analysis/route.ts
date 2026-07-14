import { NextRequest, NextResponse } from "next/server";
import { fetchCoinGeckoMarkets, fetchCoinGeckoChart } from "@/lib/prediction/providers/coingecko";
import { fetchUSDIDRForex } from "@/lib/prediction/providers/forex";
import { fetchFearGreedIndex } from "@/lib/prediction/providers/feargreed";
import { fetchYahooStock, YAHOO_TICKERS } from "@/lib/prediction/providers/yahoo";
import { calculateIndicators } from "@/lib/prediction/indicators";
import { calculateScenarioProbabilities } from "@/lib/prediction/score";
import { AssetSnapshot, AssetId } from "@/lib/prediction/types";

export const dynamic = "force-dynamic";

// Fungsi generator analisis deterministik 100% lokal berbasis data statistik
function generateDeterministicAnalysis(snapshot: AssetSnapshot): string {
  const sc = snapshot.scenario;
  const ind = snapshot.indicators;

  // A. Tentukan bias arah dominan
  let bias = "sideways (konsolidasi)";
  let biasProb = sc.sideways;
  let biasDir = "mendatar";

  if (sc.up > sc.down && sc.up > sc.sideways) {
    bias = "bullish (tren naik)";
    biasProb = sc.up;
    biasDir = "menguat";
  } else if (sc.down > sc.up && sc.down > sc.sideways) {
    bias = "bearish (tren turun)";
    biasProb = sc.down;
    biasDir = "melemah";
  }

  // B. Susun Kesimpulan
  const kesimpulan = `**Kesimpulan:** Berdasarkan perhitungan statistik Probability Engine atas data historis 60 hari terakhir, ${snapshot.name} (${snapshot.symbol}) untuk horizon 7 hari ke depan menunjukkan probabilitas dominan sebesar ${biasProb}% untuk bergerak dalam skenario ${bias}.`;

  // C. Susun Alasan berbasis indikator terkuat yang memiliki note
  const validDrivers = sc.drivers
    .filter(d => d.weight !== 0 && d.note)
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)); // prioritaskan bobot terbesar

  const alasanNotes = validDrivers.map(d => d.note).slice(0, 3).join(". ");
  const alasan = `**Alasan:** Kondisi ini dipengaruhi oleh indikator teknikal utama: ${alasanNotes || "Pergerakan harga saat ini berada di area konsolidasi netral."}.`;

  // D. Susun Risiko Alternatif
  let risiko = "";
  if (biasDir === "menguat") {
    risiko = `**Risiko Alternatif:** Tren penguatan ini dapat dibatalkan jika indikator RSI(14) yang saat ini berada di angka ${ind.rsi14.toFixed(1)} melonjak melewati batas jenuh beli (>70) atau jika harga jatuh di bawah garis support rata-rata bergerak (SMA20).`;
  } else if (biasDir === "melemah") {
    risiko = `**Risiko Alternatif:** Tekanan penurunan ini dapat terhambat apabila nilai RSI(14) yang saat ini berada di angka ${ind.rsi14.toFixed(1)} menyentuh area jenuh jual (<30) yang memicu pembalikan arah naik, atau jika terjadi persilangan emas (Golden Cross) pada indikator Moving Average.`;
  } else {
    risiko = `**Risiko Alternatif:** Konsolidasi ini dapat segera berakhir dan bertransisi ke arah tren baru apabila indikator volume transaksi meningkat signifikan dan garis MACD keluar dari zona histogram netral.`;
  }

  // E. Catatan Kaki Disclaimer
  const disclaimer = `*Analisis di atas murni hasil kalkulasi algoritma statistik atas data harga historis dan tidak mengandung saran keuangan atau keputusan investasi.*`;

  return `${kesimpulan}\n\n${alasan}\n\n${risiko}\n\n${disclaimer}`;
}

async function getAssetSnapshotDirect(id: AssetId): Promise<AssetSnapshot> {
  const updatedAt = new Date().toISOString();
  if (id === "usd-idr") {
    const forexData = await fetchUSDIDRForex();
    const indicators = calculateIndicators(forexData.prices60d, [], undefined);
    const scenario = calculateScenarioProbabilities(indicators, forexData.change7dPct, false);
    return {
      id: "usd-idr",
      name: "USD / IDR",
      symbol: "USDIDR",
      priceIdr: forexData.price,
      change24hPct: forexData.change24hPct,
      change7dPct: forexData.change7dPct,
      spark30d: forexData.spark30d,
      indicators,
      scenario,
      updatedAt
    };
  } else if (YAHOO_TICKERS[id] !== undefined) {
    const ticker = YAHOO_TICKERS[id];
    const stockData = await fetchYahooStock(ticker);
    const indicators = calculateIndicators(stockData.prices60d, [], undefined);
    const scenario = calculateScenarioProbabilities(indicators, stockData.change7dPct, false);
    return {
      id,
      name: id === "bbca" ? "Bank Central Asia" : id === "bbri" ? "Bank Rakyat Indonesia" : id === "tlkm" ? "Telkom Indonesia" : id === "asii" ? "Astra International" : "Adaro Energy",
      symbol: id.toUpperCase(),
      priceIdr: stockData.price,
      change24hPct: stockData.change24hPct,
      change7dPct: stockData.change7dPct,
      spark30d: stockData.spark30d,
      indicators,
      scenario,
      updatedAt
    };
  } else {
    const cgMarkets = await fetchCoinGeckoMarkets();
    const marketInfo = cgMarkets.find(m => m.id === id);
    if (!marketInfo) throw new Error("Asset market data missing from provider");
    const chartData = await fetchCoinGeckoChart(id);
    const prices = chartData.prices.map(p => p[1]).slice(-60);
    const volumes = chartData.total_volumes ? chartData.total_volumes.map(v => v[1]).slice(-60) : [];
    let fearGreed = 50;
    try {
      fearGreed = await fetchFearGreedIndex();
    } catch {}
    const indicators = calculateIndicators(prices, volumes, fearGreed);
    const scenario = calculateScenarioProbabilities(indicators, marketInfo.price_change_percentage_7d_in_currency || 0, true);
    return {
      id,
      name: id === "bitcoin" ? "Bitcoin" : id === "ethereum" ? "Ethereum" : id === "solana" ? "Solana" : "BNB",
      symbol: id === "bitcoin" ? "BTC" : id === "ethereum" ? "ETH" : id === "solana" ? "SOL" : "BNB",
      priceIdr: marketInfo.current_price,
      change24hPct: marketInfo.price_change_percentage_24h_in_currency || 0,
      change7dPct: marketInfo.price_change_percentage_7d_in_currency || 0,
      spark30d: prices.slice(-30),
      indicators,
      scenario,
      updatedAt
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get("asset") as AssetId;

  const validAssets: AssetId[] = ["bitcoin", "ethereum", "solana", "binancecoin", "usd-idr", "bbca", "bbri", "tlkm", "asii", "adro"];
  if (!assetId || !validAssets.includes(assetId)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_ASSET", message: "ID aset tidak valid" },
      { status: 400 }
    );
  }

  try {
    const snapshot = await getAssetSnapshotDirect(assetId);
    if (snapshot.unavailable) {
      throw new Error("Asset snapshot is marked unavailable from provider");
    }

    // Panggil generator teks lokal 100% deterministik, tanpa memanggil AI/Gemini lagi
    const narrative = generateDeterministicAnalysis(snapshot);

    return NextResponse.json({
      ok: true,
      asset: assetId,
      narrative,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(`Analysis GET endpoint error for ${assetId}:`, (err as Error).message || String(err));
    return NextResponse.json(
      {
        ok: false,
        error: "ANALYSIS_FAILED",
        message: "Gagal memuat analisis pasar. Silakan coba beberapa saat lagi."
      },
      { status: 500 }
    );
  }
}
