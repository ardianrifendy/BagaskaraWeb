"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { siteConfig } from '@/config/site';
import tarifData from '@/data/tarif/tokopedia-2026-05-18.json';
import { computeTokopediaFees, getCategoryBySlug, calculateLogisticsFee } from '@/lib/kalkulator-tokopedia/fees';
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
import TutorialModal from '@/components/TutorialModal';

function CalculatorTokopediaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [productName, setProductName] = useState('');
  const [mode, setMode] = useState<'reverse' | 'calculate'>('reverse');
  const [storeType, setStoreType] = useState<StoreType>('marketplace');
  const [categorySlug, setCategorySlug] = useState('telepon-elektronik');

  // Input finansial utama (menggunakan number | '' agar bisa dihapus bersih)
  const [cost, setCost] = useState<number | ''>('');
  const [targetProfit, setTargetProfit] = useState<number | ''>('');
  const [hargaJualInput, setHargaJualInput] = useState<number | ''>('');
  const [sellerDiscount, setSellerDiscount] = useState<number | ''>('');
  const [qty, setQty] = useState(1);

  // Fisik Paket (Berat Gram)
  const [weightGram, setWeightGram] = useState<number | ''>('');

  // Opsi Lanjutan
  const [showOptions, setShowOptions] = useState(true);
  const [manualPlatformRate, setManualPlatformRate] = useState<number | ''>(3.5);
  const [isPlatformOverridden, setIsPlatformOverridden] = useState(false);

  const [affiliateRate, setAffiliateRate] = useState<number | ''>('');
  const [gmvMaxDiscountRate, setGmvMaxDiscountRate] = useState<number | ''>('');
  const [enableRisk, setEnableRisk] = useState(false);
  const [riskyOrderPct, setRiskyOrderPct] = useState<number | ''>('');
  
  const [logisticCost, setLogisticCost] = useState<number | ''>('');
  const [isLogisticOverridden, setIsLogisticOverridden] = useState(false);

  // Parameter Logistik BLL Otomatis
  const [logisticServiceType, setLogisticServiceType] = useState<'standar' | 'ekonomi' | 'kargo' | 'instan' | null>('standar');
  const [logisticRoute, setLogisticRoute] = useState<string>('java_jakarta');
  const [logisticOrigin, setLogisticOrigin] = useState<string>('jakarta');
  const [dimLength, setDimLength] = useState<number | ''>('');
  const [dimWidth, setDimWidth] = useState<number | ''>('');
  const [dimHeight, setDimHeight] = useState<number | ''>('');

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // States & Refs untuk dropdown kustom
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const routeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setIsServiceDropdownOpen(false);
      }
      if (routeDropdownRef.current && !routeDropdownRef.current.contains(event.target as Node)) {
        setIsRouteDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Auto-hitung estimasi biaya logistik dari berat paket jika berat > 0 dan belum di-override manual
  useEffect(() => {
    if (!isLogisticOverridden) {
      if (logisticServiceType) {
        const totalWeightGram = (typeof weightGram === 'number' ? weightGram : 0) * qty;
        const dims = (dimLength && dimWidth && dimHeight)
          ? { p: Number(dimLength), l: Number(dimWidth), t: Number(dimHeight) }
          : null;
        const bllRes = calculateLogisticsFee(
          logisticServiceType,
          logisticServiceType === 'instan' ? logisticOrigin : logisticRoute,
          totalWeightGram,
          dims,
          qty
        );
        if (bllRes.isUnavailable) {
          setLogisticCost(0);
        } else {
          setLogisticCost(bllRes.amount);
        }
      } else {
        setLogisticCost(0);
      }
    }
  }, [weightGram, qty, logisticServiceType, logisticRoute, logisticOrigin, dimLength, dimWidth, dimHeight, isLogisticOverridden]);

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
    if (modalParam) setCost(parseInt(modalParam, 10) || '');

    const profitParam = searchParams.get('profit');
    if (profitParam) setTargetProfit(parseInt(profitParam, 10) || '');

    const hargaParam = searchParams.get('harga');
    if (hargaParam) setHargaJualInput(parseInt(hargaParam, 10) || '');

    const qtyParam = searchParams.get('qty');
    if (qtyParam) setQty(parseInt(qtyParam, 10) || 1);

    const q = searchParams.get('q');
    if (q) setProductName(q);

    const platformParam = searchParams.get('plat');
    if (platformParam) {
      setManualPlatformRate(parseFloat(platformParam) || '');
      setIsPlatformOverridden(true);
    }

    const logistikParam = searchParams.get('log');
    if (logistikParam) {
      setLogisticCost(parseInt(logistikParam, 10) || '');
      setIsLogisticOverridden(true);
    }

    const beratParam = searchParams.get('berat');
    if (beratParam) setWeightGram(parseInt(beratParam, 10) || '');

    const servParam = searchParams.get('serv');
    if (servParam === 'standar' || servParam === 'ekonomi' || servParam === 'kargo' || servParam === 'instan') {
      setLogisticServiceType(servParam);
    }
    const routeParam = searchParams.get('route');
    if (routeParam) setLogisticRoute(routeParam);
    const origParam = searchParams.get('orig');
    if (origParam) setLogisticOrigin(origParam);
    const pParam = searchParams.get('p');
    if (pParam) setDimLength(parseInt(pParam, 10) || '');
    const lParam = searchParams.get('l');
    if (lParam) setDimWidth(parseInt(lParam, 10) || '');
    const tParam = searchParams.get('t');
    if (tParam) setDimHeight(parseInt(tParam, 10) || '');
  }, [searchParams]);

  // Sync state ke URL secara debounced
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (categorySlug !== 'telepon-elektronik') params.set('kat', categorySlug);
    if (mode !== 'reverse') params.set('mode', mode);
    if (storeType !== 'marketplace') params.set('st', storeType);
    if (typeof cost === 'number' && cost > 0) params.set('modal', cost.toString());
    if (productName) params.set('q', productName);
    if (mode === 'reverse' && typeof targetProfit === 'number' && targetProfit > 0) {
      params.set('profit', targetProfit.toString());
    } else if (mode === 'calculate' && typeof hargaJualInput === 'number' && hargaJualInput > 0) {
      params.set('harga', hargaJualInput.toString());
    }
    if (qty > 1) params.set('qty', qty.toString());
    if (isPlatformOverridden && typeof manualPlatformRate === 'number' && manualPlatformRate > 0) {
      params.set('plat', manualPlatformRate.toString());
    }
    if (isLogisticOverridden && typeof logisticCost === 'number' && logisticCost > 0) {
      params.set('log', logisticCost.toString());
    }
    if (typeof weightGram === 'number' && weightGram > 0) params.set('berat', weightGram.toString());

    if (logisticServiceType && logisticServiceType !== 'standar') params.set('serv', logisticServiceType);
    if (logisticRoute && logisticRoute !== 'java_jakarta') params.set('route', logisticRoute);
    if (logisticOrigin && logisticOrigin !== 'jakarta') params.set('orig', logisticOrigin);
    if (typeof dimLength === 'number' && dimLength > 0) params.set('p', dimLength.toString());
    if (typeof dimWidth === 'number' && dimWidth > 0) params.set('l', dimWidth.toString());
    if (typeof dimHeight === 'number' && dimHeight > 0) params.set('t', dimHeight.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [
    categorySlug, mode, storeType, cost, targetProfit, hargaJualInput, qty, productName,
    manualPlatformRate, isPlatformOverridden, logisticCost, isLogisticOverridden, weightGram,
    logisticServiceType, logisticRoute, logisticOrigin, dimLength, dimWidth, dimHeight, router
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrl();
    }, 300);
    return () => clearTimeout(timer);
  }, [updateUrl]);

  const getLogisticServiceLabel = (type: string | null) => {
    switch (type) {
      case 'standar': return '🚚 Standar';
      case 'ekonomi': return '✈️ Ekonomi';
      case 'kargo': return '📦 Kargo (Berat >2 kg)';
      case 'instan': return '⚡ Instan & Sameday';
      default: return 'Pilih Layanan';
    }
  };

  const getLogisticRouteLabel = (route: string) => {
    switch (route) {
      case 'java_jakarta': return 'Jawa ➔ Jawa (Jakarta)';
      case 'java_nonjakarta': return 'Jawa ➔ Jawa (Selain Jakarta)';
      case 'java_bali': return 'Jawa ➔ Bali';
      case 'java_nusa': return 'Jawa ➔ Nusa Tenggara';
      case 'java_sumatra': return 'Jawa ➔ Sumatera';
      case 'java_sulawesi': return 'Jawa ➔ Sulawesi';
      case 'java_kalimantan': return 'Jawa ➔ Kalimantan';
      case 'java_papua': return 'Jawa ➔ Papua & Maluku';
      case 'out_java': return 'Luar Jawa ➔ Luar Jawa';
      default: return route;
    }
  };

  const getLogisticOriginLabel = (origin: string) => {
    switch (origin) {
      case 'jakarta': return 'Jawa (Jakarta)';
      case 'non_jakarta': return 'Jawa (Selain Jakarta)';
      case 'bali': return 'Bali';
      case 'nusa': return 'Nusa Tenggara';
      case 'sumatra': return 'Sumatera';
      case 'sulawesi': return 'Sulawesi';
      case 'kalimantan': return 'Kalimantan';
      case 'papua': return 'Papua & Maluku';
      default: return origin;
    }
  };

  const category = getCategoryBySlug(categorySlug, false) as any;
  const profile: TokopediaProfile = { storeType, useTarifLama: false };

  const isInputEmpty = (cost === '' || cost === 0) && 
    (mode === 'reverse' ? (targetProfit === '' || targetProfit === 0) : (hargaJualInput === '' || hargaJualInput === 0));

  const inputPayload = {
    categorySlug,
    cost: cost === '' ? 0 : cost,
    qty,
    sellerDiscount: sellerDiscount === '' ? 0 : sellerDiscount,
    manualPlatformRate: manualPlatformRate === '' ? 0 : manualPlatformRate,
    affiliateRate: affiliateRate === '' ? 0 : affiliateRate,
    gmvMaxDiscountRate: gmvMaxDiscountRate === '' ? 0 : gmvMaxDiscountRate,
    orderHandlingFee: 1250,
    logisticCost: logisticCost === '' ? 0 : (isLogisticOverridden ? logisticCost : 0),
    riskyOrderPct: enableRisk && typeof riskyOrderPct === 'number' ? riskyOrderPct : 0,

    // BLL parameters
    logisticServiceType: isLogisticOverridden ? null : logisticServiceType,
    logisticRoute: isLogisticOverridden ? null : logisticRoute,
    logisticOrigin: isLogisticOverridden ? null : logisticOrigin,
    weightGram: weightGram === '' ? 0 : weightGram,
    dimensions: (dimLength && dimWidth && dimHeight)
      ? { p: Number(dimLength), l: Number(dimWidth), t: Number(dimHeight) }
      : null
  };

  let calcResult;
  let reverseResult;

  if (mode === 'reverse') {
    reverseResult = solveReverse(
      {
        ...inputPayload,
        targetProfit: targetProfit === '' ? 0 : targetProfit
      },
      profile
    );
    calcResult = reverseResult.breakdown;
  } else {
    calcResult = computeTokopediaFees(inputPayload, profile, hargaJualInput === '' ? 0 : hargaJualInput);
  }

  const currentHargaUnit = mode === 'reverse' ? (reverseResult?.suggestedPrice || 0) : (hargaJualInput === '' ? 0 : hargaJualInput);
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

        {/* Financial Inputs */}
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
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    value={weightGram}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWeightGram(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
                    }}
                    placeholder="cth. 4700"
                    className="w-full bg-neutral-50 border border-neutral-200 text-sm font-extrabold text-neutral-850 rounded-xl pl-3.5 pr-8 h-[46px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  {weightGram !== '' && (
                    <button
                      type="button"
                      onClick={() => setWeightGram('')}
                      className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 p-1 rounded-full text-[10px] transition-colors cursor-pointer"
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                </div>
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
                    <div className="flex items-center gap-1">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded select-none ${
                        isPlatformOverridden
                          ? 'bg-orange-50 text-orange-650 border border-orange-100'
                          : 'bg-emerald-50 text-emerald-650 border border-emerald-100'
                      }`}>
                        {isPlatformOverridden ? 'Kustom (Manual)' : 'Mengikuti Kategori'}
                      </span>
                      {isPlatformOverridden && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsPlatformOverridden(false);
                            const cat = getCategoryBySlug(categorySlug, false) as any;
                            const defaultRate = storeType === 'mall'
                              ? (cat.ratePlatformMall ?? 10.0)
                              : (cat.ratePlatformMarketplace ?? 7.75);
                            setManualPlatformRate(defaultRate);
                          }}
                          className="text-[9px] font-black text-emerald-655 hover:text-emerald-755 bg-neutral-100 hover:bg-neutral-200 px-1 py-0.5 rounded border border-neutral-300 transition-all cursor-pointer"
                          title="Kembali ke Auto"
                        >
                          ↺ Auto
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="0.01"
                      value={manualPlatformRate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setManualPlatformRate(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
                        setIsPlatformOverridden(true);
                      }}
                      placeholder="0"
                      className="w-full bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl pl-3.5 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-[40px]"
                    />
                    {manualPlatformRate !== '' && (
                      <button
                        type="button"
                        onClick={() => {
                          setManualPlatformRate('');
                          setIsPlatformOverridden(true);
                        }}
                        className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 p-1 rounded-full text-[10px] transition-colors cursor-pointer"
                        title="Clear"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Komisi Affiliate % */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Komisi Affiliate TikTok (%)</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={affiliateRate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAffiliateRate(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
                      }}
                      placeholder="0"
                      className="w-full bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl pl-3.5 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-[40px]"
                    />
                    {affiliateRate !== '' && (
                      <button
                        type="button"
                        onClick={() => setAffiliateRate('')}
                        className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 p-1 rounded-full text-[10px] transition-colors cursor-pointer"
                        title="Clear"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Diskon GMV Max % */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Diskon GMV Max (%)</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={gmvMaxDiscountRate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGmvMaxDiscountRate(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
                      }}
                      placeholder="0"
                      className="w-full bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl pl-3.5 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-[40px]"
                    />
                    {gmvMaxDiscountRate !== '' && (
                      <button
                        type="button"
                        onClick={() => setGmvMaxDiscountRate('')}
                        className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 p-1 rounded-full text-[10px] transition-colors cursor-pointer"
                        title="Clear"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Order Handling Fee */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Order Handling Fee</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded select-none bg-neutral-100 text-neutral-600 border border-neutral-200">
                      Paten Tokopedia
                    </span>
                  </div>
                  <div className="text-xs font-bold text-neutral-700 bg-neutral-50 px-3.5 py-2.5 rounded-xl border border-neutral-200 h-[40px] flex items-center">
                    ✔ Rp 1.250 / pesanan
                  </div>
                </div>

                {/* Logistik */}
                <div className="flex flex-col gap-3.5 col-span-1 md:col-span-2 border-t border-neutral-100 pt-3.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                      Biaya Layanan Logistik (BLL) &amp; Fisik Paket
                    </label>
                    <div className="flex items-center bg-neutral-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-neutral-200 dark:border-zinc-700 select-none">
                      <button
                        type="button"
                        onClick={() => setIsLogisticOverridden(false)}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black cursor-pointer transition-all ${
                          !isLogisticOverridden
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-750 dark:text-zinc-400'
                        }`}
                      >
                        Hitung Otomatis (BLL)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogisticOverridden(true);
                          if (logisticCost === '') setLogisticCost(0);
                        }}
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black cursor-pointer transition-all ${
                          isLogisticOverridden
                            ? 'bg-orange-600 text-white shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-750 dark:text-zinc-400'
                        }`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>

                  {!isLogisticOverridden && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-neutral-50/50 p-3.5 rounded-xl border border-neutral-200/60">
                      {/* Layanan Logistik */}
                      <div className="flex flex-col gap-1.5 relative" ref={serviceDropdownRef}>
                        <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Layanan Logistik</span>
                        <button
                          type="button"
                          onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                          className="w-full bg-white border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl px-3.5 py-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all flex items-center justify-between shadow-sm h-[40px]"
                        >
                          <span>{getLogisticServiceLabel(logisticServiceType)}</span>
                          <svg
                            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
                              isServiceDropdownOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isServiceDropdownOpen && (
                          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-neutral-200/85 rounded-xl shadow-xl z-35 p-1 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                            {[
                              { value: 'standar', label: '🚚 Standar' },
                              { value: 'ekonomi', label: '✈️ Ekonomi' },
                              { value: 'kargo', label: '📦 Kargo (Berat >2 kg)' },
                              { value: 'instan', label: '⚡ Instan & Sameday' }
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setLogisticServiceType(opt.value as any);
                                  setIsServiceDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold cursor-pointer transition-colors ${
                                  logisticServiceType === opt.value ? "bg-emerald-50 text-emerald-600" : "text-neutral-600 hover:bg-neutral-50"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Rute / Asal Pengiriman */}
                      <div className="flex flex-col gap-1.5 relative" ref={routeDropdownRef}>
                        {logisticServiceType === 'instan' ? (
                          <>
                            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Asal Pengiriman</span>
                            <button
                              type="button"
                              onClick={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
                              className="w-full bg-white border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl px-3.5 py-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all flex items-center justify-between shadow-sm h-[40px]"
                            >
                              <span>{getLogisticOriginLabel(logisticOrigin)}</span>
                              <svg
                                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
                                  isRouteDropdownOpen ? "rotate-180" : ""
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {isRouteDropdownOpen && (
                              <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-neutral-200/85 rounded-xl shadow-xl z-35 p-1 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[220px] overflow-y-auto">
                                {[
                                  { value: 'jakarta', label: 'Jawa (Jakarta)' },
                                  { value: 'non_jakarta', label: 'Jawa (Selain Jakarta)' },
                                  { value: 'bali', label: 'Bali' },
                                  { value: 'nusa', label: 'Nusa Tenggara' },
                                  { value: 'sumatra', label: 'Sumatera' },
                                  { value: 'sulawesi', label: 'Sulawesi' },
                                  { value: 'kalimantan', label: 'Kalimantan' },
                                  { value: 'papua', label: 'Papua & Maluku' }
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setLogisticOrigin(opt.value);
                                      setIsRouteDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold cursor-pointer transition-colors ${
                                      logisticOrigin === opt.value ? "bg-emerald-50 text-emerald-600" : "text-neutral-600 hover:bg-neutral-50"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Rute Pengiriman</span>
                            <button
                              type="button"
                              onClick={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
                              className="w-full bg-white border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl px-3.5 py-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all flex items-center justify-between shadow-sm h-[40px]"
                            >
                              <span>{getLogisticRouteLabel(logisticRoute)}</span>
                              <svg
                                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
                                  isRouteDropdownOpen ? "rotate-180" : ""
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {isRouteDropdownOpen && (
                              <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-neutral-200/85 rounded-xl shadow-xl z-35 p-1 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[220px] overflow-y-auto">
                                {[
                                  { value: 'java_jakarta', label: 'Jawa ➔ Jawa (Jakarta)' },
                                  { value: 'java_nonjakarta', label: 'Jawa ➔ Jawa (Selain Jakarta)' },
                                  { value: 'java_bali', label: 'Jawa ➔ Bali' },
                                  { value: 'java_nusa', label: 'Jawa ➔ Nusa Tenggara' },
                                  { value: 'java_sumatra', label: 'Jawa ➔ Sumatera' },
                                  { value: 'java_sulawesi', label: 'Jawa ➔ Sulawesi' },
                                  { value: 'java_kalimantan', label: 'Jawa ➔ Kalimantan' },
                                  { value: 'java_papua', label: 'Jawa ➔ Papua & Maluku' },
                                  { value: 'out_java', label: 'Luar Jawa ➔ Luar Jawa' }
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setLogisticRoute(opt.value);
                                      setIsRouteDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold cursor-pointer transition-colors ${
                                      logisticRoute === opt.value ? "bg-emerald-50 text-emerald-600" : "text-neutral-600 hover:bg-neutral-50"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>


                      {/* Dimensi Paket */}
                      <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
                        <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Dimensi Paket per Unit (P x L x T cm) - Opsional</span>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            min="0"
                            value={dimLength}
                            onChange={(e) => setDimLength(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                            placeholder="P (cm)"
                            className="w-full bg-white border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-[40px]"
                          />
                          <input
                            type="number"
                            min="0"
                            value={dimWidth}
                            onChange={(e) => setDimWidth(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                            placeholder="L (cm)"
                            className="w-full bg-white border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-[40px]"
                          />
                          <input
                            type="number"
                            min="0"
                            value={dimHeight}
                            onChange={(e) => setDimHeight(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                            placeholder="T (cm)"
                            className="w-full bg-white border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-[40px]"
                          />
                        </div>
                      </div>

                      {/* Display Info Berat Paket */}
                      <div className="col-span-1 md:col-span-2 text-[10px] border-t border-neutral-100 pt-2.5 mt-0.5 flex flex-wrap justify-between items-center text-neutral-500 font-extrabold gap-2">
                        {calcResult.totalBillableWeight ? (
                          <span>
                            Berat Dihitung: <strong className="text-neutral-700">{calcResult.totalBillableWeight.toFixed(2)} kg</strong>
                          </span>
                        ) : (
                          <span>Masukkan berat/dimensi</span>
                        )}
                        {calcResult.isLogisticUnavailable ? (
                          <span className="text-rose-600 font-black">⚠️ Rute / Berat N.A.</span>
                        ) : (
                          <span className="text-emerald-700 font-black">
                            Tarif BLL: Rp {(logisticCost || 0).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Manual Override Input */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                      {isLogisticOverridden ? 'Kustomisasi Manual Biaya Logistik (Rp)' : 'Atau Masukkan Manual (Override)'}
                    </span>
                    <MoneyInput
                      label=""
                      value={logisticCost}
                      onChange={(val) => {
                        setLogisticCost(val);
                        setIsLogisticOverridden(true);
                      }}
                      placeholder="cth. 1.520 (akan mengesampingkan hitungan otomatis)"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
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

        {/* Link Silang ke Shopee */}
        <div className="bg-orange-50/60 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-2xl flex flex-col gap-2.5 text-xs shadow-sm mt-2">
          <span className="font-black text-orange-900 dark:text-orange-450 uppercase tracking-widest text-[11px] text-center w-full block select-none">
            Jualan di Shopee juga?
          </span>
          <Link
            href="/kalkulator/shopee"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer text-center"
          >
            Hitung Harga Jual di Shopee ➔
          </Link>
        </div>
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
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean | undefined>(undefined);

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 text-neutral-850 font-sans">
      {/* Header */}
      <header className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-zinc-800 sticky top-0 z-40 px-4 py-2.5 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              href="/kalkulator/shopee"
              className="px-3 h-10 rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-750 text-neutral-650 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all shadow-sm shadow-neutral-100 dark:shadow-none flex items-center justify-center cursor-pointer font-extrabold text-xs gap-1.5"
              title="Pindah ke Kalkulator Shopee"
            >
              🛍️ Shopee
            </Link>
            <button
              type="button"
              onClick={() => setIsTutorialOpen(true)}
              className="px-3 h-10 rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-750 text-neutral-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm shadow-neutral-100 dark:shadow-none flex items-center justify-center cursor-pointer font-extrabold text-xs gap-1"
              title="Cara Penggunaan"
            >
              ❓ Cara Pakai
            </button>
            <Link
              href="/"
              className="w-10 h-10 rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-750 text-neutral-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center justify-center shadow-sm"
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

      {/* Footer Section */}
      <footer className="w-full bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800 py-10 px-4 mt-16 transition-colors duration-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Identity */}
          <div className="flex flex-col gap-2 text-left">
            <Logo />
            <p className="text-xs text-neutral-500 dark:text-zinc-400 max-w-xs mt-1">
              Katalog HP terpercaya di Gresik. Transaksi aman, transparan, dan jaminan barang berkualitas.
            </p>
          </div>

          {/* Location & Address */}
          <div className="flex flex-col gap-2 text-left">
            <span className="text-xs font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Lokasi Toko</span>
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
          <div className="flex flex-col gap-2 text-left">
            <span className="text-xs font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Hubungi / Toko Online</span>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-neutral-500 dark:text-zinc-400">WhatsApp Admin:</span>
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer"
                >
                  CS 1: +62 895-1367-9939
                </a>
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber2}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer"
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

        <div className="max-w-6xl mx-auto border-t border-neutral-100 dark:border-zinc-800 mt-8 pt-6 text-center text-[10px] text-neutral-400 dark:text-zinc-500 font-medium">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </div>
      </footer>

      {/* Render Welcome Tutorial Modal on first visit */}
      <TutorialModal
        storageKey="bagaskara-tutorial-tokopedia"
        badge="Tutorial Kalkulator"
        title="Cara Pakai Kalkulator Tokopedia &amp; TikTok"
        theme="emerald"
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        steps={[
          {
            icon: "⚖️",
            title: "Pilih Mode Perhitungan",
            description: "Mode 'Cari Harga Jual' mencari harga optimum untuk target profit tertentu. Mode 'Cek Profit' menghitung laba bersih dari harga jual Anda."
          },
          {
            icon: "🏷️",
            title: "Ketik Nama / Pilih Kategori",
            description: "Ketik nama barang Anda untuk mendapatkan saran kategori otomatis, atau klik 'Ubah' untuk memilih dari 30 kategori tarif resmi Tokopedia & TikTok Shop."
          },
          {
            icon: "⚙️",
            title: "Sesuaikan Opsi Lanjutan",
            description: "Gunakan menu Opsi Lanjutan untuk mengatur Komisi Platform kustom, Komisi Affiliate, Diskon GMV Max, Berat Paket, dan Estimasi Biaya Logistik Pengiriman."
          },
          {
            icon: "📊",
            title: "Salin &amp; Bagikan Hasil",
            description: "Klik tombol 'Salin Hasil' di panel kanan untuk menyalin rincian potongan biaya admin dan net profit bersih Anda ke papan klip dalam format teks rapi beserta link tautan."
          }
        ]}
      />
    </main>
  );
}
