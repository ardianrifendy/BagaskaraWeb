"use client";

import React, { useState, useEffect } from "react";

import { AssetSnapshot, AssetId } from "@/lib/prediction/types";
import DisclaimerBanner from "@/components/prediction/DisclaimerBanner";
import AssetCard from "@/components/prediction/AssetCard";
import ScenarioBar from "@/components/prediction/ScenarioBar";
import PriceChart from "@/components/prediction/PriceChart";
import IndicatorTable from "@/components/prediction/IndicatorTable";
import AnalysisNarrative from "@/components/prediction/AnalysisNarrative";

interface PredictionClientProps {
  initialAssets: AssetSnapshot[];
}

export default function PredictionClient({ initialAssets }: PredictionClientProps) {
  const [activeTab, setActiveTab] = useState<AssetId>("bitcoin");
  const [assets] = useState<AssetSnapshot[]>(initialAssets);
  
  // AI analysis state per asset
  const [analysisCache, setAnalysisCache] = useState<{
    [key in AssetId]?: {
      narrative: string;
      generatedAt: string;
      loading: boolean;
      error?: string;
    };
  }>({});

  const activeAsset = assets.find(a => a.id === activeTab) || assets[0];

  // Fetch AI analysis for the active asset lazily
  useEffect(() => {
    if (!activeAsset || activeAsset.unavailable) return;

    // Jika sudah ada di cache dan tidak sedang loading, jangan fetch lagi
    if (analysisCache[activeAsset.id]) return;

    let isMounted = true;

    const fetchAnalysis = async () => {
      // Set loading state
      setAnalysisCache(prev => ({
        ...prev,
        [activeAsset.id]: { narrative: "", generatedAt: "", loading: true }
      }));

      try {
        const res = await fetch(`/api/prediction/analysis?asset=${activeAsset.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch analysis");
        }
        
        const data = await res.json();
        
        if (!isMounted) return;

        if (data.ok) {
          setAnalysisCache(prev => ({
            ...prev,
            [activeAsset.id]: {
              narrative: data.narrative,
              generatedAt: data.generatedAt,
              loading: false
            }
          }));
        } else {
          setAnalysisCache(prev => ({
            ...prev,
            [activeAsset.id]: {
              narrative: "",
              generatedAt: "",
              loading: false,
              error: data.error || "FAILED"
            }
          }));
        }
      } catch {
        if (!isMounted) return;
        setAnalysisCache(prev => ({
          ...prev,
          [activeAsset.id]: {
            narrative: "",
            generatedAt: "",
            loading: false,
            error: "FAILED"
          }
        }));
      }
    };

    fetchAnalysis();

    return () => {
      isMounted = false;
    };
  }, [activeTab, activeAsset, analysisCache]);

  const activeAnalysis = analysisCache[activeTab];

  // Get active bias direction for card badge
  const getActiveBias = (snapshot: AssetSnapshot): "up" | "down" | "neutral" => {
    const sc = snapshot.scenario;
    if (sc.up > sc.down && sc.up > sc.sideways) return "up";
    if (sc.down > sc.up && sc.down > sc.sideways) return "down";
    return "neutral";
  };

  const getAriaTabClass = (id: AssetId) => {
    return `px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all duration-200 shrink-0 select-none ${
      activeTab === id
        ? "bg-orange-600 text-white shadow-sm shadow-orange-100"
        : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
    }`;
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Disclaimer Banner */}
      <DisclaimerBanner />

      {/* 2. Horizontal Scrollable Asset Tabs */}
      <div className="flex gap-2 border-b border-neutral-200/50 dark:border-zinc-800 pb-3 overflow-x-auto scrollbar-none">
        <button onClick={() => setActiveTab("bitcoin")} className={getAriaTabClass("bitcoin")}>
          BTC
        </button>
        <button onClick={() => setActiveTab("ethereum")} className={getAriaTabClass("ethereum")}>
          ETH
        </button>
        <button onClick={() => setActiveTab("solana")} className={getAriaTabClass("solana")}>
          SOL
        </button>
        <button onClick={() => setActiveTab("binancecoin")} className={getAriaTabClass("binancecoin")}>
          BNB
        </button>
        <button onClick={() => setActiveTab("usd-idr")} className={getAriaTabClass("usd-idr")}>
          USD/IDR
        </button>
      </div>

      {/* 3. Main Asset Analytics Dashboard Grid */}
      {activeAsset && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          
          {/* Left Side: Summary Card, Scenario Bar, and AI Narrative */}
          <div className="space-y-5">
            <AssetCard
              name={activeAsset.name}
              symbol={activeAsset.symbol}
              priceIdr={activeAsset.priceIdr}
              change24hPct={activeAsset.change24hPct}
              change7dPct={activeAsset.change7dPct}
              unavailable={activeAsset.unavailable}
              bias={getActiveBias(activeAsset)}
            />

            {!activeAsset.unavailable && (
              <ScenarioBar
                up={activeAsset.scenario.up}
                sideways={activeAsset.scenario.sideways}
                down={activeAsset.scenario.down}
              />
            )}

            {!activeAsset.unavailable && (
              <AnalysisNarrative
                narrative={activeAnalysis?.narrative}
                loading={!!activeAnalysis?.loading}
                error={activeAnalysis?.error}
                generatedAt={activeAnalysis?.generatedAt}
              />
            )}
          </div>

          {/* Right Side: Price Line Chart & Indicators Details Table */}
          {!activeAsset.unavailable ? (
            <div className="space-y-5">
              <PriceChart
                prices={activeAsset.spark30d}
                sma20={activeAsset.indicators.sma20}
                sma50={activeAsset.indicators.sma50}
                symbol={activeAsset.symbol}
              />

              <IndicatorTable
                indicators={activeAsset.indicators}
                isCrypto={activeAsset.id !== "usd-idr"}
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-8 text-center text-xs text-neutral-450 dark:text-zinc-550 shadow-sm">
              Data grafik dan tabel teknikal tidak tersedia untuk sementara waktu karena kegagalan data provider. Aset lainnya tetap dapat diakses melalui tab di atas.
            </div>
          )}

        </div>
      )}

      {/* 4. Methodology Accordion / Section */}
      <section className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-neutral-805 dark:text-zinc-200 border-b border-neutral-100 dark:border-zinc-850 pb-2.5">
          ℹ️ Metodologi Analisis Probabilitas
        </h3>
        <div className="text-xs text-neutral-600 dark:text-zinc-400 space-y-3 leading-relaxed">
          <p>
            Persentase skenario pergerakan pasar (Naik, Sideways, Turun) untuk 7 hari ke depan dihasilkan oleh <strong>Probability Engine</strong> deterministik situs kami berdasarkan akumulasi pembobotan indikator analisis teknikal standar:
          </p>
          <ul className="list-disc pl-5 space-y-2 font-medium text-neutral-700 dark:text-zinc-300">
            <li>
              <strong>Relative Strength Index (RSI 14 hari):</strong> Mengukur momentum jenuh beli (&gt;70, bias turun) atau jenuh jual (&lt;30, bias naik).
            </li>
            <li>
              <strong>Moving Average Cross & Trend:</strong> Mendeteksi sinyal persilangan emas (Golden Cross) atau persilangan maut (Death Cross) antara garis rata-rata pergerakan SMA20 dan SMA50.
            </li>
            <li>
              <strong>MACD (Moving Average Convergence Divergence 12, 26, 9):</strong> Menganalisis percepatan momentum arah tren melalui tinggi-rendahnya histogram MACD.
            </li>
            <li>
              <strong>Volume Perdagangan (Kripto):</strong> Kenaikan volume perdagangan di atas 30% memperkuat arah tren MACD yang sedang berjalan, sementara penyusutan volume di bawah -30% mendorong bias sideways.
            </li>
            <li>
              <strong>Indeks Fear & Greed (Kripto):</strong> Mengukur psikologi pasar secara contrarian. Ketakutan ekstrem (Extreme Fear &lt;25) dipandang sebagai peluang rebound naik, sedangkan euforia ekstrem (Extreme Greed &gt;75) diwaspadai sebagai potensi koreksi.
            </li>
          </ul>
          <p className="pt-1.5 text-neutral-550 dark:text-zinc-450">
            Seluruh data harga historis diperbarui secara berkala dari sumber publik (CoinGecko & Frankfurter) dengan mekanisme caching Next.js server-side untuk memastikan kinerja halaman yang cepat tanpa membebani rate limit provider data pasar.
          </p>
        </div>
      </section>

    </div>
  );
}