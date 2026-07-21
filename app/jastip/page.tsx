import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import JastipTrackForm from "@/components/jastip/JastipTrackForm";
import Logo from "@/components/Logo";
import { siteConfig } from "@/config/site";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Jasa Titip (Jastip) — Bagaskara Cell",
  description: "Lacak status barang belanjaan jastip luar negeri Anda secara real-time di Bagaskara Cell.",
  openGraph: {
    title: "Jasa Titip (Jastip) — Bagaskara Cell",
    description: "Lacak status barang belanjaan jastip luar negeri Anda secara real-time di Bagaskara Cell.",
    type: "website",
    locale: "id_ID",
    siteName: "Bagaskara Cell",
  }
};

export default function JastipLandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 text-neutral-800 dark:text-zinc-100 font-sans flex flex-col transition-colors duration-200">

      {/* Sticky Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-grow max-w-lg w-full mx-auto px-4 py-10 md:py-16 flex flex-col justify-center gap-6">

        {/* Title and Intro */}
        <div className="text-center space-y-2">
          {/* Breadcrumb / Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-neutral-400 dark:text-zinc-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider cursor-pointer mb-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Katalog
          </Link>

          <h1 className="text-2xl md:text-3xl font-black text-neutral-800 dark:text-zinc-100 tracking-tight">
            Lacak Order Jastip
          </h1>
          <p className="text-xs md:text-sm font-medium text-neutral-400 dark:text-zinc-450 max-w-sm mx-auto leading-relaxed">
            Pantau status pembelian dan pengiriman barang jasa titip (jastip) Anda secara real-time.
          </p>
        </div>

        {/* Tracking Form */}
        <Suspense fallback={
          <div className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm animate-pulse space-y-4">
            <div className="h-10 bg-neutral-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-10 bg-neutral-200 dark:bg-zinc-800 rounded-xl" />
          </div>
        }>
          <JastipTrackForm />
        </Suspense>

        {/* Additional Actions */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Link
            href="/jastip/kalkulator"
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 hover:border-orange-500 dark:hover:border-orange-500 rounded-2xl text-center transition-all group shadow-sm"
          >
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🧮</span>
            <span className="text-xs font-bold text-neutral-700 dark:text-zinc-300">Kalkulator Jastip</span>
            <span className="text-[10px] text-neutral-400 dark:text-zinc-500 mt-0.5">Estimasi biaya titipan</span>
          </Link>
          <Link
            href="/jastip/ketentuan"
            className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 hover:border-orange-500 dark:hover:border-orange-500 rounded-2xl text-center transition-all group shadow-sm"
          >
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📜</span>
            <span className="text-xs font-bold text-neutral-700 dark:text-zinc-300">Ketentuan & S&K</span>
            <span className="text-[10px] text-neutral-400 dark:text-zinc-500 mt-0.5">Aturan belanja & DP</span>
          </Link>
        </div>

      </main>

      {/* Footer Section */}
      <footer className="w-full bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800 py-10 px-4 transition-colors duration-200">
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

    </div>
  );
}
