"use client";

import React, { useState, useEffect, useRef } from "react";
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

type KategoriAset = "crypto" | "stock" | "forex";

interface AssetInfo {
  id: AssetId;
  label: string;
}

interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  type: "crypto" | "stock";
}

export default function PredictionClient({ initialAssets }: PredictionClientProps) {
  const [activeKategori, setActiveKategori] = useState<KategoriAset>("crypto");
  const [activeTab, setActiveTab] = useState<AssetId>("bitcoin");
  const [assets, setAssets] = useState<AssetSnapshot[]>(initialAssets);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dynamicLoading, setDynamicLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  // Tambahkan aset yang dicari secara dinamis ke tab yang bersangkutan
  const getAssetsByKategori = (kat: KategoriAset): AssetInfo[] => {
    const matchingAssets = assets.filter((a) => {
      const id = a.id.toLowerCase();
      if (kat === "forex") return id === "usd-idr";
      if (kat === "stock") return id.endsWith(".jk");
      return id !== "usd-idr" && !id.endsWith(".jk");
    });

    return matchingAssets.map((a) => ({
      id: a.id,
      label: `${a.symbol.toUpperCase()} (${a.name})`
    }));
  };

  const activeAsetOptions = getAssetsByKategori(activeKategori);

  const handleKategoriChange = (kat: KategoriAset) => {
    setActiveKategori(kat);
    const options = getAssetsByKategori(kat);
    if (options.length > 0) {
      setActiveTab(options[0].id);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle input text change and clean state if query too short
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  };

  // Debounce search query fetch
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/prediction/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setIsDropdownOpen((data.results || []).length > 0);
        }
      } catch (err) {
        console.error("Failed to search assets:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle memilih aset dari hasil pencarian autocomplete
  const handleSelectResult = async (result: SearchResult) => {
    const targetId = result.id as AssetId;
    setIsDropdownOpen(false);
    setSearchQuery("");

    // A. Jika aset sudah ada di state client, tinggal aktifkan tab-nya
    const existing = assets.find((a) => a.id.toLowerCase() === targetId.toLowerCase());
    if (existing) {
      setActiveKategori(result.type === "stock" ? "stock" : "crypto");
      setActiveTab(existing.id);
      return;
    }

    // B. Jika belum ada di state client, fetch data snapshot lengkap secara dinamis
    setDynamicLoading(true);
    try {
      const res = await fetch(`/api/prediction/market?asset=${targetId}`);
      if (!res.ok) throw new Error("Fetch failed");
      
      const data = await res.json();
      if (data.ok && data.assets && data.assets.length > 0) {
        const newAsset: AssetSnapshot = data.assets[0];
        
        // Tambahkan ke state assets lokal agar ter-render di tab
        setAssets((prev) => [...prev, newAsset]);
        // Set kategori & tab aktif ke koin/saham baru ini
        setActiveKategori(result.type === "stock" ? "stock" : "crypto");
        setActiveTab(newAsset.id);
      }
    } catch (err) {
      console.error("Failed to load searched asset:", err);
      alert(`Gagal memuat data prediksi untuk ${result.symbol}. Silakan coba lagi.`);
    } finally {
      setDynamicLoading(false);
    }
  };

  // Fetch AI analysis for the active asset lazily
  useEffect(() => {
    if (!activeAsset || activeAsset.unavailable) return;
    if (analysisCache[activeAsset.id]) return;

    let isMounted = true;

    const fetchAnalysis = async () => {
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

  const getKategoriClass = (kat: KategoriAset) => {
    return `px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer select-none ${
      activeKategori === kat
        ? "bg-neutral-800 dark:bg-zinc-100 text-white dark:text-neutral-900 shadow-sm"
        : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
    }`;
  };

  const getAriaTabClass = (id: AssetId) => {
    return `px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all duration-200 shrink-0 select-none ${
      activeTab === id
        ? "bg-orange-600 text-white shadow-sm shadow-orange-100"
        : "bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-300"
    }`;
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Disclaimer Banner */}
      <DisclaimerBanner />

      {/* 2. Kolom Pencarian Autocomplete Dinamis (Saham IDX & Kripto) */}
      <div className="flex flex-col gap-1 w-full max-w-md select-none">
        <label className="text-[10px] font-extrabold text-neutral-400 dark:text-zinc-550 uppercase tracking-wider select-none mb-1">Cari Instrumen Pasar</label>
        <div ref={searchContainerRef} className="relative w-full">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsDropdownOpen(searchResults.length > 0)}
              placeholder="Cari Saham IDX (e.g. BBRI, GOTO) atau Kripto (e.g. ADA, XRP)..."
              className="w-full text-xs font-black px-4 py-3 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
            {searchLoading && (
              <div className="absolute right-4 top-3 h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {/* Autocomplete Dropdown List melayang */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-lg max-h-64 overflow-y-auto divide-y divide-neutral-100 dark:divide-zinc-850">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectResult(r)}
                  className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-zinc-800/50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <span className="text-xs font-black text-neutral-805 dark:text-zinc-150 block">{r.symbol}</span>
                    <span className="text-[10px] text-neutral-450 dark:text-zinc-550 font-bold block">{r.name}</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                    r.type === "stock"
                      ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-450"
                      : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450"
                  }`}>
                    {r.type === "stock" ? "Saham" : "Kripto"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Kategori Aset Switcher (Kripto, Saham, Valuta) */}
      <div className="flex gap-2.5 pb-1 border-b border-neutral-150/40 dark:border-zinc-850 overflow-x-auto scrollbar-none select-none">
        <button onClick={() => handleKategoriChange("crypto")} className={getKategoriClass("crypto")}>
          🪙 Kripto
        </button>
        <button onClick={() => handleKategoriChange("stock")} className={getKategoriClass("stock")}>
          🇮🇩 Saham IDX
        </button>
        <button onClick={() => handleKategoriChange("forex")} className={getKategoriClass("forex")}>
          💵 Kurs Valuta
        </button>
      </div>

      {/* 4. Sub-Aset Tabs berdasarkan Kategori Aktif */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 select-none">
        {dynamicLoading ? (
          <div className="h-9 px-4 flex items-center justify-center text-xs font-bold text-neutral-400 dark:text-zinc-550 animate-pulse">
            Memuat data baru...
          </div>
        ) : (
          activeAsetOptions.map((a) => (
            <button key={a.id} onClick={() => setActiveTab(a.id)} className={getAriaTabClass(a.id)}>
              {a.label}
            </button>
          ))
        )}
      </div>

      {/* 5. Main Asset Analytics Dashboard Grid */}
      {activeAsset && !dynamicLoading && (
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
                isCrypto={activeAsset.id !== "usd-idr" && !activeAsset.id.toLowerCase().endsWith(".jk")}
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-8 text-center text-xs text-neutral-450 dark:text-zinc-550 shadow-sm">
              Data grafik dan tabel teknikal tidak tersedia untuk sementara waktu karena kegagalan data provider. Aset lainnya tetap dapat diakses melalui tab di atas.
            </div>
          )}

        </div>
      )}

      {/* 6. Methodology Accordion / Section */}
      <section className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-neutral-805 dark:text-zinc-200 border-b border-neutral-100 dark:border-zinc-850 pb-2.5">
          ℹ️ Metodologi Analisis Probabilitas
        </h3>
        <div className="text-xs text-neutral-600 dark:text-zinc-450 space-y-3 leading-relaxed">
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
              <strong>Volume Perdagangan (Kripto):</strong> Kenaikan volume perdagangan di atas 30% memperkuat arah tren MACD yang sedang berjalan, sementara penyusutan volume di bawah -30% mendorong bias sideways. (Indikator ini tidak dihitung pada instrumen Saham IDX & Valuta).
            </li>
            <li>
              <strong>Indeks Fear & Greed (Kripto):</strong> Mengukur psikologi pasar secara contrarian. Ketakutan ekstrem (Extreme Fear &lt;25) dipandang sebagai peluang rebound naik, sedangkan euforia ekstrem (Extreme Greed &gt;75) diwaspadai sebagai potensi koreksi. (Indikator ini tidak dihitung pada instrumen Saham IDX & Valuta).
            </li>
          </ul>
          <p className="pt-1.5 text-neutral-555 dark:text-zinc-550">
            Seluruh data harga historis diperbarui secara berkala dari sumber publik (CoinGecko, Frankfurter, & Yahoo Finance) dengan mekanisme caching Next.js server-side untuk memastikan kinerja halaman yang cepat tanpa membebani rate limit provider data pasar.
          </p>
        </div>
      </section>

    </div>
  );
}