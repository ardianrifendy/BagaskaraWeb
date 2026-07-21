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
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-neutral-200/80 dark:border-zinc-800 shadow-2xl p-6 flex flex-col gap-5 overflow-hidden animate-in zoom-in-95 duration-200 z-10 text-left">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-zinc-850">
          <div className="flex flex-col">
            <h3 className="text-base font-black text-neutral-900 dark:text-zinc-100 tracking-tight">
              Pilih Kalkulator Platform
            </h3>
            <span className="text-[10px] text-neutral-450 dark:text-zinc-500 font-extrabold uppercase tracking-wider mt-0.5">
              Hitung Biaya Admin &amp; Margin Keuntungan
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-850 flex items-center justify-center text-neutral-400 dark:text-zinc-400 hover:text-neutral-600 dark:hover:text-zinc-200 transition-colors cursor-pointer text-xs font-black shadow-sm"
          >
            ✕
          </button>
        </div>

        {/* Platforms Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {/* Shopee Card */}
          <Link
            href="/kalkulator/shopee"
            onClick={onClose}
            className="group flex flex-col p-5 rounded-2xl border border-neutral-200 hover:border-orange-500 dark:border-zinc-800 dark:hover:border-orange-500 bg-neutral-50/50 dark:bg-zinc-850/40 hover:bg-orange-50/20 dark:hover:bg-orange-950/10 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/30 border border-orange-200/50 flex items-center justify-center text-xl shadow-sm mb-4 transition-transform group-hover:scale-105">
              🛍️
            </div>
            <h4 className="text-sm font-black text-orange-655 dark:text-orange-400 uppercase tracking-tight">
              Kalkulator Shopee
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 font-medium leading-relaxed mt-1">
              Skema tarif komisi terbaru 2026 untuk Go Ekspor (GOX), Star/Star+, Shopee Mall, dan Program Diskon.
            </p>
          </Link>

          {/* Tokopedia & TikTok Shop Card */}
          <Link
            href="/kalkulator/tokopedia"
            onClick={onClose}
            className="group flex flex-col p-5 rounded-2xl border border-neutral-200 hover:border-emerald-500 dark:border-zinc-800 dark:hover:border-emerald-500 bg-neutral-50/50 dark:bg-zinc-850/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200/50 flex items-center justify-center text-xl shadow-sm mb-4 transition-transform group-hover:scale-105">
              🟢
            </div>
            <h4 className="text-sm font-black text-emerald-750 dark:text-emerald-400 uppercase tracking-tight">
              Tokopedia &amp; TikTok
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 font-medium leading-relaxed mt-1">
              Skema komisi dinamis 30 kategori per 18 Mei 2026, Merchant Fee, Affiliate, dan Penanganan.
            </p>
          </Link>
        </div>

        {/* Footer info */}
        <div className="bg-neutral-50 dark:bg-zinc-850/60 p-3 rounded-2xl border border-neutral-100 dark:border-zinc-800 text-[10px] text-neutral-400 dark:text-zinc-500 font-extrabold text-center uppercase tracking-wide">
          💡 Selalu update otomatis mengikuti regulasi Seller Center terbaru
        </div>
      </div>
    </div>
  );
};
