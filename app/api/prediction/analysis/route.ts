import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchCoinGeckoMarkets, fetchCoinGeckoChart } from "@/lib/prediction/providers/coingecko";
import { fetchUSDIDRForex } from "@/lib/prediction/providers/forex";
import { fetchFearGreedIndex } from "@/lib/prediction/providers/feargreed";
import { fetchYahooStock, YAHOO_TICKERS } from "@/lib/prediction/providers/yahoo";
import { calculateIndicators } from "@/lib/prediction/indicators";
import { calculateScenarioProbabilities } from "@/lib/prediction/score";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prediction/prompt";
import { AssetSnapshot, AssetId } from "@/lib/prediction/types";

export const dynamic = "force-dynamic";

const FORBIDDEN_WORDS_REGEX = /(pasti|dijamin|sinyal\s+beli|sinyal\s+jual)/i;

const getFallbackNarrative = (snapshot: AssetSnapshot): string => {
  const bias = snapshot.scenario.up > snapshot.scenario.down 
    ? "bias naik (bullish)" 
    : snapshot.scenario.down > snapshot.scenario.up 
      ? "bias turun (bearish)" 
      : "bias sideways (konsolidasi)";

  return `Berdasarkan analisis statistik atas data historis 60 hari terakhir, ${snapshot.name} untuk horizon 7 hari ke depan menunjukkan probabilitas skenario ${bias}. Indikator RSI(14) tercatat pada nilai ${snapshot.indicators.rsi14} didukung oleh pergerakan histogram MACD ${snapshot.indicators.macd.state} sebesar ${snapshot.indicators.macd.histogram}. Analisis teknikal ini merefleksikan tren historis semata dan pergerakan dapat berubah tergantung kondisi volatilitas pasar. Anda disarankan untuk selalu melakukan riset mandiri secara mendalam (DYOR) sebelum mengambil keputusan finansial karena data ini tidak mengandung saran investasi.`;
};

async function generateNarrativeFromGemini(snapshot: AssetSnapshot): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const userMessage = buildUserMessage(snapshot);
  // Endpoint Gemini 2.5 Pro (sangat andal dan cerdas)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

  const fetchGemini = async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: userMessage
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: SYSTEM_PROMPT
            }
          ]
        },
        generationConfig: {
          maxOutputTokens: 700
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API returned status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty candidate response from Gemini");
    }
    return text as string;
  };

  let text = await fetchGemini();

  if (FORBIDDEN_WORDS_REGEX.test(text)) {
    console.warn("Gemini response contained forbidden words. Attempting regeneration once...");
    text = await fetchGemini();
    
    if (FORBIDDEN_WORDS_REGEX.test(text)) {
      console.error("Gemini response still contained forbidden words after regeneration. Using fallback static narrative.");
      return getFallbackNarrative(snapshot);
    }
  }

  return text;
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

const getCachedAnalysis = unstable_cache(
  async (snapshot: AssetSnapshot) => {
    return await generateNarrativeFromGemini(snapshot);
  },
  ["prediction-analysis-narrative-gemini"],
  { revalidate: 21600 }
);

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return NextResponse.json({
      ok: false,
      error: "AI_DISABLED",
      message: "Narasi asisten AI dinonaktifkan karena konfigurasi server belum lengkap."
    });
  }

  try {
    const snapshot = await getAssetSnapshotDirect(assetId);
    if (snapshot.unavailable) {
      throw new Error("Asset snapshot is marked unavailable from provider");
    }

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