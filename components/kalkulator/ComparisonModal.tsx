"use client";

import React from 'react';
import { StoreProfile, ProductInput } from '@/lib/kalkulator/engine/types';
import { calculateFees } from '@/lib/kalkulator/engine/calc';
import { formatIDR } from '@/lib/kalkulator/format';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductInput;
  profile: StoreProfile;
  activePrice: number; // Harga dasar pembanding (dari input atau hasil reverse)
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  product,
  profile,
  activePrice
}) => {
  if (!isOpen) return null;

  // Gunakan fallback Rp 100.000 jika harga 0
  const comparisonPrice = activePrice > 0 ? activePrice : 100000;

  // Buat 4 skenario profil toko
  const scenarios: { label: string; profile: StoreProfile }[] = [
    {
      label: 'Tanpa Program (Normal)',
      profile: { ...profile, joinedGOX: false, promoProgram: 'none' }
    },
    {
      label: 'Hanya GOX',
      profile: { ...profile, joinedGOX: true, promoProgram: 'none' }
    },
    {
      label: 'GOX + Promo XTRA',
      profile: { ...profile, joinedGOX: true, promoProgram: 'xtra' }
    },
    {
      label: 'GOX + Promo XTRA+',
      profile: { ...profile, joinedGOX: true, promoProgram: 'xtra_plus' }
    }
  ];

  // Hitung hasil untuk tiap skenario menggunakan parameter produk aktif
  const results = scenarios.map((scen) => {
    const calc = calculateFees(
      {
        ...product,
        cost: product.cost, // modal aktif
        qty: product.qty || 1
      },
      scen.profile,
      comparisonPrice
    );
    return {
      label: scen.label,
      profile: scen.profile,
      calc
    };
  });

  // Cari skenario dengan Net Diterima tertinggi (potongan terkecil)
  const highestNetIdx = results.reduce((maxIdx, res, idx, arr) => 
    res.calc.netReceived > arr[maxIdx].calc.netReceived ? idx : maxIdx, 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] transition-all duration-300 border border-neutral-100 overflow-hidden text-neutral-850 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-150 bg-neutral-50/50">
          <div>
            <h3 className="text-xs font-black tracking-wider text-neutral-850 uppercase select-none">Bandingkan Skenario Program</h3>
            <span className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-wider block mt-0.5 select-none">
              Simulasi berdasarkan harga produk saat ini: {formatIDR(comparisonPrice)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-xl p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 flex flex-col gap-4 bg-neutral-50/30">
          <div className="bg-orange-50/35 border border-orange-100 rounded-xl p-3 text-[10px] text-neutral-500 leading-normal font-extrabold select-none">
            💡 <strong>Info:</strong> Potongan persentase &amp; nominal bersih di bawah dihitung menggunakan diskon seller, kuantitas, asuransi, dan modal produk yang sedang Anda input.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((res, idx) => {
              // Deteksi jika skenario ini adalah profil aktif saat ini
              const isCurrentProfile =
                profile.joinedGOX === res.profile.joinedGOX &&
                profile.promoProgram === res.profile.promoProgram;

              const isBestNet = idx === highestNetIdx;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all duration-250 flex flex-col gap-3 ${
                    isCurrentProfile
                      ? 'border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/10 shadow-md'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 shadow-sm'
                  }`}
                >
                  {/* Title & Tags */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-neutral-800 uppercase tracking-tight">
                        {res.label}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {isCurrentProfile && (
                          <span className="text-[7.5px] bg-orange-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider shadow-sm shadow-orange-150">
                            Aktif
                          </span>
                        )}
                        {isBestNet && (
                          <span className="text-[7.5px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider shadow-sm shadow-emerald-150">
                            Terbaik
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-black text-rose-600 whitespace-nowrap bg-rose-50 border border-rose-100/50 px-2 py-0.5 rounded-md">
                      -{res.calc.totalFeesPct}%
                    </span>
                  </div>

                  {/* Core Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-extrabold border-t border-dashed border-neutral-150 pt-2.5 mt-0.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-neutral-400 uppercase">Dana Masuk</span>
                      <span className="text-neutral-800 text-xs font-black bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200/50 w-fit">
                        {formatIDR(res.calc.netReceived)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-neutral-400 uppercase">Biaya Admin</span>
                      <span className="text-rose-600 text-xs font-black bg-rose-50/20 px-1.5 py-0.5 rounded border border-rose-100/35 w-fit">
                        {formatIDR(res.calc.totalFees)}
                      </span>
                    </div>
                  </div>

                  {/* Profit Metric */}
                  <div className="flex justify-between items-center bg-neutral-50/60 border border-neutral-200/40 p-2 rounded-lg text-[10px] font-extrabold mt-1">
                    <span className="text-neutral-450 uppercase">Estimasi Profit:</span>
                    <span className={`font-black ${res.calc.profit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatIDR(res.calc.profit)} ({res.calc.marginPct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-neutral-150 bg-neutral-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-900 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all uppercase tracking-wider cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
