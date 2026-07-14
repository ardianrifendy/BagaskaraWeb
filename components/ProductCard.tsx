"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Product } from "../types/product";
import Badge from "./Badge";
import PriceTag from "./PriceTag";
import imageBgs from "../config/image_bgs.json";
import { getLocalImageSrc } from "../lib/imageResolver";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const searchParams = useSearchParams();
  const cardRef = useRef<HTMLDivElement>(null);

  const bgType = (imageBgs as Record<string, string>)[product.id] || "white";

  // Find the cheapest variant
  const cheapestVariant = product.variants.reduce(
    (min, v) => (v.price < min.price ? v : min),
    product.variants[0]
  );

  // Kumpulkan daftar gambar unik dari setiap varian warna yang memiliki gambar
  const slideImages = React.useMemo(() => {
    const list: { url: string; color: string; localSrc?: string }[] = [];
    const seenColors = new Set<string>();

    product.variants.forEach((v) => {
      const colorLower = v.color.toLowerCase();
      if (v.images && v.images.length > 0 && !seenColors.has(colorLower) && v.color !== "-") {
        seenColors.add(colorLower);
        const remoteUrl = v.images[0];
        const localSrc = getLocalImageSrc(
          product.brand,
          product.name,
          v.color,
          v.skuInduk,
          0,
          remoteUrl
        );
        list.push({
          url: remoteUrl,
          color: v.color,
          localSrc: localSrc !== remoteUrl ? localSrc : undefined
        });
      }
    });

    // Jika list kosong atau variannya cuma 1 warna standar, gunakan defaults
    if (list.length === 0 && cheapestVariant?.images?.[0]) {
      const remoteUrl = cheapestVariant.images[0];
      const localSrc = getLocalImageSrc(
        product.brand,
        product.name,
        cheapestVariant.color,
        cheapestVariant.skuInduk,
        0,
        remoteUrl
      );
      list.push({
        url: remoteUrl,
        color: cheapestVariant.color,
        localSrc: localSrc !== remoteUrl ? localSrc : undefined
      });
    }

    return list;
  }, [product.brand, product.name, product.variants, cheapestVariant]);

  // State untuk slide index aktif
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedPaths, setFailedPaths] = useState<Record<string, boolean>>({});

  // 1. Logic Auto-Slide Cerdas: Peka Terhadap Viewport (IntersectionObserver) & Aktivitas Scroll
  useEffect(() => {
    // Jangan jalankan timer jika gambar hanya ada 1
    if (slideImages.length <= 1) return;

    let intervalId: NodeJS.Timeout | null = null;
    let isVisible = false;
    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout | null = null;

    const startTimer = () => {
      if (intervalId) clearInterval(intervalId);
      if (isVisible && !isScrolling) {
        intervalId = setInterval(() => {
          setActiveImageIndex((prev) => (prev + 1) % slideImages.length);
        }, 3500); // Ganti gambar setiap 3.5 detik
      }
    };

    const stopTimer = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // A. Deteksi Apakah Kartu Terlihat di Layar (Intersection Observer)
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          startTimer();
        } else {
          stopTimer();
        }
      },
      { threshold: 0.1 } // Minimal 10% kartu terlihat di layar
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    // B. Deteksi Scroll untuk Jeda Otomatis demi Performa (Scroll-Aware)
    const handleScroll = () => {
      isScrolling = true;
      stopTimer(); // Hentikan slide seketika saat scroll dimulai

      if (scrollTimeout) clearTimeout(scrollTimeout);

      // Debounce: setelah 200ms tidak ada aktivitas scroll baru, jalankan kembali slide
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        startTimer();
      }, 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      stopTimer();
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [slideImages]);

  // Tentukan path gambar yang valid (termasuk handle fallback error path)
  const currentSlide = slideImages[activeImageIndex] || slideImages[0];

  let imageUrl = "/file.svg";
  if (currentSlide) {
    const remoteUrl = currentSlide.url;
    const localImageSrc = currentSlide.localSrc;
    if (remoteUrl) {
      if (localImageSrc && !failedPaths[localImageSrc]) {
        imageUrl = localImageSrc;
      } else if (!failedPaths[remoteUrl]) {
        imageUrl = remoteUrl;
      }
    }
  }

  const handleImageError = () => {
    if (currentSlide) {
      const remoteUrl = currentSlide.url;
      const localImageSrc = currentSlide.localSrc;
      if (localImageSrc && imageUrl === localImageSrc) {
        setFailedPaths(prev => ({ ...prev, [localImageSrc]: true }));
      } else if (remoteUrl && imageUrl === remoteUrl) {
        setFailedPaths(prev => ({ ...prev, [remoteUrl]: true }));
      }
    }
  };

  // Build dynamic URL preserving current search filters, only adding the active product slug
  const params = new URLSearchParams(searchParams.toString());
  params.set("produk", product.id);
  const detailUrl = `/?${params.toString()}`;

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col bg-white dark:bg-black rounded-2xl border border-neutral-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >

      {/* Detail Popup Trigger Link */}
      <Link href={detailUrl} scroll={false} className="flex flex-col h-full cursor-pointer">

        {/* Badges Bar (Condition & Stock) */}
        <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border-b border-neutral-100 dark:border-zinc-800">
          <Badge type={product.condition} />
          {product.isScraped !== 1 && (
            <Badge type={cheapestVariant.stock} />
          )}
        </div>

        {/* Image Section */}
        <div className={`relative aspect-square w-full overflow-hidden flex items-center justify-center p-4 ${
          bgType === "black" ? "bg-black" : "bg-white dark:bg-black"
        }`}>
          {/* Product Image */}
          {imageUrl !== "/file.svg" ? (
            <Image
              src={imageUrl}
              alt={`${product.name} - ${currentSlide?.color || cheapestVariant.color}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className={`object-contain ${
                product.brand.toLowerCase() === "poco"
                  ? "p-0.5 scale-[1.15] group-hover:scale-[1.22]"
                  : "p-3.5 group-hover:scale-105"
              } transition-transform duration-300`}
              onError={handleImageError}
              priority={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-300 dark:text-zinc-700 gap-1">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-bold">Tidak ada foto</span>
            </div>
          )}

          {/* Indikator Jumlah Gambar Varian (Tampil jika gambar > 1) */}
          {slideImages.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 bg-black/60 dark:bg-zinc-900/80 text-[8px] font-mono font-black text-white px-2 py-0.5 rounded-full select-none tracking-widest">
              {activeImageIndex + 1}/{slideImages.length}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex flex-col flex-grow border-t border-neutral-50 dark:border-zinc-800/60 bg-white dark:bg-black">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-wider">
              {product.brand}
            </span>
            {/* Tampilkan info warna aktif jika gambar berubah */}
            {slideImages.length > 1 && (
              <span className="text-[9px] font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/45 px-1.5 py-0.5 rounded transition-all">
                🎨 {currentSlide.color}
              </span>
            )}
          </div>
          <h3 className="text-sm md:text-base font-bold text-neutral-800 dark:text-zinc-200 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mt-0.5 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price & Label */}
          <div className="flex flex-col gap-0.5 mt-3">
            <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider select-none">
              Mulai Dari:
            </span>
            <PriceTag
              price={cheapestVariant.price}
              strikePrice={cheapestVariant.strikePrice}
              priceClassName="text-base md:text-lg font-black text-orange-600 dark:text-orange-400"
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
