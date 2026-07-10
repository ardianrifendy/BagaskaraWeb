"use client";

import { useState } from "react";
import { getCourierLabel } from "@/lib/couriers";
import type { TrackingResult } from "@/types/tracking";

interface CekResiResultProps {
  result: TrackingResult;
}

export default function CekResiResult({ result }: CekResiResultProps) {
  const [showHistory, setShowHistory] = useState(false);
  const { summary, detail, history } = result;

  const isDelivered = summary.status.toLowerCase().includes("delivered") || 
                      summary.status.toLowerCase().includes("diterima") ||
                      summary.status.toLowerCase().includes("sukses");

  // Map receiver name and address from the API response
  const receiverName = detail.receiver || summary.receiver || detail.shipper || "-";
  const receiverAddr = detail.destination || detail.origin || "-";

  // Format package weight (convert grams to Kg if weight >= 100)
  let weightStr = "-";
  if (summary.weight) {
    const w = parseFloat(summary.weight.toString());
    if (!isNaN(w)) {
      if (w >= 100) {
        weightStr = `${w / 1000} Kg (${w} gram)`;
      } else {
        weightStr = `${w} Kg`;
      }
    }
  }

  const handleShareWa = () => {
    const courierLabel = getCourierLabel(summary.courier);
    const awb = summary.awb;
    const status = summary.status;
    const lastDesc = summary.lastDesc || "-";
    const text = `📦 *STATUS PENGIRIMAN (${courierLabel})*
----------------------------------------
*No. Resi:* ${awb}
*Status:* ${status}

*Penerima:* ${receiverName}
*Tujuan:* ${receiverAddr}
*Berat:* ${weightStr}
*Layanan:* ${summary.service || "Regular"}

*Posisi Terakhir:*
"${lastDesc}"

🌐 *Lihat detail perjalanan lengkap:*
https://bagaskaracell.net/cek-resi?courier=${summary.courier}&awb=${awb}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-5">
      {/* Waybill Info Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50 dark:bg-zinc-950/20 px-4 py-3 rounded-2xl border border-neutral-100 dark:border-zinc-800">
        <div className="flex flex-col">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-zinc-500">
            {getCourierLabel(summary.courier)}
          </span>
          <h3 className="text-sm md:text-base font-extrabold text-neutral-800 dark:text-zinc-150 mt-0.5">
            {summary.awb}
          </h3>
        </div>
        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
          isDelivered
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-455 border border-emerald-200/50 dark:border-emerald-900/30"
            : "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-455 border border-orange-200/50 dark:border-orange-900/30"
        }`}>
          {summary.status}
        </span>
      </div>

      {/* Highlighted Last Description */}
      <div className="p-4 bg-orange-50/30 dark:bg-orange-950/10 rounded-2xl border border-orange-100/30 dark:border-orange-900/20 text-xs md:text-sm font-bold text-neutral-700 dark:text-zinc-300">
        <p className="text-[10px] text-orange-600 dark:text-orange-450 uppercase tracking-widest mb-1.5">Status Terakhir</p>
        {summary.lastDesc}
      </div>

      {/* Receiver Info Card */}
      <div className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 shadow-sm space-y-4">
        <div className="space-y-3 text-xs">
          <div className="flex flex-col">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-zinc-500 mb-0.5">
              Penerima
            </span>
            <span className="text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-200 break-words">
              {receiverName}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-zinc-500 mb-0.5">
              Alamat / Tujuan
            </span>
            <span className="text-xs md:text-sm font-bold text-neutral-700 dark:text-zinc-300 break-words leading-relaxed">
              {receiverAddr}
            </span>
          </div>
        </div>

        {/* Package Specs Grid */}
        <div className="border-t border-neutral-100 dark:border-zinc-800/80 pt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-neutral-400 dark:text-zinc-500 block mb-0.5">Berat Paket</span>
            <span className="font-bold text-neutral-700 dark:text-zinc-300">{weightStr}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-neutral-400 dark:text-zinc-500 block mb-0.5">Layanan</span>
            <span className="font-bold text-neutral-700 dark:text-zinc-300 uppercase">{summary.service || "Regular"}</span>
          </div>
        </div>

        {/* WhatsApp Share Button */}
        <div className="border-t border-neutral-100 dark:border-zinc-800/80 pt-4">
          <button
            type="button"
            onClick={handleShareWa}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-extrabold rounded-xl transition-all duration-200 cursor-pointer shadow-sm shadow-emerald-600/10"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.37 5.054L2 22l5.138-1.348a9.936 9.936 0 0 0 4.87 1.272h.004c5.505 0 9.99-4.478 9.99-9.984C22.007 6.478 17.521 2 12.012 2zm6.09 14.12c-.25.706-1.464 1.379-2.023 1.466-.497.078-1.144.139-3.327-.767-2.793-1.161-4.577-3.99-4.717-4.178-.14-.188-1.127-1.498-1.127-2.859 0-1.361.713-2.029.967-2.302.253-.274.554-.343.74-.343.185 0 .37.002.532.01.169.008.397-.064.62.474.228.552.78 1.902.848 2.04.068.138.113.3.02.485-.091.188-.137.3-.272.457-.137.156-.289.349-.413.468-.137.13-.28.27-.12.544.16.273.71 1.171 1.523 1.892.657.581 1.212.76 1.523.888.31.13.493.109.676-.1.183-.21.782-.906.993-1.214.21-.309.423-.258.713-.15.29.109 1.843.869 2.161 1.028.318.158.53.238.607.366.077.129.077.747-.174 1.454z" />
            </svg>
            Bagikan Status ke WhatsApp
          </button>
        </div>
      </div>

      {/* Toggle Button for History */}
      {history && history.length > 0 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-neutral-50 dark:bg-zinc-900/60 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-600 dark:text-zinc-300 hover:text-neutral-800 dark:hover:text-zinc-100 text-xs md:text-sm font-extrabold rounded-xl border border-neutral-200/60 dark:border-zinc-800 transition-all duration-200 cursor-pointer shadow-sm"
          >
            {showHistory ? (
              <>
                Sembunyikan Riwayat Perjalanan
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                Lihat Riwayat Perjalanan
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* History Timeline */}
      {showHistory && history && history.length > 0 && (
        <div className="relative pl-6 border-l-2 border-neutral-200/80 dark:border-zinc-800 space-y-6 ml-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {history.map((item, index) => {
            const isLatest = index === 0;
            return (
              <div key={`${item.date}-${index}`} className="relative group">
                {/* Timeline Indicator Node */}
                <span
                  className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full flex items-center justify-center transition-all ${
                    isLatest
                      ? "bg-orange-500 ring-4 ring-orange-500/20 dark:ring-orange-500/30 scale-110"
                      : "bg-neutral-300 dark:bg-zinc-700 group-hover:bg-neutral-400 dark:group-hover:bg-zinc-500"
                  }`}
                >
                  {isLatest && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                </span>

                {/* Checkpoint Detail */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold text-neutral-400 dark:text-zinc-500 tracking-wide uppercase">
                    {item.date}
                  </span>
                  <p className={`text-xs md:text-sm font-bold leading-relaxed ${
                    isLatest ? "text-neutral-800 dark:text-zinc-200" : "text-neutral-600 dark:text-zinc-400"
                  }`}>
                    {item.desc}
                  </p>
                  {item.location && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-neutral-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                      <svg className="w-3 h-3 text-neutral-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {item.location}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
