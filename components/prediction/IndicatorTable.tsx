import React from "react";
import { Indicators } from "@/lib/prediction/types";

interface IndicatorTableProps {
  indicators: Indicators;
  isCrypto: boolean;
}

export default function IndicatorTable({ indicators, isCrypto }: IndicatorTableProps) {
  const getNote = (indName: string) => {
    // Cari drivers note yang sesuai di driver list
    // Namun kita bisa buat catatan interpretasi singkat static yang ramah & mendidik
    if (indName === "RSI(14)") {
      const r = indicators.rsi14;
      if (r < 30) return "Sangat Jenuh Jual (Oversold) — Potensi Rebound";
      if (r >= 30 && r < 45) return "Jenuh Jual Ringan — Tekanan jual mereda";
      if (r > 55 && r <= 70) return "Jenuh Beli Ringan — Momentum kenaikan melambat";
      if (r > 70) return "Sangat Jenuh Beli (Overbought) — Rawan Koreksi";
      return "Netral — Kekuatan pasar seimbang";
    }

    if (indName === "Trend MA") {
      const cross = indicators.maCross;
      if (cross === "golden") return "Golden Cross Terdeteksi — Tren Bullish Kuat";
      if (cross === "death") return "Death Cross Terdeteksi — Tren Bearish Kuat";
      
      const vsSma = indicators.priceVsSma20Pct;
      if (vsSma > 0 && indicators.sma20 > indicators.sma50) {
        return `Bullish Align — Harga di atas SMA20 (+${vsSma}%)`;
      }
      if (vsSma < 0 && indicators.sma20 < indicators.sma50) {
        return `Bearish Align — Harga di bawah SMA20 (${vsSma}%)`;
      }
      return "Konsolidasi — Garis rata-rata saling mendekat";
    }

    if (indName === "MACD") {
      const h = indicators.macd.histogram;
      const state = indicators.macd.state;
      if (state === "bullish") {
        return `Bullish Momentum (Hist: +${h}) — Kekuatan beli meningkat`;
      }
      return `Bearish Momentum (Hist: ${h}) — Tekanan jual mendominasi`;
    }

    if (indName === "Volume") {
      const v = indicators.volumeChangePct;
      if (v > 30) return `Volume Melonjak (+${v}%) — Tren saat ini diperkuat`;
      if (v < -30) return `Volume Menyusut (${v}%) — Minat pasar sepi, sideways`;
      return `Stabil (${v >= 0 ? "+" : ""}${v}%) — Aktivitas normal`;
    }

    if (indName === "Fear & Greed") {
      const f = indicators.fearGreed;
      if (f === undefined) return "Tidak berlaku";
      if (f < 25) return `Extreme Fear (${f}) — Kepanikan ekstrem (Zona Akumulasi)`;
      if (f >= 25 && f < 45) return `Fear (${f}) — Kekhawatiran pasar (Diskon Wajar)`;
      if (f > 55 && f <= 75) return `Greed (${f}) — Keserakahan pasar (Waspada Jenuh)`;
      if (f > 75) return `Extreme Greed (${f}) — Euforia ekstrem (Rawan Koreksi)`;
      return `Neutral (${f}) — Pelaku pasar tenang`;
    }

    return "";
  };

  const rows = [
    { name: "RSI(14)", val: indicators.rsi14.toString(), note: getNote("RSI(14)") },
    { name: "Trend MA", val: indicators.maCross === "none" ? "Aligned" : indicators.maCross.toUpperCase(), note: getNote("Trend MA") },
    { name: "MACD Momentum", val: `Hist: ${indicators.macd.histogram}`, note: getNote("MACD") }
  ];

  if (isCrypto) {
    rows.push({ name: "Volume Perubahan", val: `${indicators.volumeChangePct}%`, note: getNote("Volume") });
    if (indicators.fearGreed !== undefined) {
      rows.push({ name: "Sentimen Fear & Greed", val: indicators.fearGreed.toString(), note: getNote("Fear & Greed") });
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between border-b border-neutral-105 dark:border-zinc-850 pb-2.5 select-none">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-zinc-200">
          Metrik & Indikator Teknikal
        </h3>
        <span className="text-[9px] font-extrabold text-neutral-450 uppercase">Data Real-Time</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-zinc-850 text-[10px] font-extrabold text-neutral-450 uppercase select-none">
              <th className="py-2.5 pr-3">Indikator</th>
              <th className="py-2.5 px-3 text-center">Nilai</th>
              <th className="py-2.5 pl-3">Interpretasi Statistik</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-zinc-850 text-xs font-extrabold text-neutral-700 dark:text-zinc-300">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-neutral-50/40 dark:hover:bg-zinc-850/20 transition-colors">
                <td className="py-3 pr-3 text-neutral-500 dark:text-zinc-400 font-bold">{row.name}</td>
                <td className="py-3 px-3 text-center font-black">{row.val}</td>
                <td className="py-3 pl-3 text-neutral-800 dark:text-zinc-200 font-medium leading-relaxed">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}