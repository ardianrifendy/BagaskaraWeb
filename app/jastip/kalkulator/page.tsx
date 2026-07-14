"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { siteConfig } from "@/config/site";
import { formatRupiah } from "@/lib/formatRupiah";
import { calculateItemPrice } from "@/lib/jastip/pricing";
import Select from "@/components/jastip/Select";

interface ActiveBatch {
  id: number;
  slug: string;
  name: string;
  countryCode: string;
  currency: string;
  exchangeRate: string;
  feeType: string;
  feeValue: string;
}

function CalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Inputs
  const [itemName, setItemName] = useState(searchParams.get("name") || "");
  const [variant, setVariant] = useState(searchParams.get("variant") || "");
  const [price, setPrice] = useState(Number(searchParams.get("price")) || 0);
  const [qty, setQty] = useState(Number(searchParams.get("qty")) || 1);
  const [weight, setWeight] = useState(Number(searchParams.get("weight")) || 0);

  // Batch / Rate settings
  const [currency, setCurrency] = useState("MYR");
  const [exchangeRate, setExchangeRate] = useState(3500);
  const [feeType, setFeeType] = useState<"flat" | "percent">("flat");
  const [feeValue, setFeeValue] = useState(15000);
  const [shippingRateIdr, setShippingRateIdr] = useState(0); // Custom shipping cost IDR

  // Active batch info
  const [activeBatch, setActiveBatch] = useState<ActiveBatch | null>(null);
  const [loadingBatch, setLoadingBatch] = useState(true);
  const [copied, setCopied] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);

  const fetchLiveRate = async (curr: string) => {
    if (!curr) return;
    setFetchingRate(true);
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${curr}&to=IDR`);
      if (!res.ok) throw new Error("Gagal mengambil kurs.");
      const data = await res.json();
      const liveRate = data.rates.IDR;
      if (liveRate) {
        setExchangeRate(Math.round(liveRate));
      }
    } catch (err) {
      console.error("Gagal mengambil live rate:", err);
    } finally {
      setFetchingRate(false);
    }
  };

  const handleCurrencyChange = async (val: string) => {
    setCurrency(val);
    await fetchLiveRate(val);
  };

  // Fetch active batch on mount
  useEffect(() => {
    async function fetchBatch() {
      try {
        const res = await fetch("/api/jastip/active-batch");
        const data = await res.json();
        if (data.ok && data.batch) {
          const batch: ActiveBatch = data.batch;
          setActiveBatch(batch);
          setCurrency(batch.currency);
          setExchangeRate(Number(batch.exchangeRate) || 3500);
          setFeeType(batch.feeType as "flat" | "percent");
          setFeeValue(Number(batch.feeValue) || 15000);
        }
      } catch (err) {
        console.error("Gagal memuat batch aktif:", err);
      } finally {
        setLoadingBatch(false);
      }
    }
    fetchBatch();
  }, []);

  // Update URL params on changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (itemName) params.set("name", itemName);
    if (variant) params.set("variant", variant);
    if (price) params.set("price", price.toString());
    if (qty > 1) params.set("qty", qty.toString());
    if (weight) params.set("weight", weight.toString());

    const query = params.toString();
    router.replace(`/jastip/kalkulator${query ? `?${query}` : ""}`, { scroll: false });
  }, [itemName, variant, price, qty, weight, router]);

  // Calculations using central helper
  const breakdown = calculateItemPrice({
    price,
    exchangeRate,
    feeType,
    feeValue,
    qty,
    weightGrams: weight,
    totalWeightGrams: weight, // In stateless calc, total weight is item weight
    totalShippingIdr: shippingRateIdr,
  });

  // Build WA template text
  const waText = `Halo ${siteConfig.name}, saya tertarik untuk titip beli barang berikut:
- Nama Barang: ${itemName || "Barang Titipan"}
- Varian: ${variant || "-"}
- Harga Asal: ${price} ${currency}
- Jumlah: ${qty} pcs
- Estimasi Berat: ${weight ? `${weight} gram` : "-"}
------------------------
Estimasi Total Biaya Jastip: ${formatRupiah(breakdown.finalPriceIdr)}

Apakah barang ini bisa dititip? Terima kasih.`;

  const handleShareWa = () => {
    const waNumber = siteConfig.whatsappNumber;
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
    window.open(url, "_blank");
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(waText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-800 dark:text-zinc-100 font-sans flex flex-col transition-colors duration-200">

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-zinc-800 px-4 py-3 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2.5">
            <Link
              href="/jastip"
              className="px-4 py-1.5 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 font-bold text-xs border border-orange-200/50 hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-all cursor-pointer"
            >
              Lacak Order
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col gap-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/jastip"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-neutral-400 dark:text-zinc-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider cursor-pointer mb-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Jastip
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-800 dark:text-zinc-100 tracking-tight">
            Kalkulator Jastip
          </h1>
          <p className="text-xs md:text-sm font-medium text-neutral-400 dark:text-zinc-500 max-w-md mx-auto leading-relaxed">
            Hitung estimasi harga barang luar negeri Anda sampai Gresik berdasarkan kurs dan komisi jastip.
          </p>
        </div>

        {/* Info Batch Aktif */}
        {activeBatch ? (
          <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50/40 dark:bg-emerald-950/10 text-xs md:text-sm font-bold text-emerald-800 dark:text-emerald-450 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Menggunakan tarif otomatis: <strong>{activeBatch.name}</strong>
            </span>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
              1 {currency} = {formatRupiah(Number(activeBatch.exchangeRate))}
            </span>
          </div>
        ) : !loadingBatch ? (
          <div className="p-4 rounded-2xl border border-amber-100 dark:border-amber-950/30 bg-amber-50/40 dark:bg-amber-950/10 text-xs md:text-sm font-bold text-amber-800 dark:text-amber-450">
            ⚠ Tidak ada batch open yang aktif. Menggunakan tarif manual/fallback.
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Input Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-5 md:p-6 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">
              Input Barang Titipan
            </h2>

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-zinc-400 tracking-wider">
                  Nama Barang
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Starbucks Tumbler KL"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="px-3 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-zinc-400 tracking-wider">
                  Varian / Warna / Spek
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Green KL Edition, Size M"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="px-3 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-zinc-400 tracking-wider flex justify-between">
                    <span>Harga Barang ({currency})</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={price || ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="px-3 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-zinc-400 tracking-wider">
                    Jumlah (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qty || ""}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                    className="px-3 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-zinc-400 tracking-wider">
                    Berat Barang (Gram)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={weight || ""}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="px-3 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-zinc-400 tracking-wider">
                    Ongkir Lokal (Rp IDR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={shippingRateIdr || ""}
                    onChange={(e) => setShippingRateIdr(Number(e.target.value))}
                    className="px-3 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150"
                  />
                </div>
              </div>
            </div>

            <hr className="border-neutral-100 dark:border-zinc-800/80 my-2" />

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider flex justify-between">
                <span>Pengaturan Tarif</span>
                <span className="text-orange-500 text-[8px] font-normal lowercase">(bisa diedit)</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Mata Uang Asal"
                  value={currency}
                  onChange={handleCurrencyChange}
                  options={[
                    { value: "MYR", label: "MYR - Malaysia Ringgit" },
                    { value: "SGD", label: "SGD - Singapore Dollar" },
                    { value: "JPY", label: "JPY - Japan Yen" },
                    { value: "USD", label: "USD - US Dollar" },
                    { value: "THB", label: "THB - Thailand Baht" },
                    { value: "EUR", label: "EUR - Europe Euro" },
                    { value: "CNY", label: "CNY - China Renminbi" },
                    { value: "GBP", label: "GBP - UK Pound" },
                    { value: "AUD", label: "AUD - Australia Dollar" },
                    { value: "HKD", label: "HKD - Hong Kong Dollar" },
                  ]}
                  className="w-full"
                />

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-zinc-400 tracking-wider flex justify-between">
                    <span>Kurs 1 {currency} (IDR)</span>
                    {fetchingRate && <span className="text-orange-500 text-[8px] animate-pulse">loading...</span>}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={exchangeRate || ""}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                    className="px-3 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Jenis Fee Jastip"
                  value={feeType}
                  onChange={(val) => setFeeType(val as "flat" | "percent")}
                  options={[
                    { value: "flat", label: "Flat per Qty (Rp)" },
                    { value: "percent", label: "Persentase (%)" },
                  ]}
                />

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-zinc-400 tracking-wider">
                    Nilai Fee ({feeType === "flat" ? "Rp" : "%"})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={feeValue || ""}
                    onChange={(e) => setFeeValue(Number(e.target.value))}
                    className="px-3 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 rounded-xl text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Results Panel */}
          <div className="flex flex-col gap-6">

            {/* Result Breakdown Card */}
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-5">
              <h2 className="text-xs font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">
                Rincian Estimasi Biaya
              </h2>

              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                  <span className="text-neutral-500 dark:text-zinc-400">Harga Barang ({qty}x)</span>
                  <span className="font-bold text-neutral-700 dark:text-zinc-300">
                    {price} {currency}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                  <span className="text-neutral-500 dark:text-zinc-400">Harga Barang (IDR)</span>
                  <span className="font-bold text-neutral-700 dark:text-zinc-300">
                    {formatRupiah(breakdown.basePriceIdr)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                  <span className="text-neutral-500 dark:text-zinc-400 flex items-center gap-1">
                    Komisi / Fee Jastip
                    <span className="text-[10px] text-neutral-450 dark:text-zinc-500">
                      ({feeType === "flat" ? `${formatRupiah(feeValue)}/pcs` : `${feeValue}%`})
                    </span>
                  </span>
                  <span className="font-bold text-neutral-700 dark:text-zinc-300">
                    {formatRupiah(breakdown.feeIdr)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                  <span className="text-neutral-500 dark:text-zinc-400">Ongkos Kirim Lokal</span>
                  <span className="font-bold text-neutral-700 dark:text-zinc-300">
                    {formatRupiah(breakdown.shippingIdr)}
                  </span>
                </div>

                <hr className="border-neutral-100 dark:border-zinc-800" />

                <div className="flex justify-between items-end pt-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">
                      Estimasi Total
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-zinc-550 leading-none">
                      Sudah termasuk pajak impor jastip
                    </span>
                  </div>
                  <span className="text-xl md:text-2xl font-black text-orange-600 dark:text-orange-455">
                    {formatRupiah(breakdown.finalPriceIdr)}
                  </span>
                </div>
              </div>
            </div>

            {/* WA Teks Preview & Share Card */}
            <div className="bg-neutral-100/60 dark:bg-zinc-900/40 border border-neutral-200 dark:border-zinc-800/80 p-5 rounded-3xl shadow-sm space-y-4 flex flex-col">
              <h3 className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">
                Preview Format Pesanan WhatsApp
              </h3>

              <pre className="text-[10px] md:text-xs font-bold leading-relaxed bg-white dark:bg-zinc-950 p-4 border border-neutral-150 dark:border-zinc-850 rounded-2xl whitespace-pre-wrap select-all text-neutral-600 dark:text-zinc-300 max-h-44 overflow-y-auto">
                {waText}
              </pre>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleCopyText}
                  className="py-3 px-4 border border-neutral-200 dark:border-zinc-700 hover:border-neutral-450 dark:hover:border-zinc-550 hover:bg-white dark:hover:bg-zinc-800/50 rounded-xl font-extrabold text-xs tracking-wider uppercase cursor-pointer transition-colors"
                >
                  {copied ? "Tersalin! ✅" : "Salin Teks"}
                </button>
                <button
                  onClick={handleShareWa}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs tracking-wider uppercase rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.37 5.054L2 22l5.138-1.348a9.936 9.936 0 0 0 4.87 1.272h.004c5.505 0 9.99-4.478 9.99-9.984C22.007 6.478 17.521 2 12.012 2zm6.09 14.12c-.25.706-1.464 1.379-2.023 1.466-.497.078-1.144.139-3.327-.767-2.793-1.161-4.577-3.99-4.717-4.178-.14-.188-1.127-1.498-1.127-2.859 0-1.361.713-2.029.967-2.302.253-.274.554-.343.74-.343.185 0 .37.002.532.01.169.008.397-.064.62.474.228.552.78 1.902.848 2.04.068.138.113.3.02.485-.091.188-.137.3-.272.457-.137.156-.289.349-.413.468-.137.13-.28.27-.12.544.16.273.71 1.171 1.523 1.892.657.581 1.212.76 1.523.888.31.13.493.109.676-.1.183-.21.782-.906.993-1.214.21-.309.423-.258.713-.15.29.109 1.843.869 2.161 1.028.318.158.53.238.607.366.077.129.077.747-.174 1.454z" />
                  </svg>
                  Titip via WA
                </button>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Footer Section */}
      <footer className="w-full bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800 py-10 px-4 transition-colors duration-200">
        <div className="max-w-6xl mx-auto border-t border-neutral-100 dark:border-zinc-800 pt-6 text-center text-[10px] text-neutral-400 dark:text-zinc-500 font-medium">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </div>
      </footer>

    </div>
  );
}

export default function JastipCalculatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-xs font-bold text-neutral-450 dark:text-zinc-500">Loading calculator...</div>
      </div>
    }>
      <CalculatorContent />
    </Suspense>
  );
}
