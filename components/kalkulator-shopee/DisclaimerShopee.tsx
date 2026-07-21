import React from 'react';
import shopeeFees from '../../lib/kalkulator/shopee_fees_2026.json';

export const DisclaimerShopee: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col gap-3 text-xs leading-relaxed transition-colors">
      <div className="flex items-center gap-2 text-neutral-800 dark:text-zinc-200 font-black text-xs uppercase tracking-wider">
        <span>⚖️</span>
        <span>Disclaimer &amp; Ketentuan Penggunaan</span>
      </div>

      <p className="text-neutral-600 dark:text-zinc-400 font-medium text-[11px] leading-relaxed text-justify">
        Estimasi ini dihitung menggunakan tarif biaya administrasi resmi Shopee per <strong>{shopeeFees.meta.effective_dates.biaya_administrasi}</strong> dan biaya program promosi per <strong>{shopeeFees.meta.effective_dates.gratis_ongkir_xtra}</strong>. Perhitungan sudah mencakup PPN 12% sesuai regulasi terbaru. Tarif dapat berubah sewaktu-waktu oleh pihak Shopee. Selalu verifikasi perhitungan akhir di Seller Center Shopee sebelum menetapkan harga jual produk Anda. Bagaskara Cell tidak bertanggung jawab atas segala bentuk kerugian finansial yang timbul dari penggunaan kalkulator ini.
      </p>

      <div className="border-t border-neutral-100 dark:border-zinc-800 pt-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-extrabold text-neutral-400 dark:text-zinc-500">
        <span>Sumber resmi: <a href={shopeeFees.meta.sources.biaya_admin_resmi} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline">Shopee Seller Education</a></span>
        <span>Terakhir diperbarui: {shopeeFees.meta.scraped_at}</span>
        <span>Sertifikasi PPN: 12% (Final)</span>
      </div>
    </div>
  );
};
