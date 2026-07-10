"use client";

import React, { useState } from "react";
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
  
  const bgType = (imageBgs as Record<string, string>)[product.id] || "white";
  
  // Find the cheapest variant
  const cheapestVariant = product.variants.reduce(
    (min, v) => (v.price < min.price ? v : min),
    product.variants[0]
  );
  
  const [failedPaths, setFailedPaths] = useState<Record<string, boolean>>({});

  const remoteUrl = cheapestVariant?.images?.[0];
  const localImageSrc = (remoteUrl && cheapestVariant)
    ? getLocalImageSrc(
        product.brand,
        product.name,
        cheapestVariant.color,
        cheapestVariant.skuInduk,
        0,
        remoteUrl
      )
    : undefined;

  let imageUrl = "/file.svg";
  if (remoteUrl) {
    if (localImageSrc && !failedPaths[localImageSrc]) {
      imageUrl = localImageSrc;
    } else if (!failedPaths[remoteUrl]) {
      imageUrl = remoteUrl;
    }
  }

  const handleImageError = () => {
    if (localImageSrc && imageUrl === localImageSrc) {
      setFailedPaths(prev => ({ ...prev, [localImageSrc]: true }));
    } else if (remoteUrl && imageUrl === remoteUrl) {
      setFailedPaths(prev => ({ ...prev, [remoteUrl]: true }));
    }
  };

  // Build dynamic URL preserving current search filters, only adding the active product slug
  const params = new URLSearchParams(searchParams.toString());
  params.set("produk", product.id);
  const detailUrl = `/?${params.toString()}`;

  return (
    <div className="group relative flex flex-col bg-white dark:bg-black rounded-2xl border border-neutral-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      
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
          bgType === "black" ? "bg-black" : "bg-white"
        }`}>
          {/* Product Image */}
          {imageUrl !== "/file.svg" ? (
            <Image
              src={imageUrl}
              alt={`${product.name} - ${cheapestVariant.color}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
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
        </div>

        {/* Product Info */}
        <div className="p-4 flex flex-col flex-grow border-t border-neutral-50 dark:border-zinc-800/60 bg-white dark:bg-black">
          <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-wider">
            {product.brand}
          </span>
          <h3 className="text-sm md:text-base font-bold text-neutral-805 dark:text-zinc-205 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mt-0.5 min-h-[2.5rem]">
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
