import React, { Suspense } from "react";
import { getFilteredProducts, getFallbackProducts, getProductBySlug, getSearchSuggestions } from "../lib/filterProducts";
import { getFilterOptions } from "../lib/getFilterOptions";
import ProductCard from "../components/ProductCard";
import BudgetPicker from "../components/BudgetPicker";
import FilterChips from "../components/FilterChips";
import SearchSort from "../components/SearchSort";
import WhatsAppButton from "../components/WhatsAppButton";
import ProductDetailsModal from "../components/ProductDetailsModal";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";
import { siteConfig } from "../config/site";
import { buildWaLink } from "../lib/buildWaLink";
import BookSwitcher from "../components/BookSwitcher";
import WelcomeModal from "../components/WelcomeModal";

// Next.js metadata for SEO
export const metadata = {
  title: "Katalog Bagaskara Cell — HP Murah & Berkualitas Gresik",
  description: "Cari HP baru dan second bergaransi sesuai budget Anda di Bagaskara Cell Gresik. Hubungi owner langsung via WhatsApp untuk COD.",
  openGraph: {
    title: "Katalog Bagaskara Cell — HP Murah & Berkualitas Gresik",
    description: "Cari HP baru dan second bergaransi sesuai budget Anda di Bagaskara Cell Gresik. Hubungi owner langsung via WhatsApp untuk COD.",
    type: "website",
    locale: "id_ID",
    siteName: "Bagaskara Cell",
  }
};

interface PageProps {
  searchParams: Promise<{
    budget?: string;
    brand?: string;
    condition?: string;
    status?: string;
    book?: string;
    q?: string;
    sort?: string;
    produk?: string;
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  // Await search parameters (mandatory in Next.js 15/16)
  const resolvedSearchParams = await searchParams;
  const budget = resolvedSearchParams.budget || "";
  const brand = resolvedSearchParams.brand || "";
  const condition = resolvedSearchParams.condition || "";
  const status = resolvedSearchParams.status || "";
  const book = resolvedSearchParams.book || "ready";
  const q = resolvedSearchParams.q || "";
  const sort = resolvedSearchParams.sort || "newest";
  const produkSlug = resolvedSearchParams.produk || "";

  // Fetch filtered products and dynamic options from SQLite
  const products = await getFilteredProducts({ budget, brand, condition, status, book, q, sort });
  const { brands: availableBrands, conditions: availableConditions } = await getFilterOptions();
  const suggestions = await getSearchSuggestions();

  // If no products match, fetch the nearest products in price
  const isCatalogEmpty = products.length === 0;
  const fallbackProducts = isCatalogEmpty ? await getFallbackProducts(budget, book) : [];

  // Fetch active product for modal if selected via query param
  const activeProduct = produkSlug ? await getProductBySlug(produkSlug) : null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-800 dark:text-zinc-100 font-sans flex flex-col pb-16 md:pb-0 transition-colors duration-200">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-zinc-800 px-4 py-3 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Page Layout Container */}
      <div className="max-w-6xl w-full mx-auto px-4 py-6 flex flex-col md:grid md:grid-cols-[1fr_280px] gap-6 flex-grow items-start">
        
        {/* Left column: Search, Sorting, and Product Grid */}
        <main className="w-full order-2 md:order-1 flex flex-col gap-4">
          <Suspense fallback={<div className="h-12 w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800/80 rounded-xl animate-pulse" />}>
            <SearchSort suggestions={suggestions} />
          </Suspense>

          {/* Mobile Collapsible Filters Accordion (md:hidden) */}
          <details className="w-full md:hidden bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-805 rounded-2xl overflow-hidden shadow-sm">
            <summary className="px-4 py-3 font-bold text-xs md:text-sm text-neutral-800 dark:text-zinc-200 flex items-center justify-between cursor-pointer select-none">
              <span className="flex items-center gap-1.5">
                <span>⚙️</span> Filter & Kategori
              </span>
              <span className="text-[10px] font-extrabold text-orange-655 dark:text-orange-400 uppercase">Ketuk untuk Mengatur</span>
            </summary>
            <div className="p-4 border-t border-neutral-100 dark:border-zinc-800 space-y-4 bg-neutral-50/50 dark:bg-zinc-950/20">
              {/* Book Switcher */}
              <div className="space-y-1">
                <span className="text-[9px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Katalog HP</span>
                <Suspense fallback={null}>
                  <BookSwitcher />
                </Suspense>
              </div>

              {/* Budget Picker */}
              <Suspense fallback={null}>
                <BudgetPicker />
              </Suspense>

              {/* Dropdowns (Merek, Kondisi, Status) */}
              <Suspense fallback={null}>
                <FilterChips
                  availableBrands={availableBrands}
                  availableConditions={availableConditions}
                />
              </Suspense>
            </div>
          </details>

          {/* Active Filters Display */}
          {((budget || brand || condition || status || q) && !isCatalogEmpty) && (
            <div className="text-xs font-semibold text-neutral-500 dark:text-zinc-400">
              Menampilkan hasil untuk:{" "}
              {q && <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-850 dark:text-orange-300 border border-orange-100 dark:border-orange-900/50 px-2 py-0.5 rounded-md mr-1">Cari: &quot;{q}&quot;</span>}
              {budget && <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-850 dark:text-orange-300 border border-orange-100 dark:border-orange-900/50 px-2 py-0.5 rounded-md mr-1">Budget: {budget}</span>}
              {brand && <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-850 dark:text-orange-300 border border-orange-100 dark:border-orange-900/50 px-2 py-0.5 rounded-md mr-1">Merk: {brand}</span>}
              {condition && <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-850 dark:text-orange-300 border border-orange-100 dark:border-orange-900/50 px-2 py-0.5 rounded-md mr-1">Kondisi: {condition}</span>}
              {status && <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-850 dark:text-orange-300 border border-orange-100 dark:border-orange-900/50 px-2 py-0.5 rounded-md">Status: {status === "ready" ? "Ready" : "Habis / PO"}</span>}
            </div>
          )}

          {isCatalogEmpty ? (
            /* Empty State + Fallback Recommendations */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-zinc-900 flex items-center justify-center text-neutral-400 dark:text-zinc-500 mb-4 border border-neutral-200/50 dark:border-zinc-800">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-bold text-neutral-800 dark:text-zinc-200">
                HP dengan kriteria tersebut kosong
              </h3>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-zinc-400 max-w-sm mt-1 mb-6">
                Stok kosong untuk filter aktif Anda. Namun, kami merekomendasikan produk di kisaran harga terdekat berikut:
              </p>

              {/* Recommendations Grid */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                {fallbackProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* General WhatsApp CTA for missing stock */}
              <div className="mt-10 p-5 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100/50 dark:border-orange-900/30 max-w-md w-full flex flex-col items-center">
                <span className="text-xs font-bold text-orange-850 dark:text-orange-400 uppercase tracking-wide">Butuh HP Lainnya?</span>
                <p className="text-[11px] md:text-xs text-neutral-600 dark:text-zinc-400 text-center mt-1 mb-4">
                  Ada stok masuk harian yang mungkin belum sempat ter-upload di website ini. Tanya owner langsung via chat.
                </p>
                <WhatsAppButton
                  label="Tanya Stok HP Lain"
                  className="w-full text-center"
                />
              </div>
            </div>
          ) : (
            /* Normal Catalog Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-in fade-in duration-200">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>

        {/* Right column: Sticky Filter Panel (hidden on mobile, sticky on desktop) */}
        <aside className="hidden md:flex w-[280px] shrink-0 order-1 md:order-2 flex-col gap-5 bg-white dark:bg-zinc-900/50 border border-neutral-200/50 dark:border-zinc-800 p-5 rounded-3xl sticky top-20 shadow-sm transition-colors duration-200">
          <div className="border-b border-neutral-100 dark:border-zinc-800 pb-3 flex items-center justify-between select-none">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-805 dark:text-zinc-205">
              Filter Produk
            </span>
            <span className="text-xs text-neutral-400 dark:text-zinc-500">⚙️</span>
          </div>

          {/* Book Switcher */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-neutral-400 dark:text-zinc-500 uppercase tracking-wider select-none">Katalog HP</span>
            <Suspense fallback={<div className="h-10 bg-neutral-100 dark:bg-zinc-850 animate-pulse rounded-xl" />}>
              <BookSwitcher />
            </Suspense>
          </div>

          {/* Budget Picker */}
          <div className="pt-2 border-t border-neutral-105 dark:border-zinc-800/80">
            <Suspense fallback={<div className="h-24 bg-neutral-100 dark:bg-zinc-850 animate-pulse rounded-xl" />}>
              <BudgetPicker />
            </Suspense>
          </div>

          {/* Dropdown Filters (Brand, Condition, Status) */}
          <div className="pt-2 border-t border-neutral-105 dark:border-zinc-800/80">
            <Suspense fallback={<div className="h-44 bg-neutral-100 dark:bg-zinc-850 animate-pulse rounded-xl" />}>
              <FilterChips
                availableBrands={availableBrands}
                availableConditions={availableConditions}
              />
            </Suspense>
          </div>
        </aside>

      </div>

      {/* Floating WhatsApp Button for Mobile Screen Viewport (Quick access) */}
      <a
        href={buildWaLink()}
        target="_blank"
        rel="noopener noreferrer"
        title="Hubungi Kami"
        className="fixed bottom-6 right-6 z-50 md:hidden w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-all duration-200 active:scale-90 hover:scale-105"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.37 5.054L2 22l5.138-1.348a9.936 9.936 0 0 0 4.87 1.272h.004c5.505 0 9.99-4.478 9.99-9.984C22.007 6.478 17.521 2 12.012 2zm6.09 14.12c-.25.706-1.464 1.379-2.023 1.466-.497.078-1.144.139-3.327-.767-2.793-1.161-4.577-3.99-4.717-4.178-.14-.188-1.127-1.498-1.127-2.859 0-1.361.713-2.029.967-2.302.253-.274.554-.343.74-.343.185 0 .37.002.532.01.169.008.397-.064.62.474.228.552.78 1.902.848 2.04.068.138.113.3.02.485-.091.188-.137.3-.272.457-.137.156-.289.349-.413.468-.137.13-.28.27-.12.544.16.273.71 1.171 1.523 1.892.657.581 1.212.76 1.523.888.31.13.493.109.676-.1.183-.21.782-.906.993-1.214.21-.309.423-.258.713-.15.29.109 1.843.869 2.161 1.028.318.158.53.238.607.366.077.129.077.747-.174 1.454z" />
        </svg>
      {/* Footer Section */}
      <footer className="w-full bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800 py-10 px-4 mt-16 transition-colors duration-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Identity */}
          <div className="flex flex-col gap-2">
            <Logo />
            <p className="text-xs text-neutral-500 dark:text-zinc-400 max-w-xs mt-1">
              Katalog HP terpercaya di Gresik. Transaksi aman, transparan, dan jaminan barang berkualitas.
            </p>
          </div>

          {/* Location & Address */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Lokasi Toko</span>
            <p className="text-xs text-neutral-600 dark:text-zinc-300 leading-relaxed max-w-xs">
              {siteConfig.address}
            </p>
            <a
              href={siteConfig.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline mt-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Buka di Google Maps
            </a>
          </div>

          {/* Contact & Marketplaces */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Hubungi / Toko Online</span>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-neutral-500 dark:text-zinc-400">WhatsApp Admin:</span>
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer"
                >
                  CS 1: +62 895-1367-9939
                </a>
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber2}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer"
                >
                  CS 2: +62 81-959-77777-0
                </a>
              </div>
              <div className="flex gap-3 items-center mt-1">
                <a
                  href={siteConfig.marketplaceLinks.shopee}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-orange-600 dark:text-orange-500 hover:underline"
                >
                  Shopee
                </a>
                <a
                  href={siteConfig.marketplaceLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>

        </div>

        <div className="max-w-6xl mx-auto border-t border-neutral-100 dark:border-zinc-800 mt-8 pt-6 text-center text-[10px] text-neutral-400 dark:text-zinc-500 font-medium">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </div>
      </footer>

      {/* Render Product Details Overlay Modal if selected */}
      {activeProduct && (
        <ProductDetailsModal product={activeProduct} />
      )}

      {/* Render Welcome Modal on first visit */}
      <Suspense fallback={null}>
        <WelcomeModal />
      </Suspense>

    </div>
  );
}
