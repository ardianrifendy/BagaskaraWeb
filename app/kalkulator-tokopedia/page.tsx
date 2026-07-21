"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { siteConfig } from '@/config/site';
import tarifData from '@/data/tarif/tokopedia-2026-05-18.json';
import { computeTokopediaFees, getCategoryBySlug } from '@/lib/kalkulator-tokopedia/fees';
import { solveReverse } from '@/lib/kalkulator-tokopedia/solver';
import { TokopediaProfile, StoreType } from '@/lib/kalkulator-tokopedia/types';
import { ProductInputTokopedia } from '@/components/kalkulator-tokopedia/ProductInputTokopedia';
import { CategoryPickerTokopedia } from '@/components/kalkulator-tokopedia/CategoryPickerTokopedia';
import { WarningBannerTokopedia } from '@/components/kalkulator-tokopedia/WarningBannerTokopedia';
import { DisclaimerTokopedia } from '@/components/kalkulator-tokopedia/DisclaimerTokopedia';
import { ResultPanelTokopedia } from '@/components/kalkulator-tokopedia/ResultPanelTokopedia';
import { TokopediaTarifTable } from '@/components/kalkulator-tokopedia/TokopediaTarifTable';
import { TokopediaFaq } from '@/components/kalkulator-tokopedia/TokopediaFaq';
import { MoneyInput } from '@/components/kalkulator/MoneyInput';

function CalculatorTokopediaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [productName, setProductName] = useState('');
  const [mode, setMode] = useState<'reverse' | 'calculate'>('reverse');
  const [storeType, setStoreType] = useState<StoreType>('marketplace');
  const [categorySlug, setCategorySlug] = useState('telepon-elektronik');

  // Definisikan default 0 agar input bersih
  const [cost, setCost] = useState(0);
  const [targetProfit, setTargetProfit] = useState(0);
  const [hargaJualInput, setHargaJualInput] = useState(0);
  const [sellerDiscount, setSellerDiscount] = useState(0);
  const [qty, setQty] = useState(1);

  // Fisik Paket
  const [weightGram, setWeightGram] = useState(0);

  // Opsi Lanjutan
  const [showOptions, setShowOptions] = useState(true);
  const [manualPlatformRate, setManualPlatformRate] = useState<number>(3.5);
  const [isPlatformOverridden, setIsPlatformOverridden] = useState(false);

  const [affiliateRate, setAffiliateRate] = useState<number>(0);
  const [gmvMaxDiscountRate, setGmvMaxDiscountRate] = useState<number>(0);
  const [enableRisk, setEnableRisk] = useState(false);
  const [riskyOrderPct, setRiskyOrderPct] = useState<number>(0);
  const [logisticCost, setLogisticCost] = useState<number>(0);

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Auto-hitung estimasi biaya logistik dari berat paket jika berat > 0
  useEffect(() => {
    if (weightGram > 0) {
      const computedLogistics = Math.min(5055, 300 + Math.ceil(weightGram / 1000) * 260);
      setLogisticCost(computedLogistics);
    } else {
      setLogisticCost(0);
    }
  }, [weightGram]);

  // Sinkronisasi otomatis komisi platform berdasarkan kategori dan tipe toko
  useEffect(() => {
    if (!isPlatformOverridden) {
      const cat = getCategoryBySlug(categorySlug, false) as any;
      const defaultRate = storeType === 'mall'
        ? (cat.ratePlatformMall ?? 10.0)
        : (cat.ratePlatformMarketplace ?? 7.75);
      setManualPlatformRate(defaultRate);
    }
  }, [categorySlug, storeType, isPlatformOverridden]);

  // Read URL query params jika diakses via shared URL
  useEffect(() => {
    const kat = searchParams.get('kat');
    if (kat && tarifData.kategori.some((k) => k.slug === kat)) {
      setCategorySlug(kat);
    }
    const m = searchParams.get('mode');
    if (m === 'calculate' || m === 'reverse') {
      setMode(m);
    }
    const st = searchParams.get('st');
    if (st === 'marketplace' || st === 'mall') {
      setStoreType(st);
    }
    const modalParam = searchParams.get('modal');
    if (modalParam) setCost(parseInt(modalParam, 10) || 0);

    const profitParam = searchParams.get('profit');
    if (profitParam) setTargetProfit(parseInt(profitParam, 10) || 0);

    const hargaParam = searchParams.get('harga');
    if (hargaParam) setHargaJualInput(parseInt(hargaParam, 10) || 0);

    const qtyParam = searchParams.get('qty');
    if (qtyParam) setQty(parseInt(qtyParam, 10) || 1);

    const q = searchParams.get('q');
    if (q) setProductName(q);

    const platformParam = searchParams.get('plat');
    if (platformParam) {
      setManualPlatformRate(parseFloat(platformParam) || 0);
      setIsPlatformOverridden(true);
    }

    const logistikParam = searchParams.get('log');
    if (logistikParam) setLogisticCost(parseInt(logistikParam, 10) || 0);

    const beratParam = searchParams.get('berat');
    if (beratParam) setWeightGram(parseInt(beratParam, 10) || 0);
  }, [searchParams]);

  // Sync state ke URL secara debounced
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (categorySlug !== 'telepon-elektronik') params.set('kat', categorySlug);
    if (mode !== 'reverse') params.set('mode', mode);
    if (storeType !== 'marketplace') params.set('st', storeType);
    if (cost > 0) params.set('modal', cost.toString());
    if (productName) params.set('q', productName);
    if (mode === 'reverse' && targetProfit > 0) {
      params.set('profit', targetProfit.toString());
    } else if (mode === 'calculate' && hargaJualInput > 0) {
      params.set('harga', hargaJualInput.toString());
    }
    if (qty > 1) params.set('qty', qty.toString());
    if (isPlatformOverridden && manualPlatformRate > 0) params.set('plat', manualPlatformRate.toString());
    if (logisticCost > 0) params.set('log', logisticCost.toString());
    if (weightGram > 0) params.set('berat', weightGram.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [categorySlug, mode, storeType, cost, targetProfit, hargaJualInput, qty, productName, manualPlatformRate, isPlatformOverridden, logisticCost, weightGram, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrl();
    }, 300);
    return () => clearTimeout(timer);
  }, [updateUrl]);

  const category = getCategoryBySlug(categorySlug, false) as any;
  const profile: TokopediaProfile = { storeType, useTarifLama: false };

  const isInputEmpty = cost === 0 && (mode === 'reverse' ? targetProfit === 0 : hargaJualInput === 0);

  const inputPayload = {
    categorySlug,
    cost,
    qty,
    sellerDiscount,
    manualPlatformRate,
    affiliateRate,
    gmvMaxDiscountRate,
    orderHandlingFee: 1250,
    logisticCost,
    riskyOrderPct: enableRisk ? riskyOrderPct : 0
  };

  let calcResult;
  let reverseResult;

  if (mode === 'reverse') {
    reverseResult = solveReverse(
      {
        ...inputPayload,
        targetProfit
      },
      profile
    );
    calcResult = reverseResult.breakdown;
  } else {
    calcResult = computeTokopediaFees(inputPayload, profile, hargaJualInput);
  }

  const currentHargaUnit = mode === 'reverse' ? (reverseResult?.suggestedPrice || 0) : hargaJualInput;
  const isCapped = calcResult.items.some((i) => i.capped);

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Left Column (Inputs & Options) */}
      <div className="md:col-span-7 flex flex-col gap-4">
        {/* Profile & Store Type Badges */}
        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 text-xs flex flex-wrap justify-between items-center text-neutral-600 font-extrabold shadow-sm gap-2">
          {/* Tipe Toko Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-neutral-400">TIPE TOKO:</span>
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStoreType('marketplace')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                  storeType === 'marketplace'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                🏪 Power Merchant (Marketplace)
              </button>
              <button
                type="button"
                onClick={() => setStoreType('mall')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                  storeType === 'mall'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                🏬 Official Store (Mall)
              </button>
            </div>
          </div>

          {/* Skema Aktif */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">Tarif: 18 Mei 2026 (Terbaru)</span>
          </div>
        </div>

        {/* Tab Switcher Mode */}
        <div className="grid grid-cols-2 bg-neutral-100 p-1 rounded-2xl border border-neutral-200/65">
          <button
            type="button"
            onClick={() => setMode('reverse')}
            className={`py-2.5 text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
              mode === 'reverse'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            🎯 Cari Harga Jual
          </button>
          <button
            type="button"
            onClick={() => setMode('calculate')}
            className={`py-2.5 text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
              mode === 'calculate'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            💰 Cek Profit
          </button>
        </div>

        {/* Product Search & Category Input Section (Identik Shopee) */}
        <ProductInputTokopedia
          name={productName}
          categorySlug={categorySlug}
          onNameChange={setProductName}
          onCategoryChange={setCategorySlug}
          onOpenSelector={() => setIsPickerOpen(true)}
          useTarifLama={false}
          storeType={storeType}
        />

        {/* Financial Inputs (Kosong secara default untuk kenyamanan user) */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <MoneyInput label="Modal / HPP per unit" value={cost} onChange={setCost} placeholder="0" />
            {mode === 'reverse' ? (
              <MoneyInput label="Target Profit / unit" value={targetProfit} onChange={setTargetProfit} placeholder="0" />
            ) : (
              <MoneyInput label="Harga Jual per unit" value={hargaJualInput} onChange={setHargaJualInput} placeholder="0" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MoneyInput label="Diskon seller per unit" value={sellerDiscount} onChange={setSellerDiscount} placeholder="0" />
            
            {/* Input Berat Paket & Jumlah QTY */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Berat (Gram)</label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={weightGram || ''}
                  onChange={(e) => setWeightGram(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="cth. 4700"
                  className="w-full bg-neutral-50 border border-neutral-200 text-sm font-extrabold text-neutral-850 rounded-xl px-3.5 h-[46px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Jumlah (QTY)</label>
                <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 bg-neutral-50 h-[46px]">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="font-bold text-neutral-400 text-lg hover:text-emerald-600 h-full w-8 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-sm font-extrabold text-neutral-800">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(qty + 1)}
                    className="font-bold text-neutral-400 text-lg hover:text-emerald-600 h-full w-8 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Opsi Lanjutan */}
          <div className="border-t border-neutral-100 pt-3 mt-1">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>{showOptions ? '▼' : '▶'} Opsi Lanjutan &amp; Program Diskon</span>
            </button>

            {showOptions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3.5 pt-1">
                {/* Manual Komisi Platform % */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                      Komisi Platform (%)
                    </label>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded select-none ${
                      isPlatformOverridden
                        ? 'bg-orange-50 text-orange-650 border border-orange-100'
                        : 'bg-emerald-50 text-emerald-650 border border-emerald-100'
                    }`}>
                      {isPlatformOverridden ? 'Kustom (Manual)' : 'Otomatis Kategori'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.01"
                    value={manualPlatformRate || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      setManualPlatformRate(val);
                      setIsPlatformOverridden(true);
                    }}
                    placeholder="0"
                    className="w-full bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-[40px]"
                  />
                </div>

                {/* Komisi Affiliate % */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Komisi Affiliate TikTok (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={affiliateRate}
                    onChange={(e) => setAffiliateRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-[40px]"
                  />
                </div>

                {/* Diskon GMV Max % */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Diskon GMV Max (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={gmvMaxDiscountRate}
                    onChange={(e) => setGmvMaxDiscountRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0 (max 20%)"
                    className="w-full bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-[40px]"
                  />
                </div>

                {/* Order Handling Fee */}
                <div className="flex flex-col gap-1.5 justify-center">
                  <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Order Handling Fee</span>
                  <div className="text-xs font-bold text-neutral-700 bg-neutral-50 px-3.5 py-2.5 rounded-xl border border-neutral-200 h-[40px] flex items-center">
                    ✔ Rp 1.250 / pesanan
                  </div>
                </div>

                {/* Logistik */}
                <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                  <MoneyInput
                    label="Estimasi Biaya Layanan Logistik (Pengiriman)"
                    value={logisticCost}
                    onChange={setLogisticCost}
                    placeholder="cth. 1.520 (sesuai berat paket)"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Link Silang ke Shopee */}
        <div className="bg-orange-50/60 border border-orange-100 p-3.5 rounded-2xl flex items-center justify-between text-xs">
          <span className="font-extrabold text-orange-900">Jualan di Shopee juga? Hitung komisi Shopee Anda:</span>
          <Link
            href="/kalkulator-shopee"
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-sm transition-all"
          >
            Kalkulator Shopee ➔
          </Link>
        </div>
      </div>

      {/* Right Column (Sticky Result Panel) */}
      <div className="md:col-span-5 flex flex-col gap-4 md:sticky md:top-[76px] self-start">
        <WarningBannerTokopedia
          profit={calcResult.profit}
          marginPct={calcResult.marginPct}
          isCapped={isCapped}
          hargaJualUnit={currentHargaUnit}
          qty={qty}
          isEmpty={isInputEmpty}
        />

        <ResultPanelTokopedia
          result={calcResult}
          suggestedPrice={reverseResult?.suggestedPrice}
          rawPrice={reverseResult?.rawPrice}
          mode={mode}
          categoryName={category.nama}
          isEmpty={isInputEmpty}
        />
      </div>

      {/* Category Sheet Dialog */}
      <CategoryPickerTokopedia
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selectedSlug={categorySlug}
        onSelect={setCategorySlug}
        useTarifLama={false}
      />
    </div>
  );
}

export default function TokopediaCalculatorPage() {
  return (
    <main className="min-h-screen bg-neutral-50 pb-24 text-neutral-850 font-sans">
      {/* Header */}
      <header className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-zinc-800 sticky top-0 z-40 px-4 py-2.5 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 text-neutral-600 dark:text-zinc-300 transition-all flex items-center justify-center shadow-sm"
              title="Beranda"
            >
              🏠
            </Link>
          </div>
        </div>
      </header>

      {/* Title Section */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2 text-left">
        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md uppercase tracking-wider">
          Fitur Terbaru 2026
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-zinc-100 tracking-tight mt-2">
          Kalkulator Biaya Admin Tokopedia &amp; TikTok Shop
        </h1>
        <p className="text-xs md:text-sm text-neutral-500 dark:text-zinc-400 font-medium mt-1">
          Hitung potongan komisi platform, komisi dinamis 30 kategori, dan profit bersih seller Tokopedia &amp; TikTok Shop per 18 Mei 2026.
        </p>
      </div>

      <Suspense fallback={<div className="max-w-6xl mx-auto p-4 text-center text-xs font-extrabold text-neutral-400">Loading Kalkulator...</div>}>
        <CalculatorTokopediaContent />
      </Suspense>

      {/* Content SEO Section */}
      <div className="max-w-6xl mx-auto p-4 flex flex-col gap-8 mt-6">
        <DisclaimerTokopedia />
        <TokopediaTarifTable />
        <TokopediaFaq />
      </div>

      {/* Footer */}
      <footer className="w-full bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800 py-8 px-4 mt-16 text-center text-[10px] text-neutral-400">
        &copy; {new Date().getFullYear()} {siteConfig.name}. Tokopedia &amp; TikTok Shop Calculator v1.0.
      </footer>
    </main>
  );
}
