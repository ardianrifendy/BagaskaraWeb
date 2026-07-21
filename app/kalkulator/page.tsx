import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: 'Pilih Kalkulator Platform Toko Online - Bagaskara Cell',
  description: 'Hitung biaya admin seller, komisi dinamis Tokopedia, TikTok Shop, dan program diskon Shopee terbaru secara akurat.',
};

export default function KalkulatorLandingPage() {
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-zinc-955 text-neutral-850 dark:text-zinc-100 font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-zinc-800 sticky top-0 z-40 px-4 py-2.5 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="w-10 h-10 rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-750 text-neutral-600 dark:text-zinc-300 transition-all flex items-center justify-center shadow-sm"
            title="Beranda"
          >
            🏠
          </Link>
        </div>
      </header>

      {/* Main Selection Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto w-full">
        {/* Title */}
        <div className="text-center select-none max-w-lg mb-8">
          <span className="text-[9px] bg-orange-105 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-md font-black uppercase tracking-widest">
            Kalkulator Seller
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-zinc-100 tracking-tight mt-3 uppercase">
            Pilih Kalkulator Platform
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 dark:text-zinc-400 font-medium mt-1 leading-relaxed">
            Hitung potongan biaya admin, program komisi seller center, gratis ongkir, dan profit bersih penjualan Anda secara otomatis.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full py-2">
          {/* Shopee Card */}
          <Link
            href="/kalkulator/shopee"
            className="group flex flex-col items-center text-center p-6 md:p-8 rounded-3xl border border-neutral-200 hover:border-orange-500 dark:border-zinc-800 dark:hover:border-orange-500 bg-white dark:bg-zinc-900 hover:bg-orange-50/10 dark:hover:bg-orange-950/5 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/30 border border-orange-200/50 flex items-center justify-center shadow-sm mb-5 transition-transform group-hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-orange-600">
                <path d="M4 7l.867 12.143a2 2 0 0 0 2 1.857h10.276a2 2 0 0 0 2 -1.857l.867 -12.143h-16z" />
                <path d="M8.5 7c0 -1.653 1.5 -4 3.5 -4s3.5 2.347 3.5 4" />
                <path d="M9.5 17c.413 .462 1 1 2.5 1s2.5 -.897 2.5 -2s-1 -1.5 -2.5 -2s-2 -1.47 -2 -2c0 -1.104 1 -2 2 -2s1.5 0 2.5 1" />
              </svg>
            </div>
            <h2 className="text-base font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              Kalkulator Shopee
            </h2>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 font-semibold leading-relaxed mt-3 text-justify w-full">
              Kalkulasikan potongan komisi admin terbaru 2026 untuk seller Non-Star, Star, Star+, hingga Shopee Mall beserta program Gratis Ongkir XTRA (GOX) dan Promo diskon.
            </p>
          </Link>

          {/* Tokopedia & TikTok Shop Card */}
          <Link
            href="/kalkulator/tokopedia"
            className="group flex flex-col items-center text-center p-6 md:p-8 rounded-3xl border border-neutral-200 hover:border-emerald-500 dark:border-zinc-800 dark:hover:border-emerald-500 bg-white dark:bg-zinc-900 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/5 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200/50 flex items-center justify-center shadow-sm mb-5 transition-transform group-hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-emerald-650">
                <path d="M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z" />
              </svg>
            </div>
            <h2 className="text-base font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Tokopedia &amp; TikTok
            </h2>
            <p className="text-xs text-neutral-500 dark:text-zinc-450 font-semibold leading-relaxed mt-3 text-justify w-full">
              Simulasikan potongan komisi dinamis 30 kategori per 18 Mei 2026, biaya platform Marketplace/Mall, promo GMV Max, komisi Affiliate, dan order handling fee.
            </p>
          </Link>
        </div>

        {/* Footer info */}
        <div className="bg-neutral-100 dark:bg-zinc-900 p-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 text-[10px] text-neutral-450 dark:text-zinc-500 font-extrabold text-center uppercase tracking-widest mt-8 w-full select-none">
          💡 Selalu update otomatis mengikuti regulasi seller center terbaru masing-masing platform
        </div>
      </div>

      {/* Footer Section */}
      <footer className="w-full bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800 py-10 px-4 transition-colors duration-200">
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
    </main>
  );
}
