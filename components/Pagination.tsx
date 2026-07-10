import React from "react";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: {
    budget?: string;
    brand?: string;
    condition?: string;
    status?: string;
    book?: string;
    q?: string;
    sort?: string;
  };
}

export default function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Helper to build page URL preserving other search parameters
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    
    // Copy other params
    if (searchParams.budget) params.set("budget", searchParams.budget);
    if (searchParams.brand) params.set("brand", searchParams.brand);
    if (searchParams.condition) params.set("condition", searchParams.condition);
    if (searchParams.status) params.set("status", searchParams.status);
    if (searchParams.book) params.set("book", searchParams.book);
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.sort) params.set("sort", searchParams.sort);
    
    // Set page (omit if first page to keep URL clean)
    if (pageNum > 1) {
      params.set("page", pageNum.toString());
    }
    
    return `/?${params.toString()}`;
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1 md:gap-2 mt-10 mb-6 select-none font-sans">
      {/* Previous Page Arrow */}
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-500 dark:text-zinc-400 border border-neutral-200 dark:border-zinc-800 hover:border-neutral-350 dark:hover:border-zinc-700 hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-all duration-200"
          title="Halaman Sebelumnya"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      ) : (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-300 dark:text-zinc-700 border border-neutral-100 dark:border-zinc-900 cursor-not-allowed">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      )}

      {/* Page Numbers */}
      {pages.map((p, idx) => {
        if (p === "...") {
          return (
            <span
              key={`ell-${idx}`}
              className="w-10 h-10 flex items-center justify-center text-neutral-400 dark:text-zinc-650 text-sm font-medium"
            >
              ...
            </span>
          );
        }

        const isCurrent = p === currentPage;

        return (
          <Link
            key={p}
            href={buildPageUrl(p as number)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 relative ${
              isCurrent
                ? "text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30 scale-105"
                : "text-neutral-600 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-900 border border-transparent hover:border-neutral-200 dark:hover:border-zinc-800"
            }`}
          >
            {p}
            {/* Active Indicator Underline */}
            {isCurrent && (
              <span className="absolute bottom-1.5 left-3.5 right-3.5 h-0.5 bg-orange-600 dark:bg-orange-400 rounded-full" />
            )}
          </Link>
        );
      })}

      {/* Next Page Arrow */}
      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-500 dark:text-zinc-400 border border-neutral-200 dark:border-zinc-800 hover:border-neutral-350 dark:hover:border-zinc-700 hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-all duration-200"
          title="Halaman Selanjutnya"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-300 dark:text-zinc-700 border border-neutral-100 dark:border-zinc-900 cursor-not-allowed">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
