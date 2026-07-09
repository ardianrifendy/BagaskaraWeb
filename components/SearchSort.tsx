/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface SearchSuggestionItem {
  id: string;
  brand: string;
  name: string;
  isScraped: number;
}

interface SearchSortProps {
  suggestions?: SearchSuggestionItem[];
}

export default function SearchSort({ suggestions = [] }: SearchSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const activeSort = searchParams.get("sort") || "newest";

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const sortContainerRef = useRef<HTMLDivElement>(null);

  // Sync state with URL when search params change externally
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Handle autocomplete filtering
  useEffect(() => {
    if (!query.trim()) {
      setFilteredSuggestions([]);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const matches = suggestions
      .filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.brand.toLowerCase().includes(searchTerm)
      )
      .slice(0, 6); // Limit to 6 matches

    setFilteredSuggestions(matches);
  }, [query, suggestions]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        sortContainerRef.current &&
        !sortContainerRef.current.contains(event.target as Node)
      ) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleClearSearch = () => {
    setQuery("");
    setShowSuggestions(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSuggestionClick = (item: SearchSuggestionItem) => {
    setQuery(item.name);
    setShowSuggestions(false);
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q"); // Clear keyword filter
    params.set("produk", item.id); // Open details overlay directly
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (value: string) => {
    setIsSortOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "newest") {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const sortOptions = [
    { label: "Terbaru", value: "newest" },
    { label: "Harga: Terendah", value: "price-asc" },
    { label: "Harga: Tertinggi", value: "price-desc" }
  ];

  const currentSortLabel = sortOptions.find((opt) => opt.value === activeSort)?.label || "Terbaru";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2 flex flex-col md:flex-row gap-3 items-center justify-between">
      
      {/* Search Input Bar with Autocomplete Suggestions */}
      <div className="relative w-full md:max-w-md" ref={searchContainerRef}>
        <form onSubmit={handleSearchSubmit}>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Cari merek, tipe HP..."
            className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-xs md:text-sm font-bold dark:text-zinc-150 dark:placeholder-zinc-500 transition-all shadow-sm"
          />
          {/* Search Icon */}
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500 pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-450 hover:text-neutral-600 dark:hover:text-zinc-300 cursor-pointer text-xs"
            >
              ✕
            </button>
          )}
        </form>

        {/* Search Suggestions Dropdown Card */}
        {showSuggestions && query.trim() !== "" && (
          <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-zinc-850 rounded-2xl shadow-xl z-40 p-1.5 flex flex-col gap-0.5 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-zinc-800">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-900/60 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs md:text-sm font-extrabold text-neutral-800 dark:text-zinc-200 truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                      {item.brand}
                    </span>
                  </div>
                  {/* Status Indicator Tag */}
                  {item.isScraped === 1 ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border border-orange-200/50 bg-orange-50/50 text-orange-600 dark:border-orange-900/30 dark:bg-orange-950/20 dark:text-orange-400 whitespace-nowrap">
                      PO (1-3 Hari)
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border border-emerald-200/50 bg-emerald-50/50 text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400 whitespace-nowrap">
                      Stok Ready
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-center text-xs md:text-sm text-neutral-400 dark:text-zinc-500 font-bold">
                Tidak ada HP yang cocok 🔍
              </div>
            )}
          </div>
        )}
      </div>

      {/* Premium Sort Dropdown Selector */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2.5 md:pt-0 border-neutral-100 dark:border-zinc-800/80 relative" ref={sortContainerRef}>
        <label className="text-[10px] md:text-xs font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider select-none">
          Urutkan
        </label>
        
        <div className="relative w-44">
          <button
            type="button"
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-xs md:text-sm font-extrabold text-neutral-700 dark:text-zinc-200 rounded-xl px-3 py-2 pr-8 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all flex items-center justify-between"
          >
            <span className="truncate">{currentSortLabel}</span>
            <svg
              className={`w-3.5 h-3.5 text-neutral-400 dark:text-zinc-500 transition-transform duration-200 flex-shrink-0 ${
                isSortOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Floating Sort Menu */}
          {isSortOpen && (
            <div className="absolute top-[calc(100%+6px)] right-0 w-full bg-white dark:bg-zinc-950 border border-neutral-200/60 dark:border-zinc-850 rounded-2xl shadow-xl z-30 p-1 animate-in fade-in slide-in-from-top-2 duration-150">
              {sortOptions.map((opt) => {
                const isActive = activeSort === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSortChange(opt.value)}
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
      </div>

    </div>
  );
}
