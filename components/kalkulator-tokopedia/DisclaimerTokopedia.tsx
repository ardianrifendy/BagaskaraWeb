import React from 'react';
import tarifBaruData from '../../data/tarif/tokopedia-2026-05-18.json';

interface DisclaimerTokopediaProps {
  useTarifLama?: boolean;
}

export const DisclaimerTokopedia: React.FC<DisclaimerTokopediaProps> = ({ useTarifLama = false }) => {
  const schemaVersion = useTarifLama ? '10 Juni 2025' : tarifBaruData.schemaVersion;
  const berlakuMulai = useTarifLama ? '10 Juni 2025' : '18 Mei 2026';

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col gap-3 text-xs leading-relaxed transition-colors">
      <div className="flex items-center gap-2 text-neutral-800 dark:text-zinc-200 font-black text-xs uppercase tracking-wider">
        <span>⚖️</span>
        <span>Disclaimer &amp; Ketentuan Penggunaan</span>
      </div>

      <p className="text-neutral-600 dark:text-zinc-400 font-medium text-[11px] leading-relaxed">
        Estimasi ini menggunakan tarif default per <strong>{berlakuMulai}</strong> dan belum memperhitungkan diskon GMV Max, Growth Xtra, biaya iklan, atau kebijakan khusus toko Anda. Tarif platform dapat berubah sewaktu-waktu. Selalu verifikasi di Seller Center masing-masing platform sebelum mengambil keputusan harga. Bagaskara Cell tidak bertanggung jawab atas kerugian akibat penggunaan kalkulator ini.
      </p>

      <div className="border-t border-neutral-100 dark:border-zinc-800 pt-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-extrabold text-neutral-400 dark:text-zinc-500">
        <span>Sumber data: <a href={tarifBaruData.sumberResmi} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">Tokopedia Seller Center</a></span>
        <span>Terakhir diperbarui: {schemaVersion}</span>
        <span>Skema: {berlakuMulai}</span>
      </div>
    </div>
  );
};
