import React from 'react';

interface WarningBannerProps {
  profit: number;
  marginPct: number;
  isNewStore: boolean;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ profit, marginPct, isNewStore }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.abs(Math.round(num)));
  };

  if (profit < 0) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 shadow-sm">
        <span className="text-rose-600 font-extrabold text-sm select-none">⚠️</span>
        <div className="flex-1 text-xs text-rose-700 leading-relaxed font-extrabold">
          Rugi <span className="underline decoration-rose-500 decoration-2">Rp {formatNumber(profit)}</span> per pesanan. Naikkan harga atau kurangi program promosi Anda.
        </div>
      </div>
    );
  }

  if (marginPct < 10) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 shadow-sm">
        <span className="text-amber-600 font-extrabold text-sm select-none">⚠️</span>
        <div className="flex-1 text-xs text-amber-700 leading-relaxed font-extrabold">
          Margin sangat tipis ({marginPct}%). Rawan rugi jika ada retur/pengembalian barang atau ada tambahan ongkir dari logistik.
        </div>
      </div>
    );
  }

  if (isNewStore) {
    return (
      <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3.5 flex items-start gap-2.5 shadow-sm">
        <span className="text-orange-600 font-extrabold text-sm select-none">ℹ️</span>
        <div className="flex-1 text-xs text-neutral-600 leading-relaxed font-extrabold">
          Tarif toko baru aktif — biaya admin, proses pesanan, & GOX dinonaktifkan sementara (sebagian potongan belum berlaku).
        </div>
      </div>
    );
  }

  return null;
};
