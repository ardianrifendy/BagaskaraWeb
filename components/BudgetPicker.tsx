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
    <div className="w-full">
      <h3 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-zinc-500 mb-2 select-none">
        Saring Budget
      </h3>
      {/* Budget Chips Grid */}
      <div className="grid grid-cols-2 gap-2">
        {BUDGET_OPTIONS.map((opt) => {
          const isActive = activeBudget === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelectBudget(opt.value)}
              className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border transition-all duration-200 cursor-pointer text-center ${
                isActive
                  ? "bg-orange-600 border-orange-600 text-white shadow-sm"
                  : "bg-neutral-50 dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-zinc-300 hover:border-neutral-300 dark:hover:border-zinc-700 hover:bg-neutral-100/60 dark:hover:bg-zinc-900/60"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
