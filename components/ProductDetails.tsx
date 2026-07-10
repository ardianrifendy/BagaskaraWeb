"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, Variant } from "../types/product";
import Badge from "./Badge";
import PriceTag from "./PriceTag";
import WhatsAppButton from "./WhatsAppButton";
import imageBgs from "../config/image_bgs.json";
import { getLocalImageSrc } from "../lib/imageResolver";

interface ProductDetailsProps {
  product: Product;
  isModal?: boolean;
  onClose?: () => void;
}

function SpecIcon({ name }: { name: string }) {
  const iconName = name.toLowerCase();
  if (iconName.includes("cpu") || iconName.includes("chipset") || iconName.includes("prosesor")) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" />
      </svg>
    );
  }
  if (iconName.includes("memori") || iconName.includes("ram") || iconName.includes("storage") || iconName.includes("memory")) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    );
  }
  if (iconName.includes("kamera") || iconName.includes("camera") || iconName.includes("lens")) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  if (iconName.includes("baterai") || iconName.includes("battery") || iconName.includes("daya") || iconName.includes("charge")) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  if (iconName.includes("layar") || iconName.includes("screen") || iconName.includes("display")) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function ProductDetails({ product, isModal = false, onClose }: ProductDetailsProps) {
  const bgType = (imageBgs as Record<string, string>)[product.id] || "white";
  
  // Find the first ready variant, otherwise fallback to the first variant
  const defaultVariant = product.variants.find(v => v.stock === "ready") || product.variants[0];
  const [activeVariant, setActiveVariant] = useState<Variant>(defaultVariant);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedPaths, setFailedPaths] = useState<Record<string, boolean>>({});

  // Specs accordion state: open all groups by default
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (product.specs) {
      product.specs.forEach(group => {
        initial[group.group] = true;
      });
    }
    return initial;
  });

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const getSpecValue = (labelQuery: string): string | null => {
    if (!product.specs) return null;
    for (const group of product.specs) {
      for (const item of group.items) {
        if (item.label.toLowerCase().includes(labelQuery.toLowerCase())) {
          return item.value;
        }
      }
    }
    return null;
  };

  // Find cleanedMemory from specSummary
  const specsSummaryItems = product.specSummary ? product.specSummary.split(/·|\s+·\s+/).map(s => s.trim()).filter(Boolean) : [];
  let cleanedMemory = "";
  specsSummaryItems.forEach(spec => {
    const s = spec.trim();
    const sLower = s.toLowerCase();
    if (/\d+\s*(?:gb)?\s*\/\s*\d+\s*(?:gb)?/i.test(sLower) || (sLower.includes("gb") && !sLower.includes("kamera") && !sLower.includes("baterai") && !sLower.includes("battery") && !sLower.includes("processor") && !sLower.includes("prosesor"))) {
      cleanedMemory = s;
    }
  });
  if (!cleanedMemory && specsSummaryItems.length > 0) {
    cleanedMemory = specsSummaryItems[0];
  }

  // Get unique colors and storage options from product variants
  const rawColors = product.variants.map((v) => v.color);
  const hasRealColor = rawColors.some(c => c && c !== "-");
  const uniqueColors = Array.from(
    new Map(product.variants.map((v) => [v.colorHex.toLowerCase(), v])).values()
  );

  const rawStorages = product.variants.map((v) => v.storage);
  const hasRealStorage = rawStorages.some(s => s && s !== "-");
  const uniqueStorages = hasRealStorage
    ? Array.from(new Set(rawStorages.filter((s) => s && s !== "-")))
    : (cleanedMemory ? [cleanedMemory] : []);

  const handleColorSelect = (colorHex: string) => {
    // Find variant with the selected color and current storage size
    let target = product.variants.find(
      (v) => v.colorHex.toLowerCase() === colorHex.toLowerCase() && v.storage === activeVariant.storage
    );

    // If that storage size isn't available in this color, find any variant with this color
    if (!target) {
      target = product.variants.find((v) => v.colorHex.toLowerCase() === colorHex.toLowerCase());
    }

    if (target) {
      setActiveVariant(target);
      setActiveImageIndex(0);
    }
  };

  const handleStorageSelect = (storage: string) => {
    const targetStorage = hasRealStorage ? storage : "-";
    // Find variant with current color and selected storage size
    let target = product.variants.find(
      (v) => v.colorHex.toLowerCase() === activeVariant.colorHex.toLowerCase() && v.storage === targetStorage
    );

    // If that combination isn't available, find any variant with this storage size
    if (!target) {
      target = product.variants.find((v) => v.storage === targetStorage);
    }

    if (target) {
      setActiveVariant(target);
      setActiveImageIndex(0);
    }
  };

  const remoteUrl = activeVariant?.images?.[activeImageIndex];
  const localImageSrc = (remoteUrl && activeVariant)
    ? getLocalImageSrc(
        product.brand,
        product.name,
        activeVariant.color,
        activeVariant.skuInduk,
        activeImageIndex,
        remoteUrl
      )
    : undefined;

  let activeImage = "/file.svg";
  if (remoteUrl) {
    if (localImageSrc && !failedPaths[localImageSrc]) {
      activeImage = localImageSrc;
    } else if (!failedPaths[remoteUrl]) {
      activeImage = remoteUrl;
    }
  }

  const handleImageError = () => {
    if (localImageSrc && activeImage === localImageSrc) {
      setFailedPaths(prev => ({ ...prev, [localImageSrc]: true }));
    } else if (remoteUrl && activeImage === remoteUrl) {
      setFailedPaths(prev => ({ ...prev, [remoteUrl]: true }));
    }
  };

  return (
    <div className={`max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6 ${isModal ? "dark:bg-black" : ""}`}>
      
      {/* Breadcrumb / Back button */}
      <div>
        {isModal && onClose ? (
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-neutral-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Katalog
          </button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-neutral-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Katalog
          </Link>
        )}
      </div>

      {/* Main product card layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-black p-4 md:p-8 rounded-3xl border border-neutral-100 dark:border-zinc-800 shadow-sm">
        
        {/* Left Column: Image Gallery */}
        <div className="flex flex-col gap-4">
          <div className={`relative aspect-square w-full border border-neutral-100 dark:border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center p-6 ${
            bgType === "black" ? "bg-black" : "bg-white"
          }`}>
            
            {activeImage !== "/file.svg" ? (
              <Image
                src={activeImage}
                alt={`${product.name} - ${activeVariant.color}`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-4"
                onError={handleImageError}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-300 dark:text-zinc-700 gap-1.5">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-neutral-400 dark:text-zinc-500 font-bold">Foto tidak tersedia</span>
              </div>
            )}
          </div>

          {/* Gallery Thumbnails */}
          {activeVariant?.images && activeVariant.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activeVariant.images.map((img, idx) => {
                const isActive = activeImageIndex === idx;
                const localThumbSrc = getLocalImageSrc(
                  product.brand,
                  product.name,
                  activeVariant.color,
                  activeVariant.skuInduk,
                  idx,
                  img
                );

                let thumbSrc = img;
                if (localThumbSrc && !failedPaths[localThumbSrc]) {
                  thumbSrc = localThumbSrc;
                } else if (failedPaths[img]) {
                  thumbSrc = "/file.svg";
                }

                const handleThumbError = () => {
                  if (localThumbSrc && thumbSrc === localThumbSrc) {
                    setFailedPaths(prev => ({ ...prev, [localThumbSrc]: true }));
                  } else if (img && thumbSrc === img) {
                    setFailedPaths(prev => ({ ...prev, [img]: true }));
                  }
                };

                return (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl border overflow-hidden flex-shrink-0 cursor-pointer ${
                      bgType === "black" ? "bg-black" : "bg-white"
                    } ${
                      isActive ? "border-orange-500 ring-2 ring-orange-500/20" : "border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <Image
                      src={thumbSrc}
                      alt={`${product.name} thumb ${idx}`}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                      onError={handleThumbError}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Specifications for Desktop View (Placed below images to utilize empty space) */}
          {product.specs && product.specs.length > 0 && (
            <div className="hidden md:flex flex-col gap-4 mt-6">
              <div className="bg-neutral-50/50 dark:bg-zinc-800/20 rounded-3xl border border-neutral-100 dark:border-zinc-800 p-6 flex flex-col gap-4">
                <span className="text-xs text-neutral-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider border-b border-neutral-100 dark:border-zinc-800 pb-2.5">
                  Spesifikasi Lengkap
                </span>
                <div className="flex flex-col gap-4">
                  {product.specs.map((group) => {
                    const isOpen = !!openGroups[group.group];
                    return (
                      <div key={group.group} className="border border-neutral-200/50 dark:border-zinc-800/60 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                        {/* Accordion Trigger Header */}
                        <button
                          onClick={() => toggleGroup(group.group)}
                          className="w-full bg-neutral-50/50 dark:bg-zinc-900/10 hover:bg-neutral-50 dark:hover:bg-zinc-900/30 px-4 py-3 flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-zinc-350 border-b border-neutral-100/50 dark:border-zinc-800/50 cursor-pointer"
                        >
                          <span>{group.group}</span>
                          <svg
                            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Accordion Content Panel */}
                        <div
                          className={`transition-all duration-300 overflow-hidden ${
                            isOpen ? "max-h-[1000px] border-t border-neutral-100/50 dark:border-zinc-800/50" : "max-h-0"
                          }`}
                        >
                          <table className="w-full text-xs text-left">
                            <tbody>
                              {group.items.map((item, idx) => (
                                <tr
                                  key={idx}
                                  className={`${idx % 2 === 0 ? "bg-white dark:bg-zinc-900/10" : "bg-neutral-50/20 dark:bg-zinc-950/10"} border-b border-neutral-100/50 dark:border-zinc-800/40 last:border-b-0`}
                                >
                                  <td className="px-4 py-3 w-1/3 font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wide text-[9px] md:text-[10px]">
                                    {item.label}
                                  </td>
                                  <td className="px-4 py-3 text-neutral-750 dark:text-zinc-350 font-semibold leading-relaxed">
                                    {item.value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Details & CTA */}
        <div className="flex flex-col gap-5">
          {/* Brand & Name */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Badge type={product.condition} />
              {product.isScraped !== 1 && (
                <Badge type={activeVariant.stock} />
              )}
            </div>
            <span className="text-xs uppercase font-extrabold text-neutral-400 dark:text-zinc-500 tracking-wider">
              {product.brand}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-zinc-100 leading-tight mt-0.5">
              {product.name}
            </h1>
          </div>

          {/* Specification Highlights Grid - 2. Brief specifications with key points */}
          {product.highlights && product.highlights.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5">
              {product.highlights.map((hl, idx) => (
                <div key={idx} className="bg-neutral-50/50 dark:bg-zinc-800/40 border border-neutral-100 dark:border-zinc-800 p-2.5 rounded-2xl flex items-center gap-2.5">
                  <div className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
                    <SpecIcon name={hl.icon} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">{hl.label}</span>
                    <span className="text-xs font-black text-neutral-750 dark:text-zinc-200 leading-tight">{hl.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pricing */}
          <div className="border-t border-b border-neutral-100 dark:border-zinc-800 py-3.5 flex flex-col gap-0.5">
            <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Harga Varian Terpilih:</span>
            <PriceTag
              price={activeVariant.price}
              strikePrice={activeVariant.strikePrice}
              priceClassName="text-2xl font-black text-orange-600 dark:text-orange-400"
              strikeClassName="text-sm"
            />
          </div>

          {/* Color swatches */}
          {uniqueColors.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Pilih Warna:</span>
                <span className="text-xs font-extrabold text-neutral-800 dark:text-zinc-200">
                  {hasRealColor && activeVariant.color !== "-" ? activeVariant.color : "Standar"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((v) => {
                  const isActive = activeVariant.colorHex.toLowerCase() === v.colorHex.toLowerCase();
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleColorSelect(v.colorHex)}
                      style={{ backgroundColor: v.colorHex }}
                      title={hasRealColor && v.color !== "-" ? v.color : "Standar"}
                      className={`w-8 h-8 rounded-full border cursor-pointer transition-all ${
                        isActive
                          ? "ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-black border-white scale-105"
                          : "border-neutral-200 dark:border-zinc-700 hover:scale-105"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Storage selector */}
          {uniqueStorages.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider">Pilih Kapasitas (Storage):</span>
              <div className="flex flex-wrap gap-2">
                {uniqueStorages.map((storage) => {
                  const isActive = activeVariant.storage === storage || (!hasRealStorage && activeVariant.storage === "-");
                  const isAvailableInColor = !hasRealStorage || product.variants.some(
                    (v) => v.colorHex.toLowerCase() === activeVariant.colorHex.toLowerCase() && v.storage === storage
                  );

                  return (
                    <button
                      key={storage}
                      onClick={() => handleStorageSelect(storage)}
                      className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-100 dark:shadow-none"
                          : "bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-zinc-350 hover:border-neutral-300 dark:hover:border-zinc-700"
                      } ${!isAvailableInColor ? "opacity-60 border-dashed" : ""}`}
                    >
                      {storage}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Informasi Unit */}
          <div className="bg-neutral-50 dark:bg-zinc-800/30 rounded-2xl border border-neutral-100 dark:border-zinc-800 p-4 flex flex-col gap-3 mt-2">
            <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Informasi Unit</span>
            
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-semibold text-neutral-600 dark:text-zinc-350">
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400 dark:text-zinc-500">Kondisi Fisik:</span>
                <span className="capitalize text-neutral-800 dark:text-zinc-200">{product.condition}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400 dark:text-zinc-500">Garansi:</span>
                <span className="text-neutral-800 dark:text-zinc-200">{product.warranty || "Tidak ada garansi"}</span>
              </div>
              <div className="flex flex-col col-span-2 border-t border-neutral-100/50 dark:border-zinc-800/40 pt-2">
                <span className="text-[10px] text-neutral-400 dark:text-zinc-500">Kelengkapan Paket Penjualan:</span>
                <span className="text-neutral-800 dark:text-zinc-200">{product.completeness || "Hanya HP (Batangan)"}</span>
              </div>
            </div>
          </div>

          {/* Defects/Minus Box */}
          {product.defects && product.defects.length > 0 && (
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:amber-900/50 p-4 rounded-2xl flex flex-col gap-2">
              <span className="text-[10px] text-amber-800 dark:text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Catatan Kondisi / Defect (Minus):
              </span>
              <ul className="list-disc pl-4 text-xs font-bold text-neutral-700 dark:text-zinc-300 flex flex-col gap-1">
                {product.defects.map((defect, idx) => (
                  <li key={idx}>{defect}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Dynamic WhatsApp Leads CTA */}
          <WhatsAppButton
            productName={product.name}
            color={activeVariant.color}
            storage={activeVariant.storage}
            price={activeVariant.price}
            label={product.isScraped === 1 ? "Pesan PO (1-3 Hari) via WhatsApp" : "Hubungi Owner via WhatsApp"}
            className="w-full text-center py-3.5 text-base mt-2"
            isScraped={product.isScraped === 1}
          />

        </div>

      </div>

      {/* Specifications for Mobile View (Placed at the bottom for responsive scroll ease) */}
      {product.specs && product.specs.length > 0 && (
        <div className="block md:hidden bg-white dark:bg-black p-4 rounded-3xl border border-neutral-100 dark:border-zinc-800 shadow-sm mt-6">
          <span className="text-xs text-neutral-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider border-b border-neutral-100 dark:border-zinc-800 pb-2 flex items-center justify-between">
            Spesifikasi Lengkap
          </span>
          <div className="flex flex-col gap-3 mt-4">
            {product.specs.map((group) => {
              const isOpen = !!openGroups[group.group];
              return (
                <div key={group.group} className="border border-neutral-200/50 dark:border-zinc-800/60 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
                  {/* Accordion Trigger Header */}
                  <button
                    onClick={() => toggleGroup(group.group)}
                    className="w-full bg-neutral-50/50 dark:bg-zinc-900/10 hover:bg-neutral-50 dark:hover:bg-zinc-900/30 px-4 py-3 flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-zinc-350 border-b border-neutral-100/50 dark:border-zinc-800/50 cursor-pointer"
                  >
                    <span>{group.group}</span>
                    <svg
                      className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Accordion Content Panel */}
                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      isOpen ? "max-h-[1000px] border-t border-neutral-100/50 dark:border-zinc-800/50" : "max-h-0"
                    }`}
                  >
                    <table className="w-full text-xs text-left">
                      <tbody>
                        {group.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className={`${idx % 2 === 0 ? "bg-white dark:bg-zinc-900/10" : "bg-neutral-50/20 dark:bg-zinc-950/10"} border-b border-neutral-100/50 dark:border-zinc-800/40 last:border-b-0`}
                          >
                            <td className="px-4 py-2.5 w-1/3 font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wide text-[9px] md:text-[10px]">
                              {item.label}
                            </td>
                            <td className="px-4 py-2.5 text-neutral-750 dark:text-zinc-300 font-semibold leading-relaxed">
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Description */}
      {product.description && (
        <div className="bg-white dark:bg-black p-6 md:p-8 rounded-3xl border border-neutral-100 dark:border-zinc-800 shadow-sm mt-6">
          <span className="text-xs text-neutral-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider border-b border-neutral-100 dark:border-zinc-800 pb-2.5 mb-4 block">
            Deskripsi Produk
          </span>
          <div 
            className="product-description text-sm text-neutral-750 dark:text-zinc-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

    </div>
  );
}
