"use client";

import React, { useState } from "react";
import { formatRupiah } from "@/lib/formatRupiah";

interface OrderItem {
  id: number;
  name: string;
  variant: string | null;
  qty: number;
  estPrice: string;
  actualPrice: string | null;
  weightGrams: number | null;
  status: string;
  substitutionOk: boolean;
  proofUrl: string | null;
  note: string | null;
}

interface JastipItemsListProps {
  items: OrderItem[];
  exchangeRate: number;
  feeType: string;
  feeValue: number;
}

export default function JastipItemsList({
  items,
  exchangeRate,
  feeType,
  feeValue,
}: JastipItemsListProps) {
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Status mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return <span className="bg-neutral-100 text-neutral-600 dark:bg-zinc-800 dark:text-zinc-400 border border-neutral-200 dark:border-zinc-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Diminta</span>;
      case "hunting":
        return <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">Dicari</span>;
      case "found":
        return <span className="bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200/50 dark:border-sky-900/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Ditemukan</span>;
      case "purchased":
        return <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Dibelanjar</span>;
      case "warehouse":
        return <span className="bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/50 dark:border-teal-900/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Di Gudang</span>;
      case "shipped":
        return <span className="bg-emerald-600 text-white border-transparent px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Dikirim</span>;
      case "out_of_stock":
        return <span className="bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider line-through">Kosong</span>;
      case "cancelled":
        return <span className="bg-neutral-100 text-neutral-450 dark:bg-zinc-800 dark:text-zinc-500 border border-neutral-200 dark:border-zinc-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider line-through">Batal</span>;
      default:
        return <span className="bg-neutral-100 text-neutral-600 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">
        Daftar Barang Titipan ({items.length})
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => {
          // Calculate price details
          const estPriceNum = Number(item.estPrice) || 0;
          const actualPriceNum = item.actualPrice !== null ? Number(item.actualPrice) : null;

          const rate = Number(exchangeRate) || 0;
          const val = Number(feeValue) || 0;

          // Estimasi harga IDR
          const baseEstIdr = estPriceNum * rate * item.qty;
          const feeEstIdr = feeType === "percent" ? baseEstIdr * (val / 100) : val * item.qty;
          const totalEstIdr = baseEstIdr + feeEstIdr;

          // Aktual harga IDR
          let totalActualIdr = null;
          if (actualPriceNum !== null) {
            const baseActIdr = actualPriceNum * rate * item.qty;
            const feeActIdr = feeType === "percent" ? baseActIdr * (val / 100) : val * item.qty;
            totalActualIdr = baseActIdr + feeActIdr;
          }

          // Check if there is a price difference
          const hasDiff = totalActualIdr !== null && totalActualIdr !== totalEstIdr;
          const diffVal = totalActualIdr !== null ? totalActualIdr - totalEstIdr : 0;

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-sm text-neutral-800 dark:text-zinc-150">
                    {item.name}
                  </h4>
                  {getStatusBadge(item.status)}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {item.variant && (
                    <div className="text-neutral-500 dark:text-zinc-400">
                      Varian: <strong className="text-neutral-700 dark:text-zinc-300 font-semibold">{item.variant}</strong>
                    </div>
                  )}
                  <div className="text-neutral-500 dark:text-zinc-400">
                    Jumlah: <strong className="text-neutral-700 dark:text-zinc-300 font-semibold">{item.qty} pcs</strong>
                  </div>
                  {item.weightGrams !== null && item.weightGrams > 0 && (
                    <div className="text-neutral-500 dark:text-zinc-400">
                      Berat: <strong className="text-neutral-700 dark:text-zinc-300 font-semibold">{item.weightGrams}g</strong>
                    </div>
                  )}
                  <div className="text-neutral-500 dark:text-zinc-400">
                    Substitusi: <strong className="text-neutral-700 dark:text-zinc-300 font-semibold">{item.substitutionOk ? "OK" : "Tolak"}</strong>
                  </div>
                </div>

                {item.note && (
                  <div className="text-[11px] p-2 rounded bg-neutral-50 dark:bg-zinc-950 text-neutral-500 dark:text-zinc-400 border border-neutral-100 dark:border-zinc-900">
                    💡 Catatan: {item.note}
                  </div>
                )}
              </div>

              {/* Price Breakdown and Image */}
              <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-4 border-t sm:border-t-0 border-neutral-100 dark:border-zinc-800/80 pt-3 sm:pt-0">

                {/* Proof image */}
                {item.proofUrl ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 dark:border-zinc-700 bg-neutral-100 flex-shrink-0 cursor-zoom-in" onClick={() => setActivePhoto(item.proofUrl)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.proofUrl} alt="Bukti pembelian" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                  </div>
                ) : (
                  <div className="hidden sm:block w-12 h-12 rounded-lg border border-dashed border-neutral-200 dark:border-zinc-800 bg-neutral-50/20 dark:bg-zinc-950/20 flex-shrink-0 flex items-center justify-center text-[10px] text-neutral-400 dark:text-zinc-600 font-bold uppercase tracking-wider">
                    No Foto
                  </div>
                )}

                <div className="text-right flex flex-col justify-end">
                  <div className="text-[10px] font-black uppercase text-neutral-400 dark:text-zinc-500 tracking-wider">
                    Total Item
                  </div>
                  <div className="text-sm font-black text-neutral-850 dark:text-zinc-150">
                    {totalActualIdr !== null ? formatRupiah(totalActualIdr) : formatRupiah(totalEstIdr)}
                  </div>
                  {hasDiff && (
                    <div className="text-[9px] font-extrabold flex flex-col">
                      <span className="text-neutral-450 line-through">Est: {formatRupiah(totalEstIdr)}</span>
                      <span className={diffVal > 0 ? "text-red-500" : "text-emerald-600"}>
                        {diffVal > 0 ? `Selisih +${formatRupiah(diffVal)}` : `Hemat ${formatRupiah(Math.abs(diffVal))}`}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Photo Lightbox Overlay */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center">
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-0 right-0 m-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer z-10 font-bold"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto}
              alt="Bukti Foto Barang"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}
