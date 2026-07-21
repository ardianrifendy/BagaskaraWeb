"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { CalculatorSelectorModal } from './CalculatorSelectorModal';

export default function Navbar() {
  const pathname = usePathname() || '';
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);

  const isCalcActive = pathname.startsWith('/kalkulator');
  const isCekResiActive = pathname.startsWith('/cek-resi');

  const getButtonClass = (isActive: boolean) => {
    return isActive
      ? "w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm transition-all cursor-pointer border border-orange-600"
      : "w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 flex items-center justify-center text-neutral-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-all cursor-pointer";
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-zinc-800 px-3 py-2 sm:px-4 sm:py-3 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Tombol Kalkulator dengan Pop Up Seleksi Platform */}
            <button
              type="button"
              onClick={() => setIsCalculatorModalOpen(true)}
              className={getButtonClass(isCalcActive)}
              title="Kalkulator Potongan Shopee & Tokopedia"
            >
              <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h6" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Tombol Cek Resi */}
            <Link
              href="/cek-resi"
              className={getButtonClass(isCekResiActive)}
              title="Lacak Pengiriman (Cek Resi)"
            >
              <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011-1v-4a1 1 0 011-1h2m4 4h1a1 1 0 001-1v-4a1 1 0 00-.8-.8l-2.7-2.7a1 1 0 00-.7-.5H15" />
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
