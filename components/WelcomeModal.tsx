"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Logo from "./Logo";

const BUDGET_OPTIONS = [
  { label: "< 1 Juta", value: "<1jt" },
  { label: "1 - 2 Juta", value: "1-2jt" },
  { label: "2 - 3 Juta", value: "2-3jt" },
  { label: "3 - 5 Juta", value: "3-5jt" },
  { label: "5 Juta+", value: "5jt+" }
];

export default function WelcomeModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already visited in this session/browser
    const hasVisited = localStorage.getItem("bagaskara-welcome-shown");
    if (!hasVisited) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true);
    }
  }, []);

  const handleSelectBudget = (value: string) => {
    localStorage.setItem("bagaskara-welcome-shown", "true");
    setIsOpen(false);
    
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("budget", value);
    } else {
      params.delete("budget");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleClose = () => {
    localStorage.setItem("bagaskara-welcome-shown", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-3xl border border-neutral-100 dark:border-zinc-800 shadow-2xl overflow-hidden p-6 md:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-300 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-neutral-50 dark:bg-zinc-900 text-neutral-400 dark:text-zinc-500 hover:text-neutral-700 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer"
          title="Tutup & Lihat Semua"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Welcome Header */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="mb-2">
            <Logo />
          </div>
          <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-zinc-100 tracking-tight mt-2">
            Selamat Datang di Bagaskara Cell
          </h2>
          <p className="text-xs md:text-sm text-neutral-500 dark:text-zinc-400 leading-relaxed max-w-sm">
            Temukan smartphone dan tablet berkualitas dengan garansi resmi. Pilih rentang harga untuk mulai mencari produk yang sesuai.
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3 text-[10px] md:text-xs font-bold text-neutral-600 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
              </svg>
              Garansi Resmi
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
              </svg>
              Quality Check
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
              </svg>
              Siap Kirim
            </span>
          </div>
        </div>

        {/* Budget Selection Options */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="grid grid-cols-2 gap-2">
            {BUDGET_OPTIONS.map((opt, index) => {
              const isLast = index === BUDGET_OPTIONS.length - 1;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelectBudget(opt.value)}
                  className={`py-3 px-4 rounded-xl text-xs md:text-sm font-black border border-neutral-200 dark:border-zinc-800 bg-neutral-50 hover:bg-orange-50 hover:border-orange-500 hover:text-orange-600 dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:text-zinc-200 dark:hover:text-orange-450 transition-all duration-200 cursor-pointer text-center ${
                    isLast ? "col-span-2" : ""
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Skip/Lihat Semua button */}
          <button
            onClick={() => handleSelectBudget("")}
            className="w-full mt-2 py-3 px-6 rounded-xl text-xs md:text-sm font-black text-white bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-100 dark:shadow-none transition-all duration-200 cursor-pointer text-center"
          >
            Lihat Semua Produk
          </button>
        </div>

      </div>
    </div>
  );
}
