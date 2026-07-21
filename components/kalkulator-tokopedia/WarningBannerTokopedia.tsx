import React from 'react';
import { formatIDR } from '../../lib/kalkulator/format';

interface WarningBannerTokopediaProps {
  profit: number;
  marginPct: number;
  isCapped: boolean;
  hargaJualUnit: number;
  qty: number;
  isEmpty?: boolean;
}

export const WarningBannerTokopedia: React.FC<WarningBannerTokopediaProps> = ({
  profit,
  marginPct,
  isCapped,
  hargaJualUnit,
  qty,
  isEmpty = false
}) => {
  if (isEmpty) return null;

  const isLoss = profit < 0;
  const isThinMargin = !isLoss && marginPct < 5 && marginPct > 0;
  const isHighValueThreshold = hargaJualUnit >= 21600000;

  if (!isLoss && !isThinMargin && !isCapped && !isHighValueThreshold) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Banner Merah: Rugi */}
      {isLoss && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-extrabold flex items-start gap-2.5 shadow-sm">
          <span className="text-base leading-none">⚠️</span>
          <div>
            <span className="font-black block uppercase text-[10px] tracking-wider text-rose-800">PERINGATAN KERUGIAN!</span>
            <span>Anda mengalami kerugian sebesar <strong className="text-rose-900 font-black">{formatIDR(Math.abs(profit))}</strong> ({qty > 1 ? `total ${qty} item` : 'per unit'}). Naikkan harga jual atau kurangi beban biaya.</span>
          </div>
        </div>
      )}

      {/* Banner Kuning: Margin Tipis (< 5%) */}
      {isThinMargin && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-extrabold flex items-start gap-2.5 shadow-sm">
          <span className="text-base leading-none">⚠️</span>
          <div>
            <span className="font-black block uppercase text-[10px] tracking-wider text-amber-900">MARGIN SANGAT TIPIS ({marginPct}%)</span>
            <span>Margin keuntungan di bawah 5%. Angka ini belum memperhitungkan biaya iklan (TopAds/TikTok Ads) &amp; biaya operasional toko.</span>
          </div>
        </div>
      )}

      {/* Info Biru: Komisi Kena Cap Rp 650.000 */}
      {isCapped && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-2xl text-xs font-extrabold flex items-start gap-2.5 shadow-sm">
          <span className="text-base leading-none">💡</span>
          <div>
            <span className="font-black block uppercase text-[10px] tracking-wider text-sky-900">BATAS MAKSIMUM TARIF (CAP)</span>
            <span>Komisi dinamis atau platform telah mencapai batas maksimal **Rp 650.000 per item**. Tambahan harga di atas threshold tidak menambah komisi.</span>
          </div>
        </div>
      )}

      {/* Info: Threshold Rp 21.6 Juta */}
      {isHighValueThreshold && !isCapped && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-extrabold flex items-start gap-2.5 shadow-sm">
          <span className="text-base leading-none">💎</span>
          <div>
            <span className="font-black block uppercase text-[10px] tracking-wider text-emerald-900">PRODUK HIGH VALUE (&gt; Rp 21.600.000)</span>
            <span>Pada tingkat harga ini, cap Rp 650.000 mulai aktif untuk kategori tarif 3% (Telepon &amp; Elektronik).</span>
          </div>
        </div>
      )}
    </div>
  );
};
