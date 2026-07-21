"use client";

import React from 'react';
import Link from 'next/link';

interface CalculatorSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorSelectorModal: React.FC<CalculatorSelectorModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Card Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-neutral-200/80 dark:border-zinc-800 shadow-2xl p-6 flex flex-col gap-5 overflow-hidden animate-in zoom-in-95 duration-200 z-10">
        {/* Header (Centered and Bolded) */}
        <div className="relative pb-3 border-b border-neutral-150 dark:border-zinc-850 text-center select-none">
          <h3 className="text-base font-black text-neutral-900 dark:text-zinc-100 tracking-wider uppercase">
            Pilih Kalkulator Platform
          </h3>
          <span className="text-[9px] text-neutral-450 dark:text-zinc-500 font-black uppercase tracking-widest mt-1 block">
            Hitung Biaya Admin &amp; Margin Keuntungan
          </span>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-850 flex items-center justify-center text-neutral-400 dark:text-zinc-400 hover:text-neutral-600 dark:hover:text-zinc-200 transition-colors cursor-pointer text-xs font-black shadow-sm"
          >
            ✕
          </button>
        </div>

        {/* Platforms Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-1">
          {/* Shopee Card */}
          <Link
            href="/kalkulator/shopee"
            onClick={onClose}
            className="group flex flex-col items-center text-center p-5 rounded-2xl border border-neutral-200 hover:border-orange-500 dark:border-zinc-800 dark:hover:border-orange-500 bg-neutral-50/50 dark:bg-zinc-850/40 hover:bg-orange-50/20 dark:hover:bg-orange-950/10 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            {/* Centered Icon Container */}
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/30 border border-orange-200/50 flex items-center justify-center shadow-sm mb-4 transition-transform group-hover:scale-105">
              {/* Shopee Tabler SVG Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-orange-600">
                <path d="M4 7l.867 12.143a2 2 0 0 0 2 1.857h10.276a2 2 0 0 0 2 -1.857l.867 -12.143h-16z" />
                <path d="M8.5 7c0 -1.653 1.5 -4 3.5 -4s3.5 2.347 3.5 4" />
                <path d="M9.5 17c.413 .462 1 1 2.5 1s2.5 -.897 2.5 -2s-1 -1.5 -2.5 -2s-2 -1.47 -2 -2c0 -1.104 1 -2 2 -2s1.5 0 2.5 1" />
              </svg>
            </div>
            <h4 className="text-sm font-black text-orange-600 dark:text-orange-400 uppercase tracking-tight">
              Kalkulator Shopee
            </h4>
            {/* Justified Description */}
            <p className="text-[11px] text-neutral-500 dark:text-zinc-450 font-medium leading-relaxed mt-2.5 text-justify w-full">
              Skema tarif komisi terbaru 2026 untuk Go Ekspor (GOX), Star/Star+, Shopee Mall, dan Program Diskon.
            </p>
          </Link>

          {/* Tokopedia & TikTok Shop Card */}
          <Link
            href="/kalkulator/tokopedia"
            onClick={onClose}
            className="group flex flex-col items-center text-center p-5 rounded-2xl border border-neutral-200 hover:border-emerald-500 dark:border-zinc-800 dark:hover:border-emerald-500 bg-neutral-50/50 dark:bg-zinc-850/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            {/* Centered Icon Container */}
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200/50 flex items-center justify-center shadow-sm mb-4 transition-transform group-hover:scale-105">
              {/* TikTok Tabler SVG Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-emerald-650">
                <path d="M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z" />
              </svg>
            </div>
            <h4 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">
              Tokopedia &amp; TikTok
            </h4>
            {/* Justified Description */}
            <p className="text-[11px] text-neutral-500 dark:text-zinc-450 font-medium leading-relaxed mt-2.5 text-justify w-full">
              Skema komisi dinamis 30 kategori per 18 Mei 2026, Merchant Fee, Affiliate, dan Penanganan.
            </p>
          </Link>
        </div>

        {/* Footer info */}
        <div className="bg-neutral-50 dark:bg-zinc-850/60 p-3 rounded-2xl border border-neutral-100 dark:border-zinc-800 text-[10px] text-neutral-450 dark:text-zinc-500 font-extrabold text-center uppercase tracking-wider">
          💡 Selalu update otomatis mengikuti regulasi seller center terbaru
        </div>
      </div>
    </div>
  );
};
