import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchCoinGeckoMarkets, fetchCoinGeckoChart } from "@/lib/prediction/providers/coingecko";
import { fetchUSDIDRForex } from "@/lib/prediction/providers/forex";
import { fetchFearGreedIndex } from "@/lib/prediction/providers/feargreed";
import { calculateIndicators } from "@/lib/prediction/indicators";
import { calculateScenarioProbabilities } from "@/lib/prediction/score";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prediction/prompt";
import { AssetSnapshot, AssetId } from "@/lib/prediction/types";

export const dynamic = "force-dynamic";

// Regex untuk mendeteksi kata-kata terlarang (pasti, dijamin, sinyal beli, sinyal jual)
const FORBIDDEN_WORDS_REGEX = /(pasti|dijamin|sinyal\s+beli|sinyal\s+jual)/i;

// Fallback teks statis netral jika AI melanggar aturan kata terlarang berulang kali atau jika API gagal
const getFallbackNarrative = (snapshot: AssetSnapshot): string => {
  const bias = snapshot.scenario.up > snapshot.scenario.down 
    ? "bias naik (bullish)" 
    : snapshot.scenario.down > snapshot.scenario.up 
      ? "bias turun (bearish)" 
      : "bias sideways (konsolidasi)";

  return `Berdasarkan analisis statistik atas data historis 60 hari terakhir, ${snapshot.name} untuk horizon 7 hari ke depan menunjukkan probabilitas skenario ${bias}. Indikator RSI(14) tercatat pada nilai ${snapshot.indicators.rsi14} didukung oleh pergerakan histogram MACD ${snapshot.indicators.macd.state} sebesar ${snapshot.indicators.macd.histogram}. Analisis teknikal ini merefleksikan tren historis semata dan pergerakan dapat berubah tergantung kondisi volatilitas pasar. Anda disarankan untuk selalu melakukan riset mandiri secara mendalam (DYOR) sebelum mengambil keputusan finansial karena data ini tidak mengandung saran investasi.`;
};

// Fungsi internal pembuat narasi AI (tanpa cache, untuk dipanggil di dalam cache wrapper)
async function generateNarrativeFromClaude(snapshot: AssetSnapshot): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const userMessage = buildUserMessage(snapshot);

  const fetchClaude = async () => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Claude API returned status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return data.content[0].text as string;
  };

  // Generate pertama
  let text = await fetchClaude();

  // Post-check kata terlarang
  if (FORBIDDEN_WORDS_REGEX.test(text)) {
    console.warn("AI response contained forbidden words. Attempting regeneration once...");
    // Retry sekali
    text = await fetchClaude();
    
    // Jika masih melanggar, fallback ke teks statis netral yang aman
    if (FORBIDDEN_WORDS_REGEX.test(text)) {
      console.error("AI response still contained forbidden words after regeneration. Using fallback static narrative.");
      return getFallbackNarrative(snapshot);
    }
  }

  return text;
}

// Helper untuk fetch snapshot aset berdasarkan ID secara langsung di server
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
  } else {
    const cgMarkets = await fetchCoinGeckoMarkets();
    const marketInfo = cgMarkets.find(m => m.id === id);
    if (!marketInfo) throw new Error("Asset market data missing from provider");
    const chartData = await fetchCoinGeckoChart(id);
    const prices = chartData.prices.map(p => p[1]);
    const volumes = chartData.total_volumes ? chartData.total_volumes.map(v => v[1]) : [];
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

// Wrapper cache: 6 jam revalidate
const getCachedAnalysis = unstable_cache(
  async (snapshot: AssetSnapshot) => {
    return await generateNarrativeFromClaude(snapshot);
  },
  ["prediction-analysis-narrative"],
  { revalidate: 21600 } // 6 jam revalidate
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get("asset") as AssetId;

  // Validasi Parameter
  const validAssets: AssetId[] = ["bitcoin", "ethereum", "solana", "binancecoin", "usd-idr"];
  if (!assetId || !validAssets.includes(assetId)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_ASSET", message: "ID aset tidak valid" },
      { status: 400 }
    );
  }

  // Cek apakah API key dikonfigurasi
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return NextResponse.json({
      ok: false,
      error: "AI_DISABLED",
      message: "Narasi asisten AI dinonaktifkan karena konfigurasi server belum lengkap."
    });
  }

  try {
    // 1. Ambil data pasar terkini (secara direct di server)
    const snapshot = await getAssetSnapshotDirect(assetId);
    if (snapshot.unavailable) {
      throw new Error("Asset snapshot is marked unavailable from provider");
    }

    // 2. Generate narasi AI (lewat cache revalidate 6 jam)
    // Gunakan hash dari data snapshot (terutama harga dan probabilitas) agar cache ter-invalidate jika data pasar berubah drastis
    const narrative = await getCachedAnalysis(snapshot);

    return NextResponse.json({
      ok: true,
      asset: assetId,
      narrative,
      generatedAt: new Date().toISOString()
    });
  } catch (err: unknown) {
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