"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useStoreProfile, useActiveProduct } from '@/lib/kalkulator/store/localStorage';
import { calculateFees } from '@/lib/kalkulator/engine/calc';
import { findMinimumPrice } from '@/lib/kalkulator/engine/reverse';
import { formatIDR } from '@/lib/kalkulator/format';
import { ProductInputComponent } from '@/components/kalkulator/ProductInput';
import { CategorySheet } from '@/components/kalkulator/CategorySheet';
import { ProgramToggles } from '@/components/kalkulator/ProgramToggles';
import { WarningBanner } from '@/components/kalkulator/WarningBanner';
import { ResultPanel } from '@/components/kalkulator/ResultPanel';
import { MoneyInput } from '@/components/kalkulator/MoneyInput';
import { SettingsModal } from '@/components/kalkulator/SettingsModal';
import { ComparisonModal } from '@/components/kalkulator/ComparisonModal';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { siteConfig } from '@/config/site';
import TutorialModal from '@/components/TutorialModal';

export default function CalculatorPage() {
  const [profile, setProfile] = useStoreProfile();
  const [product, setProduct] = useActiveProduct();
  const [mode, setMode] = useState<'reverse' | 'calculate'>('reverse'); // Default 'Cari Harga Jual'
  
  // Modal states
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  
  // Custom dropdown state
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  const [showOptions, setShowOptions] = useState(false);

  // States lokal dinamis untuk input
  const [targetProfit, setTargetProfit] = useState<number>(30000);
  const [cost, setCost] = useState<number>(45000);
  const [sellerDiscount, setSellerDiscount] = useState<number>(0);
  const [qty, setQty] = useState<number>(1);
  const [priceInput, setPriceInput] = useState<number>(95000); // untuk mode Cek Profit

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
        setIsSizeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hitung
  let calcResult;
  let reverseResult;

  if (mode === 'reverse') {
    reverseResult = findMinimumPrice(
      {
        ...product,
        cost: cost,
        targetProfit: targetProfit,
        sellerDiscount: sellerDiscount,
        qty: qty
      },
      profile
    );
    calcResult = reverseResult.breakdown;
  } else {
    // Mode Cek Profit
    calcResult = calculateFees(
      {
        ...product,
        cost: cost,
        sellerDiscount: sellerDiscount,
        qty: qty
      },
      profile,
      priceInput
    );
  }

  const activePriceForComparison = mode === 'reverse' ? (reverseResult?.suggestedPrice || 0) : priceInput;

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 text-neutral-850 font-sans">
      {/* Header Bagaskara Cell Style */}
      <header className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-zinc-800 sticky top-0 z-40 px-4 py-2.5 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-black px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-750 text-neutral-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all flex items-center gap-1.5 shadow-sm shadow-neutral-100 dark:shadow-none cursor-pointer"
            >
              🏠 Beranda
            </Link>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-750 text-neutral-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all shadow-sm shadow-neutral-100 dark:shadow-none flex items-center justify-center cursor-pointer"
              title="Pengaturan Profil Toko"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Main Container - Responsive Grid */}
      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column (Inputs & Settings) */}
        <div className="md:col-span-7 flex flex-col gap-4">
          {/* Profile Summary Badge */}
          <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 text-xs flex justify-between items-center text-neutral-600 font-extrabold shadow-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-600 animate-pulse"></span>
              Toko: <span className="text-orange-600 uppercase font-black">{profile.sellerType}</span> {profile.isNewStore ? '(Toko Baru)' : ''}
            </span>
            <span className="text-neutral-450 font-extrabold">
              Program: <span className="text-neutral-700">
                {profile.joinedGOX ? 'GOX ' : ''}
                {profile.joinedInsurance ? '+ ASURANSI ' : ''}
                {profile.promoProgram !== 'none' ? `+ ${profile.promoProgram.toUpperCase()}` : (profile.joinedGOX || profile.joinedInsurance ? '' : 'Normal')}
              </span>
            </span>
          </div>

          {/* Tab switcher */}
          <div className="grid grid-cols-2 bg-neutral-100 p-1 rounded-2xl border border-neutral-200/65">
            <button
              type="button"
              onClick={() => setMode('reverse')}
              className={`py-2 text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
                mode === 'reverse'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              🎯 Cari Harga Jual
            </button>
            <button
              type="button"
              onClick={() => setMode('calculate')}
              className={`py-2 text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
                mode === 'calculate'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              💰 Cek Profit
            </button>
          </div>

          {/* Product Input Section */}
          <ProductInputComponent
            name={product.name}
            categoryKey={product.categoryKey}
            onNameChange={(name) => setProduct({ ...product, name })}
            onCategoryChange={(key) => setProduct({ ...product, categoryKey: key })}
            onOpenSelector={() => setIsCategorySheetOpen(true)}
            onSelectProductSuggestion={(name, categoryKey, price) => {
              setProduct({ ...product, name, categoryKey });
              setCost(price);
            }}
          />

          {/* Financial Inputs */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <MoneyInput label="Modal / HPP per unit" value={cost} onChange={setCost} />
              {mode === 'reverse' ? (
                <MoneyInput label="Target Profit / unit" value={targetProfit} onChange={setTargetProfit} />
              ) : (
                <MoneyInput label="Harga Jual" value={priceInput} onChange={setPriceInput} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MoneyInput label="Diskon ditanggung seller" value={sellerDiscount} onChange={setSellerDiscount} />
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Jumlah (QTY)</label>
                <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2 bg-neutral-50 h-[46px]">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="font-bold text-neutral-400 text-lg hover:text-orange-600 h-full w-8 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-sm font-extrabold text-neutral-800">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(qty + 1)}
                    className="font-bold text-neutral-400 text-lg hover:text-orange-600 h-full w-8 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Opsi Lanjutan Collapse */}
            <div className="border-t border-neutral-100 pt-3 mt-1">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="text-[10px] font-extrabold text-neutral-400 hover:text-neutral-700 flex items-center gap-1.5 uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>{showOptions ? '▼' : '▶'} Opsi Lanjutan</span>
              </button>

              {showOptions && (
                <div className="grid grid-cols-2 gap-4 mt-3.5 pt-1">
                  {/* Pre-Order Toggle */}
                  <div className="flex flex-col gap-1.5 justify-center">
                    <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Pre-Order (PO)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={product.isPreOrder}
                        onChange={(e) => setProduct({ ...product, isPreOrder: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>

                  {/* Ukuran (GOX tier) - Custom Dropdown */}
                  <div className="flex flex-col gap-1.5 relative" ref={sizeDropdownRef}>
                    <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Ukuran Paket</label>
                    <button
                      type="button"
                      onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                      className="w-full bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-850 rounded-xl px-3.5 py-2.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all flex items-center justify-between shadow-sm h-[40px]"
                    >
                      <span>{product.size === 'biasa' ? 'Biasa (<5kg & <60cm)' : 'Khusus (>=5kg / >=60cm)'}</span>
                      <svg
                        className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
                          isSizeDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isSizeDropdownOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-neutral-200/85 rounded-xl shadow-xl z-35 p-1 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setProduct({ ...product, size: 'biasa' });
                            setIsSizeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold cursor-pointer transition-colors ${
                            product.size === 'biasa' ? "bg-orange-50 text-orange-600" : "text-neutral-600 hover:bg-neutral-50"
                          }`}
                        >
                          Biasa (&lt;5kg &amp; &lt;60cm)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProduct({ ...product, size: 'khusus' });
                            setIsSizeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold cursor-pointer transition-colors ${
                            product.size === 'khusus' ? "bg-orange-50 text-orange-600" : "text-neutral-600 hover:bg-neutral-50"
                          }`}
                        >
                          Khusus (&gt;=5kg / &gt;=60cm)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Program Toggles */}
          <ProgramToggles profile={profile} onChange={setProfile} onCompareClick={() => setIsComparisonOpen(true)} />
        </div>

        {/* Right Column (Sticky Result Panel) */}
        <div className="md:col-span-5 flex flex-col gap-4 md:sticky md:top-[76px] self-start">
          {/* Warning Banner */}
          <WarningBanner
            profit={calcResult.profit}
            marginPct={calcResult.marginPct}
            isNewStore={profile.isNewStore}
          />

          {/* Result Panel */}
          <ResultPanel
            result={calcResult}
            suggestedPrice={reverseResult?.suggestedPrice}
            rawPrice={reverseResult?.rawPrice}
            mode={mode}
          />
        </div>
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

      {/* Category selector bottom sheet */}
      <CategorySheet
        isOpen={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        selectedKey={product.categoryKey}
        onSelect={(key) => setProduct({ ...product, categoryKey: key })}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onChange={setProfile}
      />

      {/* Comparison Modal */}
      <ComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        product={product}
        profile={profile}
        activePrice={activePriceForComparison}
      />

      {/* Welcome Tutorial Modal */}
      <TutorialModal
        storageKey="bagaskara-tutorial-kalkulator"
        badge="Tutorial Kalkulator"
        title="Cara Pakai Kalkulator Shopee"
        steps={[
          {
            icon: "⚖️",
            title: "Pilih Mode Perhitungan",
            description: "Gunakan tombol di atas untuk beralih mode. Mode 'Cari Harga Jual' mencari harga optimum untuk target profit tertentu. Mode 'Cek Profit' menghitung laba bersih dari harga jual Anda."
          },
          {
            icon: "🔍",
            title: "Ketik Nama Barang",
            description: "Ketik nama HP atau aksesoris. Autocomplete akan menyarankan produk dari stok toko terdaftar beserta modal dasarnya (HPP), atau mendeteksi kategori yang sesuai secara otomatis."
          },
          {
            icon: "📊",
            title: "Bandingkan & Sesuaikan",
            description: "Aktifkan Gratis Ongkir XTRA, asuransi (0.5%), dan SPayLater. Klik tombol 'Bandingkan 4 Program' di panel bawah untuk melihat perbandingan margin keuntungan Anda."
          }
        ]}
      />
    </main>
  );
}
