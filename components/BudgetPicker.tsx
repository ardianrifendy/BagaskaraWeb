"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface BudgetOption {
  label: string;
  value: string;
}

const BUDGET_OPTIONS: BudgetOption[] = [
  { label: "< 1 Juta", value: "<1jt" },
  { label: "1 - 2 Juta", value: "1-2jt" },
  { label: "2 - 3 Juta", value: "2-3jt" },
  { label: "3 - 5 Juta", value: "3-5jt" },
  { label: "5 Juta+", value: "5jt+" }
];

export default function BudgetPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeBudget = searchParams.get("budget") || "";

  const handleSelectBudget = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("budget", value);
    } else {
      params.delete("budget");
    }
    // Reset to page 1 if pagination exists (not in Fase 1, but good practice)
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full py-6 px-4 bg-gradient-to-b from-neutral-50 to-white dark:from-zinc-950 dark:to-zinc-900/60 border-b border-neutral-100 dark:border-zinc-800/80 transition-colors duration-200">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-xs md:text-sm font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider mb-3.5">
          Cari HP Sesuai Budget Anda
        </h2>

        {/* Budget Chips Grid/Row */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-2.5 max-w-lg md:max-w-none mx-auto">
          {BUDGET_OPTIONS.map((opt) => {
            const isActive = activeBudget === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelectBudget(opt.value)}
                className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all duration-200 cursor-pointer text-center ${
                  isActive
                    ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-100 dark:shadow-none scale-[1.02]"
                    : "bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-zinc-350 hover:border-neutral-300 dark:hover:border-zinc-700 hover:bg-neutral-50 dark:hover:bg-zinc-800 active:bg-neutral-100 dark:active:bg-zinc-800"
                }`}
              >
                {opt.label}
              </button>
            );
          })}

        </div>
      </div>
    </div>
  );
}
