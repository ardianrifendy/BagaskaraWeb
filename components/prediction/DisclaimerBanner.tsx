import React from "react";

export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed shadow-sm">
      <span className="font-extrabold uppercase tracking-wider block mb-1">⚠️ PENTING: DISCLAIMER DYOR (Do Your Own Research)</span>
      Halaman ini menyajikan analisis statistik atas data historis murni untuk tujuan edukasi dan referensi teknikal dasar. Ini <strong>BUKAN</strong> saran keuangan, rekomendasi investasi, maupun ajakan bertransaksi. Pasar finansial memiliki volatilitas tinggi. Segala risiko keputusan investasi sepenuhnya merupakan tanggung jawab Anda sendiri.
    </div>
  );
}