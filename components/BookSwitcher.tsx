"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function BookSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeBook = searchParams.get("book") || "ready";

  const handleBookChange = (book: "ready" | "erafone") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("book", book);
    
    // Reset filters that might not make sense between books,
    // but keep search query 'q' and sorting 'sort' if possible
    params.delete("brand");
    params.delete("condition");
    params.delete("status");
    params.delete("budget"); // Reset budget as Erafone prices might vary widely
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full">
      <div className="bg-neutral-100 dark:bg-zinc-950 p-1 rounded-xl flex border border-neutral-200/50 dark:border-zinc-800/80 shadow-inner relative overflow-hidden">
        
        {/* Switch Background Slider (Visual Effect) */}
        <div 
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-black rounded-lg shadow-sm transition-all duration-300 ease-out z-0 ${
            activeBook === "erafone" 
              ? "left-[calc(50%+2px)]" 
              : "left-[4px]"
          }`}
        />

        {/* Tab 1: Stok Ready Toko */}
        <button
          onClick={() => handleBookChange("ready")}
          className={`flex-1 py-2 px-1 flex flex-col items-center justify-center gap-0.5 rounded-lg z-10 cursor-pointer transition-colors duration-200 ${
            activeBook === "ready"
              ? "text-orange-600 dark:text-orange-450 font-black"
              : "text-neutral-500 dark:text-zinc-400 hover:text-neutral-700 dark:hover:text-zinc-200 font-bold"
          }`}
        >
          <div className="flex items-center gap-1 text-xs">
            <span>📦</span>
            <span>Stok Ready</span>
          </div>
          <span className="text-[8px] opacity-75 font-semibold leading-none">
            Siap Kirim
          </span>
        </button>

        {/* Tab 2: Katalog Erafone */}
        <button
          onClick={() => handleBookChange("erafone")}
          className={`flex-1 py-2 px-1 flex flex-col items-center justify-center gap-0.5 rounded-lg z-10 cursor-pointer transition-colors duration-200 ${
            activeBook === "erafone"
              ? "text-orange-600 dark:text-orange-450 font-black"
              : "text-neutral-500 dark:text-zinc-400 hover:text-neutral-700 dark:hover:text-zinc-200 font-bold"
          }`}
        >
          <div className="flex items-center gap-1 text-xs">
            <span>🔍</span>
            <span>PO Erafone</span>
          </div>
          <span className="text-[8px] opacity-75 font-semibold leading-none">
            Indent 1-3 Hari
          </span>
        </button>

      </div>
    </div>
  );
}
