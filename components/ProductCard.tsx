"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Product, Variant } from "../types/product";
import Badge from "./Badge";
import PriceTag from "./PriceTag";
import WhatsAppButton from "./WhatsAppButton";
import imageBgs from "../config/image_bgs.json";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const searchParams = useSearchParams();
  
  const bgType = (imageBgs as Record<string, string>)[product.id] || "white";
  const specs = product.specSummary.split(/·|\s+·\s+/).map(s => s.trim()).filter(Boolean);
  
  // Find RAM/ROM, CPU, and Battery dynamically from spec items
  let cleanedMemory = "";
  let cleanedCpu = "";
  let cleanedBattery = "";

  specs.forEach(spec => {
    const s = spec.trim();
    const sLower = s.toLowerCase();
    
    // Check if it's RAM/ROM (e.g. "16GB/512GB", "8/256")
    if (/\d+\s*(?:gb)?\s*\/\s*\d+\s*(?:gb)?/i.test(sLower) || (sLower.includes("gb") && !sLower.includes("kamera") && !sLower.includes("baterai") && !sLower.includes("battery") && !sLower.includes("processor") && !sLower.includes("prosesor"))) {
      cleanedMemory = s;
    }
    // Check if it's CPU/Processor
    else if (
      sLower.includes("snapdragon") || 
      sLower.includes("helio") || 
      sLower.includes("dimensity") || 
      sLower.includes("kirin") || 
      sLower.includes("unisoc") || 
      sLower.includes("apple a") || 
      sLower.includes("exynos") || 
      sLower.includes("octa-core") || 
      sLower.includes("quad-core")
    ) {
      cleanedCpu = s.split(',')[0].split('(')[0].replace(/octa-core/i, '').replace(/quad-core/i, '').replace(/sm\d+/i, '').trim();
    }
    // Check if it's Battery
    else if (sLower.includes("mah") || sLower.includes("baterai") || sLower.includes("battery")) {
      const match = s.match(/(\d+\s*mAh)/i);
      cleanedBattery = match ? match[1] : s;
    }
  });

  // Fallbacks if not found
  if (!cleanedMemory && specs.length > 0) {
    cleanedMemory = specs[0];
  }
  if (!cleanedCpu && specs.length > 1) {
    const second = specs[1];
    if (!second.toLowerCase().includes("mah")) {
      cleanedCpu = second.split(',')[0].split('(')[0].trim();
    }
  }
  if (!cleanedBattery && specs.length > 2) {
    cleanedBattery = specs[2];
  }
  
  // Find the first ready variant, otherwise fallback to the first variant
  const defaultVariant = product.variants.find(v => v.stock === "ready") || product.variants[0];
  const [activeVariant, setActiveVariant] = useState<Variant>(defaultVariant);
  const [imgError, setImgError] = useState(false);

  const handleColorChange = (variant: Variant, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Try to find a variant with the clicked color AND currently selected storage
    const matchingVariant = product.variants.find(
      (v) => v.colorHex.toLowerCase() === variant.colorHex.toLowerCase() && v.storage === activeVariant.storage
    ) || variant;
    setActiveVariant(matchingVariant);
    setImgError(false); // Reset image error for new image
  };

  const handleStorageChange = (storage: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Find variant with this storage. Try to keep current color if available.
    const matchingVariant = product.variants.find(
      (v) => v.storage === storage && v.colorHex.toLowerCase() === activeVariant.colorHex.toLowerCase()
    ) || product.variants.find((v) => v.storage === storage);
    
    if (matchingVariant) {
      setActiveVariant(matchingVariant);
      setImgError(false);
    }
  };

  // Image path (using a default placeholder if not available or failed)
  const imageUrl = imgError || !activeVariant?.images?.[0]
    ? "/file.svg"
    : activeVariant.images[0];

  // Build dynamic URL preserving current search filters, only adding the active product slug
  const params = new URLSearchParams(searchParams.toString());
  params.set("produk", product.id);
  const detailUrl = `/?${params.toString()}`;

  return (
    <div className="group relative flex flex-col bg-white dark:bg-black rounded-2xl border border-neutral-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      
      {/* Detail Popup Trigger Link */}
      <Link href={detailUrl} scroll={false} className="flex flex-col flex-grow cursor-pointer">
        
        {/* Badges Bar (Condition & Stock) */}
        <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border-b border-neutral-100 dark:border-zinc-800">
          <Badge type={product.condition} />
          {product.isScraped !== 1 && (
            <Badge type={activeVariant.stock} />
          )}
        </div>
        
        {/* Image Section */}
        <div className={`relative aspect-square w-full overflow-hidden flex items-center justify-center p-4 ${
          bgType === "black" ? "bg-black" : "bg-white"
        }`}>
          {/* Product Image */}
          {activeVariant?.images?.[0] && !imgError ? (
            <Image
              src={imageUrl}
              alt={`${product.name} - ${activeVariant.color}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
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
        </div>

        {/* Product Info */}
        <div className="p-3 flex flex-col flex-grow border-t border-neutral-50 dark:border-zinc-800/60">
          <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-wider">
            {product.brand}
          </span>
          <h3 className="text-sm md:text-base font-bold text-neutral-805 dark:text-zinc-200 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mt-0.5">
            {product.name}
          </h3>

          {/* Quick Specs summary split into separate bubbles */}
          <div className="flex flex-col gap-1.5 mt-2.5 select-none">
            {/* Row 1: RAM/Storage & Baterai (Pills) */}
            <div className="flex flex-wrap gap-1">
              {cleanedMemory && (
                <span className="text-[10px] font-bold text-neutral-600 dark:text-zinc-350 bg-neutral-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full border border-neutral-200/40 dark:border-zinc-700/50 whitespace-nowrap">
                  {cleanedMemory}
                </span>
              )}
              {cleanedBattery && (
                <span className="text-[10px] font-bold text-neutral-600 dark:text-zinc-350 bg-neutral-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full border border-neutral-200/40 dark:border-zinc-700/50 whitespace-nowrap">
                  {cleanedBattery}
                </span>
              )}
            </div>
            {/* Row 2: CPU (Shortened text with icon in a pill) */}
            {cleanedCpu && (
              <div className="flex flex-wrap">
                <span className="text-[10px] font-bold text-neutral-650 dark:text-zinc-350 bg-neutral-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full border border-neutral-200/40 dark:border-zinc-700/50 truncate max-w-full" title={cleanedCpu}>
                  🚀 {cleanedCpu}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Swatch, Price, & CTA Section (at the bottom, not covered by detail link) */}
      <div className="px-3.5 pb-3.5 pt-0 flex flex-col gap-3 mt-auto border-t border-neutral-50 dark:border-zinc-800/60 bg-white dark:bg-black">
        
        {/* Storage variants */}
        {(() => {
          const rawStorages = product.variants.map((v) => v.storage);
          const hasRealStorage = rawStorages.some(s => s && s !== "-");
          const uniqueStorages = hasRealStorage
            ? Array.from(new Set(rawStorages.filter((s) => s && s !== "-")))
            : (cleanedMemory ? [cleanedMemory] : []);

          if (uniqueStorages.length === 0) return null;
          return (
            <div className="flex flex-col gap-1 mt-2.5">
              <span className="text-[10px] text-neutral-455 dark:text-zinc-500 font-extrabold uppercase tracking-wider select-none">
                Pilih Varian:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {uniqueStorages.map((storage) => {
                  const isActive = activeVariant.storage === storage || (!hasRealStorage && activeVariant.storage === "-");
                  return (
                    <button
                      key={storage}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        isActive
                          ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                          : "bg-neutral-50 dark:bg-zinc-900 border-neutral-200 dark:border-zinc-850 text-neutral-600 dark:text-zinc-350 hover:border-neutral-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {storage}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Color swatches */}
        {(() => {
          const rawColors = product.variants.map((v) => v.color);
          const hasRealColor = rawColors.some(c => c && c !== "-");
          const uniqueColors = Array.from(
            new Map(product.variants.map((v) => [v.colorHex.toLowerCase(), v])).values()
          );
          if (uniqueColors.length === 0) return null;
          return (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-neutral-450 dark:text-zinc-500 font-extrabold uppercase tracking-wider select-none">
                Pilih Warna:
              </span>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((v) => {
                  const isActive = activeVariant.colorHex.toLowerCase() === v.colorHex.toLowerCase();
                  return (
                    <button
                      key={v.id}
                      onClick={(e) => handleColorChange(v, e)}
                      style={{ backgroundColor: v.colorHex }}
                      title={hasRealColor && v.color !== "-" ? v.color : "Standar"}
                      className={`w-5.5 h-5.5 rounded-full border cursor-pointer transition-all ${
                        isActive
                          ? "ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-black border-white scale-105"
                          : "border-neutral-200 dark:border-zinc-750 hover:scale-105"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Price & Label */}
        <div className="flex flex-col gap-0.5 mt-0.5">
          <span className="text-[10px] text-neutral-455 dark:text-zinc-500 font-extrabold uppercase tracking-wider select-none">
            Harga Varian:
          </span>
          <PriceTag
            price={activeVariant.price}
            strikePrice={activeVariant.strikePrice}
            priceClassName="text-base md:text-lg font-black text-orange-600 dark:text-orange-400"
          />
        </div>

        {/* CTA Button */}
        <WhatsAppButton
          productName={product.name}
          color={activeVariant.color}
          storage={activeVariant.storage}
          price={activeVariant.price}
          label={product.isScraped === 1 ? "PO (1-3 Hari)" : "Tanya Stok / COD"}
          className="w-full text-center py-2.5 rounded-xl font-bold shadow-sm"
          variant={activeVariant.stock === "ready" ? "solid" : "outline"}
          isScraped={product.isScraped === 1}
        />
      </div>

    </div>
  );
}
