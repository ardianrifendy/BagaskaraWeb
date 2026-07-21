"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { CalculatorSelectorModal } from './CalculatorSelectorModal';

export default function Navbar() {
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-zinc-800 px-4 py-3 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          
          <div className="flex items-center gap-2.5">
            {/* Tombol Kalkulator dengan Pop Up Seleksi Platform */}
            <button
              type="button"
              onClick={() => setIsCalculatorModalOpen(true)}
              className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 flex items-center justify-center text-neutral-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
              title="Kalkulator Potongan Shopee & Tokopedia"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h6" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Tombol Cek Resi */}
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

            {/* Tombol Prediksi Pasar */}
            <Link
              href="/prediction"
              className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 flex items-center justify-center text-neutral-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
              title="Prediksi Pasar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </Link>

            {/* Tombol Jastip (Box) */}
            <Link
              href="/jastip"
              className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 flex items-center justify-center text-neutral-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
              title="Jasa Titip (Jastip)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Modal Pemilihan Kalkulator Platform */}
      <CalculatorSelectorModal
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
      />
    </>
  );
}
