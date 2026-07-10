"use client";

import { useState, useRef, useEffect } from "react";
import { SUPPORTED_COURIERS } from "@/lib/couriers";
import type { CourierCode } from "@/types/tracking";

interface CourierSelectProps {
  value: CourierCode | "";
  onChange: (value: CourierCode | "") => void;
  disabled?: boolean;
}

export default function CourierSelect({ value, onChange, disabled }: CourierSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCourier = SUPPORTED_COURIERS.find((c) => c.code === value);

  return (
    <div className="flex flex-col gap-1 w-full relative" ref={containerRef}>
      <label className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-wider select-none">
        Pilih Kurir
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-150 rounded-xl px-3.5 py-2.5 pr-10 text-left cursor-pointer focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 relative flex items-center justify-between transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <span className="truncate">
          {selectedCourier ? selectedCourier.label : "Pilih kurir pengiriman..."}
        </span>
        <svg
          className={`w-4 h-4 text-neutral-400 dark:text-zinc-500 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-zinc-850 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-zinc-800">
          {SUPPORTED_COURIERS.map((courier) => {
            const isActive = value === courier.code;
            return (
              <button
                key={courier.code}
                type="button"
                onClick={() => {
                  onChange(courier.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-xs md:text-sm rounded-xl font-bold cursor-pointer transition-colors ${
                  isActive
                    ? "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400"
                    : "text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-900/60"
                }`}
              >
                {courier.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
