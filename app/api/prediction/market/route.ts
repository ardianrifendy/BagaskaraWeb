import { NextRequest, NextResponse } from "next/server";
import { fetchCoinGeckoMarkets, fetchCoinGeckoChart, TOP_100_CRYPTOS } from "@/lib/prediction/providers/coingecko";
import { fetchUSDIDRForex } from "@/lib/prediction/providers/forex";
import { fetchFearGreedIndex } from "@/lib/prediction/providers/feargreed";
import { fetchYahooStock, YAHOO_TICKERS } from "@/lib/prediction/providers/yahoo";
import { calculateIndicators } from "@/lib/prediction/indicators";
import { calculateScenarioProbabilities } from "@/lib/prediction/score";
import { AssetSnapshot, AssetId } from "@/lib/prediction/types";

export const dynamic = "force-dynamic";

async function getCryptoSnapshot(id: string, name: string, symbol: string, fearGreed: number, updatedAt: string): Promise<AssetSnapshot> {
  const cgMarkets = await fetchCoinGeckoMarkets(id);
  const marketInfo = cgMarkets.find(m => m.id === id);
  if (!marketInfo) throw new Error(`Market info missing for ${id}`);

  const chartData = await fetchCoinGeckoChart(id);
  const prices = chartData.prices.map(p => p[1]).slice(-60);
  const volumes = chartData.total_volumes ? chartData.total_volumes.map(v => v[1]).slice(-60) : [];

  const indicators = calculateIndicators(prices, volumes, fearGreed);
  const scenario = calculateScenarioProbabilities(
    indicators,
    marketInfo.price_change_percentage_7d_in_currency || 0,
    true
  );

  return {
    id: id as AssetId,
    name,
    symbol,
    priceIdr: marketInfo.current_price,
    change24hPct: marketInfo.price_change_percentage_24h_in_currency || 0,
    change7dPct: marketInfo.price_change_percentage_7d_in_currency || 0,
    spark30d: prices.slice(-30),
    indicators,
    scenario,
    updatedAt
  };
}

async function getStockSnapshot(id: string, name: string, symbol: string, ticker: string, updatedAt: string): Promise<AssetSnapshot> {
  const stockData = await fetchYahooStock(ticker);
  const indicators = calculateIndicators(stockData.prices60d, [], undefined);
  const scenario = calculateScenarioProbabilities(indicators, stockData.change7dPct, false);

  return {
    id: id as AssetId,
    name,
    symbol,
    priceIdr: stockData.price,
    change24hPct: stockData.change24hPct,
    change7dPct: stockData.change7dPct,
    spark30d: stockData.spark30d,
    indicators,
    scenario,
    updatedAt
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetAsset = searchParams.get("asset") as AssetId | null;
  const assets: AssetSnapshot[] = [];
  const updatedAt = new Date().toISOString();

  let fearGreed = 50;
  try {
    fearGreed = await fetchFearGreedIndex();
  } catch {
    // abaikan error
  }

  if (targetAsset) {
    const idLower = targetAsset.toLowerCase().trim();
    try {
      if (idLower === "usd-idr") {
        const forexData = await fetchUSDIDRForex();
        const indicators = calculateIndicators(forexData.prices60d, [], undefined);
        const scenario = calculateScenarioProbabilities(indicators, forexData.change7dPct, false);
        return NextResponse.json({
          ok: true,
          assets: [{
            id: "usd-idr" as AssetId,
            name: "USD / IDR",
            symbol: "USDIDR",
            priceIdr: forexData.price,
            change24hPct: forexData.change24hPct,
            change7dPct: forexData.change7dPct,
            spark30d: forexData.spark30d,
            indicators,
            scenario,
            updatedAt
          }],
          updatedAt
        });
      }

      if (idLower.endsWith(".jk")) {
        const ticker = idLower.toUpperCase();
        const symbol = ticker.replace(".JK", "");
        const name = `Saham ${symbol}`;
        const snapshot = await getStockSnapshot(idLower, name, symbol, ticker, updatedAt);
        return NextResponse.json({ ok: true, assets: [snapshot], updatedAt });
      }

      const cryptoInfo = TOP_100_CRYPTOS.find(c => c.id === idLower) || 
        { id: "bitcoin", symbol: "BTC", name: "Bitcoin" };

      const snapshot = await getCryptoSnapshot(cryptoInfo.id, cryptoInfo.name, cryptoInfo.symbol, fearGreed, updatedAt);
      return NextResponse.json({ ok: true, assets: [snapshot], updatedAt });

    } catch (err: unknown) {
      console.error(`Dynamic fetch failed for asset ${targetAsset}:`, (err as Error).message || String(err));
      return NextResponse.json(
        { ok: false, error: "FETCH_FAILED", message: `Gagal memuat data aset ${targetAsset}` },
        { status: 500 }
      );
    }
  }

  const cgMarketsPromise = fetchCoinGeckoMarkets().catch(() => null);
  const forexPromise = fetchUSDIDRForex().catch(() => null);

  const stockPromises = Object.entries(YAHOO_TICKERS).map(async ([id, ticker]) => {
    try {
      const data = await fetchYahooStock(ticker);
      return { id: id as AssetId, data };
    } catch {
      return { id: id as AssetId, data: null };
    }
  });

  const [cgMarkets, forexData, ...stockResults] = await Promise.all([
    cgMarketsPromise,
    forexPromise,
    ...stockPromises
  ]);

  const cryptoAssetsList: { id: AssetId; name: string; symbol: string }[] = [
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
    { id: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: "solana", name: "Solana", symbol: "SOL" },
    { id: "binancecoin", name: "BNB", symbol: "BNB" }
  ];

  const cryptoPromises = cryptoAssetsList.map(async (c) => {
    try {
      const marketInfo = cgMarkets?.find(m => m.id === c.id);
      if (!marketInfo) throw new Error(`Market info missing for ${c.id}`);

      const chartData = await fetchCoinGeckoChart(c.id);
      const prices = chartData.prices.map(p => p[1]).slice(-60);
      const volumes = chartData.total_volumes ? chartData.total_volumes.map(v => v[1]).slice(-60) : [];

      const indicators = calculateIndicators(prices, volumes, fearGreed);
      const scenario = calculateScenarioProbabilities(indicators, marketInfo.price_change_percentage_7d_in_currency || 0, true);

      return {
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        priceIdr: marketInfo.current_price,
        change24hPct: marketInfo.price_change_percentage_24h_in_currency || 0,
        change7dPct: marketInfo.price_change_percentage_7d_in_currency || 0,
        spark30d: prices.slice(-30),
        indicators,
        scenario,
        updatedAt
      } as AssetSnapshot;
    } catch {
      return {
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
        scenario: { up: 33, sideways: 34, down: 33, horizonDays: 7, drivers: [] },
        updatedAt,
        unavailable: true
      } as AssetSnapshot;
    }
  });

  const cryptoSnapshots = await Promise.all(cryptoPromises);
  assets.push(...cryptoSnapshots);

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

        assets.push({
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
        });
      } catch {
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
          scenario: { up: 33, sideways: 34, down: 33, horizonDays: 7, drivers: [] },
          updatedAt,
          unavailable: true
        });
      }
    } else {
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
        scenario: { up: 33, sideways: 34, down: 33, horizonDays: 7, drivers: [] },
        updatedAt,
        unavailable: true
      });
    }
  });

  try {
    if (!forexData) throw new Error("Forex data missing");

    const indicators = calculateIndicators(forexData.prices60d, [], undefined);
    const scenario = calculateScenarioProbabilities(indicators, forexData.change7dPct, false);

    assets.push({
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
    });
  } catch {
    assets.push({
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
      scenario: { up: 33, sideways: 34, down: 33, horizonDays: 7, drivers: [] },
      updatedAt,
      unavailable: true
    });
  }

  return NextResponse.json({
    ok: true,
    assets,
    updatedAt
  });
}