"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface FilterChipsProps {
  availableBrands: string[];
  availableConditions: string[];
}

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder: string;
}

function CustomSelect({ label, value, options, onChange, placeholder }: CustomSelectProps) {
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

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="flex flex-col gap-1.5 relative" ref={containerRef}>
      <span className="text-[10px] md:text-xs font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-xs md:text-sm font-bold text-neutral-700 dark:text-zinc-200 rounded-xl px-3 py-2.5 pr-10 text-left cursor-pointer focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 relative flex items-center justify-between transition-all"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
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
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-zinc-850 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-zinc-800">
          {/* Default Option (Placeholder) */}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 text-xs md:text-sm rounded-xl font-bold cursor-pointer transition-colors ${
              value === ""
                ? "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-450"
                : "text-neutral-700 dark:text-zinc-350 hover:bg-neutral-50 dark:hover:bg-zinc-900/60"
            }`}
          >
            {placeholder}
          </button>
          
          {options.map((opt) => {
            const isActive = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-xs md:text-sm rounded-xl font-bold cursor-pointer transition-colors ${
                  isActive
                    ? "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-450"
                    : "text-neutral-700 dark:text-zinc-350 hover:bg-neutral-50 dark:hover:bg-zinc-900/60"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FilterChips({ availableBrands, availableConditions }: FilterChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeBrand = searchParams.get("brand") || "";
  const activeCondition = searchParams.get("condition") || "";
  const activeStatus = searchParams.get("status") || "";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("brand");
    params.delete("condition");
    params.delete("status");
    params.delete("budget");
    params.delete("q");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const hasAnyActiveFilter = !!(
    activeBrand || 
    activeCondition || 
    activeStatus || 
    searchParams.has("budget") || 
    searchParams.has("q")
  );

  const brandOptions = availableBrands.map((b) => ({
    label: b,
    value: b.toLowerCase()
  }));

  const conditionOptions = [
    { label: "Baru", value: "baru" },
    { label: "Second", value: "second" },
    { label: "Like New", value: "like-new" }
  ];

  const statusOptions = [
    { label: "Ready Stok", value: "ready" },
    { label: "Habis / PO", value: "habis" }
  ];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Dropdowns Grid */}
      <div className="flex flex-col gap-3">
          
          {/* Brand select */}
          <CustomSelect
            label="Merek"
            value={activeBrand}
            options={brandOptions}
            onChange={(val) => handleFilterChange("brand", val)}
            placeholder="Semua Merek"
          />

          {/* Condition select */}
          <CustomSelect
            label="Kondisi"
            value={activeCondition}
            options={conditionOptions}
            onChange={(val) => handleFilterChange("condition", val)}
            placeholder="Semua Kondisi"
          />

          {/* Status select */}
          <CustomSelect
            label="Status Stok"
            value={activeStatus}
            options={statusOptions}
            onChange={(val) => handleFilterChange("status", val)}
            placeholder="Semua Status"
          />

      </div>

      {/* Clear Filters Button */}
      {hasAnyActiveFilter && (
        <div className="pt-2">
          <button
            onClick={clearAllFilters}
            className="w-full text-center text-xs font-bold text-red-650 dark:text-red-400 hover:text-red-750 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/20 hover:bg-red-100/70 dark:hover:bg-red-950/50 border border-red-200/50 dark:border-red-900/30 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Hapus Semua Filter ✕
          </button>
        </div>
      )}
    </div>
  );
}
