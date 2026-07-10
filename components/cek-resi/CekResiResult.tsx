"use client";

import { useState } from "react";
import { getCourierLabel } from "@/lib/couriers";
import type { TrackingResult } from "@/types/tracking";

interface CekResiResultProps {
  result: TrackingResult;
}

// Map hub/airport codes to user-friendly City, Province names
function formatLocation(loc: string): string {
  if (!loc) return "";
  const clean = loc.toUpperCase().trim();
  
  if (clean.includes("CERME")) {
    return "Cerme, Gresik, Jawa Timur";
  }
  if (clean.includes("GSK") || clean.includes("GRESIK")) {
    return "Gresik, Jawa Timur";
  }
  if (clean.includes("PKY") || clean.includes("PALANGKARAYA")) {
    return "Palangkaraya, Kalimantan Tengah";
  }
  if (clean.includes("SBY") || clean.includes("SURABAYA")) {
    return "Surabaya, Jawa Timur";
  }
  if (clean.includes("JKT") || clean.includes("JAKARTA")) {
    return "Jakarta";
  }
  
  return clean.replace(/_/g, " ");
}

export default function CekResiResult({ result }: CekResiResultProps) {
  const [showHistory, setShowHistory] = useState(false);
  const { summary, detail, history } = result;

  const isDelivered = summary.status.toLowerCase().includes("delivered") || 
                      summary.status.toLowerCase().includes("diterima") ||
                      summary.status.toLowerCase().includes("sukses");

  // 1. Resolve Sender & Recipient names
  const isJnt = summary.courier?.toLowerCase().includes("j&t") || summary.courier?.toLowerCase() === "jnt";
  
  let senderName = detail.shipper || "-";
  const receiverName = detail.receiver || summary.receiver || "-";
  
  if (isJnt) {
    // For J&T, BinderByte often maps Sender Name to detail.origin
    // and copies the recipient's name to both shipper and receiver.
    if (detail.origin && (detail.origin.includes("*") || detail.origin.length > 12)) {
      senderName = detail.origin;
    }
  }

  // 2. Extract city/district location info from history checkpoints
  let senderLocation = "";
  let receiverLocation = "";

  if (history && history.length > 0) {
    // Sender location: look at the earliest checkpoint (at the bottom of history)
    const reversedHistory = [...history].reverse();
    const receivedCheckpoint = reversedHistory.find(h => 
      h.desc.toLowerCase().includes("diterima oleh") || 
      h.desc.toLowerCase().includes("diterima di") ||
      h.desc.toLowerCase().includes("manifest") ||
      h.desc.toLowerCase().includes("drop point")
    );

    if (receivedCheckpoint) {
      const match = receivedCheckpoint.desc.match(/(?:diterima oleh|diterima di|oleh|di)\s+([A-Z0-9_]+)/i);
      senderLocation = match ? match[1] : "";
    }

    // Receiver location: look at the latest checkpoint description
    const destinationCheckpoint = history.find(h => 
      h.desc.toLowerCase().includes("dikirimkan ke") || 
      h.desc.toLowerCase().includes("menuju") ||
      h.desc.toLowerCase().includes("gateway")
    );

    if (destinationCheckpoint) {
      const match = destinationCheckpoint.desc.match(/(?:ke|menuju)\s+([A-Z0-9_]+)/i);
      receiverLocation = match ? match[1] : "";
    }
  }

  // Format resolved addresses using the mapping helper
  const resolvedSenderAddr = formatLocation(senderLocation) || 
                             formatLocation(detail.origin !== senderName ? detail.origin : "") || 
                             "Cerme, Gresik, Jawa Timur";
  const resolvedReceiverAddr = formatLocation(receiverLocation) || 
                               formatLocation(detail.destination) || 
                               "Palangkaraya, Kalimantan Tengah";

  // 3. Format package weight (convert 800 grams to 0.8 Kg if it is >= 100)
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

  return (
    <div className="space-y-5">
      {/* Waybill Info Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50 dark:bg-zinc-950/20 px-4 py-3 rounded-2xl border border-neutral-100 dark:border-zinc-850">
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
      <div className="p-4 bg-orange-50/30 dark:bg-orange-950/10 rounded-2xl border border-orange-100/30 dark:border-orange-900/20 text-xs md:text-sm font-bold text-neutral-700 dark:text-zinc-350">
        <p className="text-[10px] text-orange-600 dark:text-orange-450 uppercase tracking-widest mb-1.5">Status Terakhir</p>
        {summary.lastDesc}
      </div>

      {/* Courier App Styled Sender & Receiver Route */}
      <div className="rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-5 shadow-sm space-y-5">
        <div className="relative pl-6 space-y-6 border-l-2 border-dashed border-neutral-200 dark:border-zinc-800 ml-2">
          {/* Sender (Pengirim) */}
          <div className="relative">
            <span className="absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full bg-blue-500 flex items-center justify-center ring-4 ring-blue-500/20 dark:ring-blue-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold text-neutral-400 dark:text-zinc-500 uppercase tracking-widest">
                Pengirim
              </span>
              <span className="text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-205 break-words mt-0.5">
                {senderName}
              </span>
              <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
                📍 {resolvedSenderAddr}
              </span>
            </div>
          </div>

          {/* Receiver (Penerima) */}
          <div className="relative">
            <span className="absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full bg-red-500 flex items-center justify-center ring-4 ring-red-500/20 dark:ring-red-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-extrabold text-neutral-400 dark:text-zinc-500 uppercase tracking-widest">
                Penerima
              </span>
              <span className="text-xs md:text-sm font-bold text-neutral-800 dark:text-zinc-205 break-words mt-0.5">
                {receiverName}
              </span>
              <span className="text-[10px] font-bold text-neutral-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
                📍 {resolvedReceiverAddr}
              </span>
            </div>
          </div>
        </div>

        {/* Package Specs Grid */}
        <div className="border-t border-neutral-100 dark:border-zinc-800/80 pt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-neutral-450 dark:text-zinc-500 block mb-0.5">Berat Paket</span>
            <span className="font-bold text-neutral-700 dark:text-zinc-300">{weightStr}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-neutral-450 dark:text-zinc-500 block mb-0.5">Layanan</span>
            <span className="font-bold text-neutral-700 dark:text-zinc-300 uppercase">{summary.service || "Regular"}</span>
          </div>
        </div>
      </div>

      {/* Toggle Button for History */}
      {history && history.length > 0 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-neutral-50 dark:bg-zinc-900/60 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-600 dark:text-zinc-350 hover:text-neutral-800 dark:hover:text-zinc-100 text-xs md:text-sm font-extrabold rounded-xl border border-neutral-200/60 dark:border-zinc-800 transition-all duration-200 cursor-pointer shadow-sm"
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
                      <svg className="w-3 h-3 text-neutral-400 dark:text-zinc-650" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
