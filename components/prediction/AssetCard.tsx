import React from "react";
import { formatRupiah } from "@/lib/formatRupiah";

interface AssetCardProps {
  name: string;
  symbol: string;
  priceIdr?: number;
  change24hPct: number;
  change7dPct: number;
  unavailable?: boolean;
  bias: "up" | "down" | "neutral";
}

export default function AssetCard({
  name,
  symbol,
  priceIdr,
  change24hPct,
  change7dPct,
  unavailable,
  bias
}: AssetCardProps) {
  const getBiasLabel = () => {
    if (bias === "up") return { label: "Bias Naik (Bullish)", bg: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" };
    if (bias === "down") return { label: "Bias Turun (Bearish)", bg: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300" };
    return { label: "Bias Sideways (Konsolidasi)", bg: "bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400" };
  };

  const biasInfo = getBiasLabel();

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-neutral-800 dark:text-zinc-150 tracking-tight">{name}</h2>
          <p className="text-[10px] font-black text-neutral-450 uppercase tracking-wider">{symbol}</p>
        </div>
        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wide ${biasInfo.bg}`}>
          {biasInfo.label}
        </span>
      </div>

      <div className="pt-1">
        {unavailable ? (
          <span className="text-sm font-bold text-neutral-400 dark:text-zinc-500 block py-1.5 animate-pulse">
            Data sementara tidak tersedia
          </span>
        ) : (
          <div className="space-y-1">
            <span className="text-2xl md:text-3xl font-black text-neutral-800 dark:text-zinc-100 tracking-tight block">
              {priceIdr !== undefined 
                ? (symbol === "USDIDR" ? `Rp ${priceIdr.toLocaleString("id-ID")}` : formatRupiah(priceIdr)) 
                : "—"}
            </span>
            <div className="flex items-center gap-3 text-xs font-extrabold">
              <span className="text-neutral-400 dark:text-zinc-500 select-none">Perubahan:</span>
              <span className={change24hPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                24j: {change24hPct >= 0 ? "+" : ""}{change24hPct.toFixed(2)}%
              </span>
              <span className={change7dPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                7h: {change7dPct >= 0 ? "+" : ""}{change7dPct.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}