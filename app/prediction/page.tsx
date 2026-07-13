import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import { siteConfig } from "@/config/site";
import PredictionClient from "./PredictionClient";
import { fetchCoinGeckoMarkets, fetchCoinGeckoChart } from "@/lib/prediction/providers/coingecko";
import { fetchUSDIDRForex } from "@/lib/prediction/providers/forex";
import { fetchFearGreedIndex } from "@/lib/prediction/providers/feargreed";
import { fetchYahooStock, YAHOO_TICKERS } from "@/lib/prediction/providers/yahoo";
import { calculateIndicators } from "@/lib/prediction/indicators";
import { calculateScenarioProbabilities } from "@/lib/prediction/score";
import { AssetSnapshot, AssetId } from "@/lib/prediction/types";

const PAGE_TITLE = "Prediksi Pasar — Bagaskara Cell";
const PAGE_DESC =
  "Analisis probabilistik pergerakan Bitcoin, Ethereum, Saham IDX, dan kurs Rupiah berbasis indikator statistik (RSI, MACD, Moving Average) — gratis, diperbarui berkala.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    type: "website",
    locale: "id_ID",
    siteName: "Bagaskara Cell",
  },
};

async function getInitialMarketData(): Promise<AssetSnapshot[]> {
  const assets: AssetSnapshot[] = [];
  const updatedAt = new Date().toISOString();

  let fearGreed = 50;
  try {
    fearGreed = await fetchFearGreedIndex();
  } catch {}

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

  const cryptoList: { id: AssetId; name: string; symbol: string }[] = [
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
    { id: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: "solana", name: "Solana", symbol: "SOL" },
    { id: "binancecoin", name: "BNB", symbol: "BNB" }
  ];

  for (const c of cryptoList) {
    try {
      const marketInfo = cgMarkets?.find(m => m.id === c.id);
      if (!marketInfo) throw new Error("Missing market info");

      const chartData = await fetchCoinGeckoChart(c.id);
      const prices = chartData.prices.map(p => p[1]).slice(-60);
      const volumes = chartData.total_volumes ? chartData.total_volumes.map(v => v[1]).slice(-60) : [];

      const indicators = calculateIndicators(prices, volumes, fearGreed);
      const scenario = calculateScenarioProbabilities(
        indicators,
        marketInfo.price_change_percentage_7d_in_currency || 0,
        true
      );

      assets.push({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        priceIdr: marketInfo.current_price,
        change24hPct: marketInfo.price_change_percentage_24h_in_currency || 0,
        change7dPct: marketInfo.price_change_percentage_7d_in_currency || 0,
        spark30d: prices.slice(-30),
        prices60d: prices,
        indicators,
        scenario,
        updatedAt
      });
    } catch (err) {
      console.error(`Pre-render: Failed processing ${c.id}:`, err);
      assets.push({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        change24hPct: 0,
        change7dPct: 0,
        spark30d: [],
        prices60d: [],
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
      });
    }
  }

  // Proses Saham IDX
  const stockList: { id: AssetId; name: string; symbol: string }[] = [
    { id: "bbca", name: "Bank Central Asia", symbol: "BBCA" },
    { id: "bbri", name: "Bank Rakyat Indonesia", symbol: "BBRI" },
    { id: "tlkm", name: "Telkom Indonesia", symbol: "TLKM" },
    { id: "asii", name: "Astra International", symbol: "ASII" },
    { id: "adro", name: "Adaro Energy", symbol: "ADRO" }
  ];

  for (const s of stockList) {
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
          prices60d: stockData.prices60d,
          indicators,
          scenario,
          updatedAt
        });
      } catch (err) {
        console.error(`Pre-render: Failed processing stock ${s.id}:`, err);
        assets.push({
          id: s.id,
          name: s.name,
          symbol: s.symbol,
          change24hPct: 0,
          change7dPct: 0,
          spark30d: [],
          prices60d: [],
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
        prices60d: [],
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
  }

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
      prices60d: forexData.prices60d,
      indicators,
      scenario,
      updatedAt
    });
  } catch (err) {
    console.error("Pre-render: Failed processing USD/IDR:", err);
    assets.push({
      id: "usd-idr",
      name: "USD / IDR",
      symbol: "USDIDR",
      change24hPct: 0,
      change7dPct: 0,
      spark30d: [],
      prices60d: [],
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

  return assets;
}

export default async function PredictionPage() {
  const initialAssets = await getInitialMarketData();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-800 dark:text-zinc-100 font-sans flex flex-col transition-colors duration-200">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-zinc-800 px-4 py-3 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />

          <div className="flex items-center gap-2.5">
            <Link
              href="/kalkulator-shopee"
              className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 flex items-center justify-center text-neutral-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
              title="Kalkulator Potongan Shopee"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h6" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/cek-resi"
              className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 flex items-center justify-center text-neutral-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
              title="Lacak Pengiriman (Cek Resi)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011-1v-4a1 1 0 011-1h2m4 4h1a1 1 0 001-1v-4a1 1 0 00-.8-.8l-2.7-2.7a1 1 0 00-.7-.5H15" />
              </svg>
            </Link>
            <Link
              href="/prediction"
              className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-150 transition-all cursor-pointer"
              title="Prediksi Pasar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 md:py-10 flex flex-col gap-6">
        
        {/* Title and Intro */}
        <div className="text-center space-y-2 mb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-neutral-400 dark:text-zinc-555 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider cursor-pointer mb-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Katalog
          </Link>

          <h1 className="text-2xl md:text-3xl font-black text-neutral-850 dark:text-zinc-100 tracking-tight">
            Prediksi Pasar
          </h1>
          <p className="text-xs md:text-sm font-semibold text-neutral-400 dark:text-zinc-450 max-w-xl mx-auto leading-relaxed">
            Analisis probabilistik pergerakan kripto, saham IDX, dan kurs Rupiah berbasis indikator statistik — lengkap dengan persentase skenario dan landasan alasannya.
          </p>
        </div>

        <PredictionClient initialAssets={initialAssets} />

      </main>

      {/* Footer Section */}
      <footer className="w-full bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800 py-10 px-4 transition-colors duration-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Identity */}
          <div className="flex flex-col gap-2">
            <Logo />
            <p className="text-xs text-neutral-505 dark:text-zinc-400 max-w-xs mt-1">
              Katalog HP terpercaya di Cerme, Gresik. Transaksi aman, transparan, dan jaminan barang berkualitas serta gratis konsultasi.
            </p>
          </div>

          {/* Location & Address */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-400 dark:text-zinc-550 uppercase tracking-wider">Lokasi Toko</span>
            <p className="text-xs text-neutral-600 dark:text-zinc-300 leading-relaxed max-w-xs">
              {siteConfig.address}
            </p>
            <a
              href={siteConfig.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline mt-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Buka di Google Maps
            </a>
          </div>

          {/* Contact & Marketplaces */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-400 dark:text-zinc-555 uppercase tracking-wider">Hubungi / Toko Online</span>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-neutral-500 dark:text-zinc-400">WhatsApp Admin:</span>
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-850 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer"
                >
                  CS 1: +62 895-1367-9939
                </a>
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber2}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-850 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer"
                >
                  CS 2: +62 81-959-77777-0
                </a>
              </div>
              <div className="flex gap-3 items-center mt-1">
                <a
                  href={siteConfig.marketplaceLinks.shopee}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-orange-600 dark:text-orange-500 hover:underline"
                >
                  Shopee
                </a>
                <a
                  href={siteConfig.marketplaceLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>

        </div>

        <div className="max-w-6xl mx-auto border-t border-neutral-100 dark:border-zinc-800 mt-8 pt-6 text-center text-[10px] text-neutral-450 dark:text-zinc-550 font-medium">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </div>
      </footer>

    </div>
  );
}