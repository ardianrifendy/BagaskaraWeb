import { NextResponse } from "next/server";
import { fetchCoinGeckoMarkets, fetchCoinGeckoChart } from "@/lib/prediction/providers/coingecko";
import { fetchUSDIDRForex } from "@/lib/prediction/providers/forex";
import { fetchFearGreedIndex } from "@/lib/prediction/providers/feargreed";
import { fetchYahooStock, YAHOO_TICKERS } from "@/lib/prediction/providers/yahoo";
import { calculateIndicators } from "@/lib/prediction/indicators";
import { calculateScenarioProbabilities } from "@/lib/prediction/score";
import { AssetSnapshot, AssetId } from "@/lib/prediction/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const assets: AssetSnapshot[] = [];
  const updatedAt = new Date().toISOString();

  // 1. Fetch Fear & Greed Index (untuk Kripto)
  let fearGreed = 50;
  try {
    fearGreed = await fetchFearGreedIndex();
  } catch (err) {
    console.error("Failed to fetch Fear & Greed index:", err);
  }

  // 2. Siapkan semua promise fetch secara paralel
  const cgMarketsPromise = fetchCoinGeckoMarkets().catch(err => {
    console.error("CoinGecko markets fetch failed:", err);
    return null;
  });

  const forexPromise = fetchUSDIDRForex().catch(err => {
    console.error("Forex fetch failed:", err);
    return null;
  });

  // Siapkan fetch untuk 5 saham IDX secara paralel
  const stockPromises = Object.entries(YAHOO_TICKERS).map(async ([id, ticker]) => {
    try {
      const data = await fetchYahooStock(ticker);
      return { id: id as AssetId, data };
    } catch (err) {
      console.error(`Failed to fetch stock ${id} (${ticker}):`, err);
      return { id: id as AssetId, data: null };
    }
  });

  const [cgMarkets, forexData, ...stockResults] = await Promise.all([
    cgMarketsPromise,
    forexPromise,
    ...stockPromises
  ]);

  // 3. Proses Aset Kripto (BTC, ETH, SOL, BNB)
  const cryptoAssetsList: { id: AssetId; name: string; symbol: string }[] = [
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
    { id: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: "solana", name: "Solana", symbol: "SOL" },
    { id: "binancecoin", name: "BNB", symbol: "BNB" }
  ];

  const cryptoPromises = cryptoAssetsList.map(async (c) => {
    try {
      const marketInfo = cgMarkets?.find(m => m.id === c.id);
      if (!marketInfo) {
        throw new Error(`Market info missing for ${c.id}`);
      }

      const chartData = await fetchCoinGeckoChart(c.id);
      if (!chartData || !chartData.prices || chartData.prices.length === 0) {
        throw new Error(`Chart data missing for ${c.id}`);
      }

      const prices = chartData.prices.map(p => p[1]).slice(-60);
      const volumes = chartData.total_volumes ? chartData.total_volumes.map(v => v[1]).slice(-60) : [];

      const indicators = calculateIndicators(prices, volumes, fearGreed);
      const scenario = calculateScenarioProbabilities(
        indicators,
        marketInfo.price_change_percentage_7d_in_currency || 0,
        true
      );

      const spark30d = prices.slice(-30);

      const snapshot: AssetSnapshot = {
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        priceIdr: marketInfo.current_price,
        change24hPct: marketInfo.price_change_percentage_24h_in_currency || 0,
        change7dPct: marketInfo.price_change_percentage_7d_in_currency || 0,
        spark30d,
        indicators,
        scenario,
        updatedAt
      };

      return snapshot;
    } catch (err: unknown) {
      console.error(`Failed processing crypto asset ${c.id}:`, ((err as Error).message || String(err)));
      const fallbackSnapshot: AssetSnapshot = {
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        change24hPct: 0,
        change7dPct: 0,
        spark30d: [],
        indicators: {
          rsi14: 50,
          sma20: 0,
          sma50: 0,
          maCross: "none",
          macd: { line: 0, signal: 0, histogram: 0, state: "bearish" },
          volumeChangePct: 0,
          fearGreed,
          priceVsSma20Pct: 0
        },
        scenario: {
          up: 33,
          sideways: 34,
          down: 33,
          horizonDays: 7,
          drivers: []
        },
        updatedAt,
        unavailable: true
      };
      return fallbackSnapshot;
    }
  });

  const cryptoSnapshots = await Promise.all(cryptoPromises);
  assets.push(...cryptoSnapshots);

  // 4. Proses Saham IDX
  const stockAssetsList: { id: AssetId; name: string; symbol: string }[] = [
    { id: "bbca", name: "Bank Central Asia", symbol: "BBCA" },
    { id: "bbri", name: "Bank Rakyat Indonesia", symbol: "BBRI" },
    { id: "tlkm", name: "Telkom Indonesia", symbol: "TLKM" },
    { id: "asii", name: "Astra International", symbol: "ASII" },
    { id: "adro", name: "Adaro Energy", symbol: "ADRO" }
  ];

  stockAssetsList.forEach((s) => {
    const stockRes = stockResults.find(r => r.id === s.id);
    const stockData = stockRes?.data;

    if (stockData) {
      try {
        const indicators = calculateIndicators(stockData.prices60d, [], undefined);
        const scenario = calculateScenarioProbabilities(indicators, stockData.change7dPct, false);

        const snapshot: AssetSnapshot = {
          id: s.id,
          name: s.name,
          symbol: s.symbol,
          priceIdr: stockData.price,
          change24hPct: stockData.change24hPct,
          change7dPct: stockData.change7dPct,
          spark30d: stockData.spark30d,
          indicators,
          scenario,
          updatedAt
        };

        assets.push(snapshot);
      } catch (err: unknown) {
        console.error(`Failed processing stock asset ${s.id}:`, ((err as Error).message || String(err)));
        assets.push({
          id: s.id,
          name: s.name,
          symbol: s.symbol,
          change24hPct: 0,
          change7dPct: 0,
          spark30d: [],
          indicators: {
            rsi14: 50,
            sma20: 0,
            sma50: 0,
            maCross: "none",
            macd: { line: 0, signal: 0, histogram: 0, state: "bearish" },
            volumeChangePct: 0,
            priceVsSma20Pct: 0
          },
          scenario: {
            up: 33,
            sideways: 34,
            down: 33,
            horizonDays: 7,
            drivers: []
          },
          updatedAt,
          unavailable: true
        });
      }
    } else {
      // Fallback jika fetch data gagal
      assets.push({
        id: s.id,
        name: s.name,
        symbol: s.symbol,
        change24hPct: 0,
        change7dPct: 0,
        spark30d: [],
        indicators: {
          rsi14: 50,
          sma20: 0,
          sma50: 0,
          maCross: "none",
          macd: { line: 0, signal: 0, histogram: 0, state: "bearish" },
          volumeChangePct: 0,
          priceVsSma20Pct: 0
        },
        scenario: {
          up: 33,
          sideways: 34,
          down: 33,
          horizonDays: 7,
          drivers: []
        },
        updatedAt,
        unavailable: true
      });
    }
  });

  // 5. Proses Kurs Forex USD/IDR
  try {
    if (!forexData) {
      throw new Error("Forex data unavailable");
    }

    const indicators = calculateIndicators(forexData.prices60d, [], undefined);
    const scenario = calculateScenarioProbabilities(indicators, forexData.change7dPct, false);

    const usdIdrSnapshot: AssetSnapshot = {
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

    assets.push(usdIdrSnapshot);
  } catch (err: unknown) {
    console.error("Failed processing forex asset USD/IDR:", ((err as Error).message || String(err)));
    const usdIdrFallback: AssetSnapshot = {
      id: "usd-idr",
      name: "USD / IDR",
      symbol: "USDIDR",
      change24hPct: 0,
      change7dPct: 0,
      spark30d: [],
      indicators: {
        rsi14: 50,
        sma20: 0,
        sma50: 0,
        maCross: "none",
        macd: { line: 0, signal: 0, histogram: 0, state: "bearish" },
        volumeChangePct: 0,
        priceVsSma20Pct: 0
      },
      scenario: {
        up: 33,
        sideways: 34,
        down: 33,
        horizonDays: 7,
        drivers: []
      },
      updatedAt,
      unavailable: true
    };
    assets.push(usdIdrFallback);
  }

  return NextResponse.json({
    ok: true,
    assets,
    updatedAt
  });
}